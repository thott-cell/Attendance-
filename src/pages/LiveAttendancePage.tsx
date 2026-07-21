import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanFace,
  CheckCircle2,
  Clock,
  CalendarClock,
  XCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Webcam from '../components/ui/Webcam';
import { useToast } from '../contexts/ToastContext';
import {
  watchActiveSession,
  getStudents,
  hasStudentAttended,
  addAttendanceRecord,
  getRecordsForSession,
} from '../services/firestore';
import { detectFace, compareDescriptors, loadFaceModels, MATCH_THRESHOLD } from '../services/faceApi';
import type { AttendanceSession, Student, AttendanceRecord } from '../types';
import { isWithinSessionWindow, formatTime } from '../utils/helpers';

export default function LiveAttendancePage() {
  const { toast } = useToast();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [modelsReady, setModelsReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastMatch, setLastMatch] = useState<{ student: Student; at: string } | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]); // in-memory dedupe buffer

  const studentsRef = useRef<Student[]>([]);
  const sessionRef = useRef<AttendanceSession | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    loadFaceModels()
      .then(() => setModelsReady(true))
      .catch(() => toast('Failed to load face models.', 'error'));
    getStudents().then(setStudents).catch(() => {});
    const unsub = watchActiveSession((s) => {
      setSession(s);
      if (s) getRecordsForSession(s.id).then(setRecords).catch(() => {});
      else setRecords([]);
    });
    return () => unsub();
  }, [toast]);

  async function handleFrame(_blob: Blob, dataUrl: string) {
    if (scanningRef.current) return;
    const s = sessionRef.current;
    if (!s || !s.active) return;

    // Enforce time window.
    const window = isWithinSessionWindow(s.date, s.startTime, s.endTime);
    if (window !== 'open') return;

    scanningRef.current = true;
    setScanning(true);
    try {
      const img = await loadImage(dataUrl);
      const det = await detectFace(img);
      if (!det) return;

      // Find best match among registered students.
      let best: { student: Student; dist: number } | null = null;
      for (const st of studentsRef.current) {
        if (!st.descriptor || st.descriptor.length === 0) continue;
        const dist = compareDescriptors(det.descriptor, st.descriptor);
        if (!best || dist < best.dist) best = { student: st, dist };
      }
      if (!best || best.dist > MATCH_THRESHOLD) {
        toast('Student not recognized.', 'info');
        return;
      }

      const matched = best.student;
      if (recentIds.includes(matched.id)) return; // local dedupe
      if (await hasStudentAttended(s.id, matched.id)) {
        setRecentIds((r) => [...r, matched.id]);
        toast('Attendance already recorded for this session.', 'info');
        return;
      }

      const now = new Date().toISOString();
      const recordId = await addAttendanceRecord({
        studentId: matched.id,
        sessionId: s.id,
        courseCode: s.courseCode,
        courseTitle: s.courseTitle,
        studentName: matched.fullName,
        matricNumber: matched.matricNumber,
        department: matched.department,
        level: matched.level,
        imageUrl: matched.imageUrl,
        checkInTime: now,
        status: 'Present',
      });

      if (!recordId) {
        // Server-side dedupe prevented a duplicate.
        setRecentIds((r) => [...r, matched.id]);
        toast('Attendance already recorded for this session.', 'info');
        return;
      }

     setRecords((r) => [
  {
    id: Math.random().toString(36).slice(2),
    studentId: matched.id,
    sessionId: s.id,
    lecturerId: s.lecturerId, // <-- add this
    courseCode: s.courseCode,
    courseTitle: s.courseTitle,
    studentName: matched.fullName,
    matricNumber: matched.matricNumber,
    department: matched.department,
    level: matched.level,
    imageUrl: matched.imageUrl,
    checkInTime: now,
    status: 'Present',
  },
  ...r,
]);
      setLastMatch({ student: matched, at: now });
      toast('Attendance recorded successfully.', 'success');
      setTimeout(() => setLastMatch(null), 5000);
    } finally {
      scanningRef.current = false;
      setScanning(false);
    }
  }

  const window = session ? isWithinSessionWindow(session.date, session.startTime, session.endTime) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Webcam + status */}
      <div className="lg:col-span-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300">
                <ScanFace className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
                  Live Recognition
                </h3>
                <p className="text-xs text-ink-400">
                  {modelsReady ? 'Models ready' : 'Loading models…'}
                </p>
              </div>
            </div>
            {session?.active && (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Session live
              </span>
            )}
          </div>

          {!session?.active ? (
            <div className="grid place-items-center rounded-2xl bg-ink-100/60 dark:bg-ink-700/30 py-20 text-center">
              <CalendarClock className="h-10 w-10 text-ink-400" />
              <p className="mt-3 text-sm font-medium text-ink-500 dark:text-ink-300">
                No active attendance session.
              </p>
              <p className="text-xs text-ink-400">Start one from the Attendance Session page.</p>
            </div>
          ) : window !== 'open' ? (
            <div
              className={`grid place-items-center rounded-2xl py-20 text-center ${
                window === 'before'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              {window === 'before' ? (
                <>
                  <Clock className="h-10 w-10" />
                  <p className="mt-3 text-sm font-semibold">Attendance has not started.</p>
                  <p className="text-xs">Session opens at {session.startTime} on {session.date}.</p>
                </>
              ) : (
                <>
                  <XCircle className="h-10 w-10" />
                  <p className="mt-3 text-sm font-semibold">Attendance is closed.</p>
                  <p className="text-xs">Session ended at {session.endTime} on {session.date}.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="relative">
                <Webcam autoCapture interval={2500} onCapture={handleFrame} />
                {scanning && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-ink-950/70 px-3 py-1.5 text-xs text-white">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning…
                  </div>
                )}
              </div>

              <AnimatePresence>
                {lastMatch && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 p-4 text-white shadow-glow"
                  >
                    <div className="relative">
                      <img
                        src={lastMatch.student.imageUrl}
                        alt={lastMatch.student.fullName}
                        className="h-14 w-14 rounded-xl object-cover ring-2 ring-white/60"
                      />
                      <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{lastMatch.student.fullName}</p>
                      <p className="text-xs text-emerald-100">
                        {lastMatch.student.matricNumber} · {lastMatch.student.department} · {lastMatch.student.level} Level
                      </p>
                      <p className="text-xs text-emerald-100">Checked in at {formatTime(lastMatch.at)}</p>
                    </div>
                    <UserCheck className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </Card>
      </div>

      {/* Live check-in list */}
      <div className="lg:col-span-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
              Checked-in Students
            </h3>
            <span className="rounded-full bg-brand-100 dark:bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
              {records.length}
            </span>
          </div>
          {session && (
            <p className="mb-3 text-xs text-ink-400">
              {session.courseCode} — {session.courseTitle}
            </p>
          )}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {records.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 rounded-xl bg-ink-50/70 dark:bg-ink-700/30 p-3"
                >
                  <img src={r.imageUrl} alt={r.studentName} className="h-10 w-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-ink-700 dark:text-ink-100">
                      {r.studentName}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {r.matricNumber} · {r.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Present
                    </span>
                    <span className="text-[11px] text-ink-400">{formatTime(r.checkInTime)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {records.length === 0 && (
              <p className="py-10 text-center text-sm text-ink-400">
                Waiting for the first check-in…
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
