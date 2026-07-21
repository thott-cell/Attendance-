import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  ChevronRight,
  CalendarClock,
  BookOpen,
  ArrowLeft,
  Download,
  CheckCircle2,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { StatCardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import {
  getAttendanceRecords,
  getSessions,
  getStudents,
  getRecordsForSession,
} from '../services/firestore';
import type { AttendanceRecord, AttendanceSession, Student } from '../types';
import { formatDate, toMillis } from '../utils/helpers';

type View = 'courses' | 'sessions' | 'records';

export default function ReportsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>('courses');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, sess] = await Promise.all([
          getStudents(),
          getAttendanceRecords(),
          getSessions(),
        ]);
        setStudents(s);
        setRecords(r);
        setSessions(sess.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Courses created by this lecturer (derived from sessions).
  const courses = useMemo(() => {
    const map = new Map<string, { code: string; title: string; sessionCount: number; recordCount: number }>();
    sessions.forEach((s) => {
      const existing = map.get(s.courseCode);
      if (existing) {
        existing.sessionCount += 1;
      } else {
        map.set(s.courseCode, {
          code: s.courseCode,
          title: s.courseTitle,
          sessionCount: 0,
          recordCount: 0,
        });
      }
    });
    records.forEach((r) => {
      const c = map.get(r.courseCode);
      if (c) c.recordCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [sessions, records]);

  // Sessions for a selected course.
  const sessionsForCourse = useMemo(() => {
    if (!selectedCourse) return [];
    return sessions.filter((s) => s.courseCode === selectedCourse);
  }, [sessions, selectedCourse]);

  async function openSession(s: AttendanceSession) {
    setSelectedSession(s);
    setView('records');
    setLoadingRecords(true);
    try {
      const recs = await getRecordsForSession(s.id);
      setSessionRecords(recs);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load records', 'error');
    } finally {
      setLoadingRecords(false);
    }
  }

  function openCourse(code: string) {
    setSelectedCourse(code);
    setView('sessions');
  }

  function backToCourses() {
    setSelectedCourse(null);
    setSelectedSession(null);
    setSessionRecords([]);
    setView('courses');
  }

  function backToSessions() {
    setSelectedSession(null);
    setSessionRecords([]);
    setView('sessions');
  }

  // Overall stats (scoped to lecturer via the scoped queries above).
  const totalStudents = students.length;
  const totalAttendance = records.length;
  const totalAbsentees = Math.max(
    totalStudents - new Set(records.map((r) => r.studentId)).size,
    0
  );
  const attendancePct = totalStudents
    ? Math.round((new Set(records.map((r) => r.studentId)).size / totalStudents) * 100)
    : 0;

  function exportSessionCsv() {
    if (!selectedSession) return;
    const headers = ['Name', 'Matric', 'Course', 'Department', 'Level', 'Date', 'Time', 'Status'];
    const rows = sessionRecords.map((r) => [
      r.studentName,
      r.matricNumber,
      r.courseCode,
      r.department,
      r.level,
      r.checkInTime.slice(0, 10),
      r.checkInTime.slice(11, 16),
      r.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSession.courseCode}-${selectedSession.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Session report exported.', 'success');
  }

  return (
    <div className="space-y-6">
      {/* Overall stats — always visible */}
      <div className="print:hidden">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : (
              <>
                <StatCard label="Total Students" value={totalStudents} icon={<Users className="h-5 w-5" />} accent="brand" />
                <StatCard label="Total Attendance" value={totalAttendance} icon={<UserCheck className="h-5 w-5" />} accent="emerald" />
                <StatCard label="Total Absentees" value={totalAbsentees} icon={<UserX className="h-5 w-5" />} accent="rose" />
                <StatCard label="Attendance %" value={`${attendancePct}%`} icon={<TrendingUp className="h-5 w-5" />} accent="amber" />
              </>
            )}
        </div>
      </div>

      {/* Breadcrumb */}
      {view !== 'courses' && (
        <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-300 print:hidden">
          <button onClick={backToCourses} className="hover:text-brand-600 dark:hover:text-brand-400 font-medium">
            Courses
          </button>
          <ChevronRight className="h-4 w-4" />
          {view === 'sessions' && (
            <span className="font-medium text-ink-700 dark:text-ink-100">{selectedCourse}</span>
          )}
          {view === 'records' && (
            <>
              <button onClick={backToSessions} className="hover:text-brand-600 dark:hover:text-brand-400 font-medium">
                {selectedCourse}
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-ink-700 dark:text-ink-100">
                {selectedSession?.date}
              </span>
            </>
          )}
        </div>
      )}

      {/* Print header */}
      {view === 'records' && selectedSession && (
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">BioAttend — Session Report</h1>
          <p className="text-sm">
            {selectedSession.courseCode} — {selectedSession.courseTitle} · {selectedSession.date}
          </p>
          <p className="text-sm">
            Generated {new Date().toLocaleString()} · {sessionRecords.length} check-ins
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ---- Courses view ---- */}
        {view === 'courses' && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
                    Your Courses
                  </h3>
                  <p className="text-xs text-ink-400">
                    Click a course to view its attendance sessions
                  </p>
                </div>
              </div>
              {loading ? (
                <TableSkeleton />
              ) : courses.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-400">
                  No courses yet. Create an attendance session first.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((c, i) => (
                    <motion.button
                      key={c.code}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openCourse(c.code)}
                      className="group rounded-2xl border border-ink-200/70 dark:border-ink-700/60 bg-white/60 dark:bg-ink-800/40 p-4 text-left transition hover:border-brand-400 hover:shadow-glass"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-ink-700 dark:text-ink-100">{c.code}</p>
                          <p className="text-xs text-ink-400">{c.title}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-ink-500 dark:text-ink-300">
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" /> {c.sessionCount} sessions
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5" /> {c.recordCount} check-ins
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ---- Sessions view ---- */}
        {view === 'sessions' && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={backToCourses}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 dark:bg-ink-700/60 text-ink-500 hover:text-brand-600"
                    aria-label="Back to courses"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
                      {selectedCourse} — Sessions
                    </h3>
                    <p className="text-xs text-ink-400">
                      Click a session to view its attendance records
                    </p>
                  </div>
                </div>
              </div>
              {sessionsForCourse.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-400">
                  No sessions for this course yet.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sessionsForCourse.map((s, i) => {
                    const count = records.filter((r) => r.sessionId === s.id).length;
                    return (
                      <motion.button
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => openSession(s)}
                        className="group rounded-2xl border border-ink-200/70 dark:border-ink-700/60 bg-white/60 dark:bg-ink-800/40 p-4 text-left transition hover:border-brand-400 hover:shadow-glass"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-ink-700 dark:text-ink-100">
                              {s.date}
                            </p>
                            <p className="text-xs text-ink-400">
                              {s.startTime}–{s.endTime} · {s.venue}
                            </p>
                          </div>
                          <span
                            className={
                              s.active
                                ? 'rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300'
                                : 'rounded-full bg-ink-100 dark:bg-ink-700/60 px-2.5 py-1 text-[11px] font-medium text-ink-500'
                            }
                          >
                            {s.active ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-ink-500 dark:text-ink-300">
                          <span className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5" /> {count} check-ins
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" /> Created {formatDate(s.createdAt ?? s.date)}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ---- Records view ---- */}
        {view === 'records' && selectedSession && (
          <motion.div
            key="records"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                  <button
                    onClick={backToSessions}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 dark:bg-ink-700/60 text-ink-500 hover:text-brand-600"
                    aria-label="Back to sessions"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
                      {selectedSession.courseCode} — {selectedSession.date}
                    </h3>
                    <p className="text-xs text-ink-400">
                      {selectedSession.courseTitle} · {selectedSession.startTime}–{selectedSession.endTime} · {selectedSession.venue}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={exportSessionCsv} icon={<Download className="h-4 w-4" />}>
                    Export CSV
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
                    Print
                  </Button>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{sessionRecords.length} students checked in for this session</span>
              </div>

              {loadingRecords ? (
                <TableSkeleton />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-200/70 dark:border-ink-700/60 text-left">
                        <th className="px-3 py-2 font-semibold text-ink-500">Photo</th>
                        <th className="px-3 py-2 font-semibold text-ink-500">Name</th>
                        <th className="px-3 py-2 font-semibold text-ink-500">Matric</th>
                        <th className="px-3 py-2 font-semibold text-ink-500">Department</th>
                        <th className="px-3 py-2 font-semibold text-ink-500">Level</th>
                        <th className="px-3 py-2 font-semibold text-ink-500">Time</th>
                        <th className="px-3 py-2 font-semibold text-ink-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-ink-400">
                            No check-ins recorded for this session.
                          </td>
                        </tr>
                      ) : (
                        sessionRecords.map((r) => (
                          <tr key={r.id} className="border-b border-ink-100 dark:border-ink-800">
                            <td className="px-3 py-2">
                              <img src={r.imageUrl} alt={r.studentName} className="h-9 w-9 rounded-full object-cover" />
                            </td>
                            <td className="px-3 py-2 font-medium text-ink-700 dark:text-ink-100">{r.studentName}</td>
                            <td className="px-3 py-2">{r.matricNumber}</td>
                            <td className="px-3 py-2">{r.department}</td>
                            <td className="px-3 py-2">{r.level}</td>
                            <td className="px-3 py-2">{r.checkInTime.slice(11, 16)}</td>
                            <td className="px-3 py-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                Present
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
