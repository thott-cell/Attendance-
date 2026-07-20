import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  PlusCircle,
  PlayCircle,
  StopCircle,
  Clock,
  MapPin,
  User,
  BookOpen,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import {
  createSession,
  getSessions,
  startSession,
  endSession,
  watchActiveSession,
} from '../services/firestore';
import type { AttendanceSession } from '../types';
import { formatDate, isWithinSessionWindow } from '../utils/helpers';

interface FormState {
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
}

const initialForm: FormState = {
  courseCode: '',
  courseTitle: '',
  lecturerName: '',
  venue: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '08:00',
  endTime: '10:00',
};

export default function AttendanceSessionPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [creating, setCreating] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    const unsub = watchActiveSession(setActiveSession);
    return () => unsub();
  }, []);

  async function refresh() {
    const s = await getSessions();
    setSessions(s.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));
  }

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const missing = (Object.keys(form) as (keyof FormState)[]).filter((k) => !form[k].trim());
    if (missing.length) {
      toast('Please fill in all session fields.', 'warning');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast('End time must be after start time.', 'warning');
      return;
    }
    setCreating(true);
    try {
      await createSession(form);
      toast('Attendance session created.', 'success');
      setForm({ ...initialForm, date: form.date });
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create session', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleStart(s: AttendanceSession) {
    try {
      await startSession(s.id);
      toast(`Session for ${s.courseCode} is now live.`, 'success');
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start session', 'error');
    }
  }

  async function confirmEnd() {
    if (!endingId) return;
    try {
      await endSession(endingId);
      toast('Attendance session ended.', 'info');
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to end session', 'error');
    } finally {
      setEndingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Create form */}
      <div className="lg:col-span-2">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
                New Attendance Session
              </h3>
              <p className="text-xs text-ink-400">Only one session can be active at a time.</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Course Code *"
                placeholder="CSC 301"
                value={form.courseCode}
                onChange={(e) => set('courseCode', e.target.value)}
              />
              <Input
                label="Course Title *"
                placeholder="Data Structures"
                value={form.courseTitle}
                onChange={(e) => set('courseTitle', e.target.value)}
              />
            </div>
            <Input
              label="Lecturer Name *"
              placeholder="Dr. Jane Doe"
              value={form.lecturerName}
              onChange={(e) => set('lecturerName', e.target.value)}
            />
            <Input
              label="Venue *"
              placeholder="LT 200"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
            />
            <Input
              label="Date *"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time *"
                type="time"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
              />
              <Input
                label="End Time *"
                type="time"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
              />
            </div>
            <Button type="submit" loading={creating} className="w-full" icon={<CalendarClock className="h-4 w-4" />}>
              Create Session
            </Button>
          </form>
        </Card>
      </div>

      {/* Sessions list */}
      <div className="lg:col-span-3 space-y-4">
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 p-5 text-white shadow-glow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                </span>
                <div>
                  <p className="font-semibold">Live: {activeSession.courseCode}</p>
                  <p className="text-xs text-emerald-100">{activeSession.courseTitle}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEndingId(activeSession.id)}
                icon={<StopCircle className="h-4 w-4" />}
              >
                End Attendance
              </Button>
            </div>
          </motion.div>
        )}

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
            All Sessions
          </h3>
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">
              No sessions yet. Create one to get started.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sessions.map((s, i) => {
                const window = isWithinSessionWindow(s.date, s.startTime, s.endTime);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl border border-ink-200/70 dark:border-ink-700/60 bg-white/60 dark:bg-ink-800/40 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-ink-700 dark:text-ink-100">
                          {s.courseCode}
                        </p>
                        <p className="text-xs text-ink-400">{s.courseTitle}</p>
                      </div>
                      <span
                        className={
                          s.active
                            ? 'rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300'
                            : 'rounded-full bg-ink-100 dark:bg-ink-700/60 px-2.5 py-1 text-[11px] font-medium text-ink-500'
                        }
                      >
                        {s.active ? 'Active' : window === 'before' ? 'Upcoming' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-ink-500 dark:text-ink-300">
                      <p className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {s.lecturerName}</p>
                      <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {s.venue}</p>
                      <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {s.date} · {s.startTime}–{s.endTime}</p>
                      <p className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Created {formatDate(s.createdAt ?? s.date)}</p>
                    </div>
                    <div className="mt-4">
                      {!s.active ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleStart(s)}
                          icon={<PlayCircle className="h-4 w-4" />}
                          disabled={window === 'after'}
                        >
                          Start Attendance
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          className="w-full"
                          onClick={() => setEndingId(s.id)}
                          icon={<StopCircle className="h-4 w-4" />}
                        >
                          End Attendance
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <ConfirmModal
        open={!!endingId}
        title="End attendance session?"
        message="Students will no longer be able to check in for this session."
        confirmLabel="End Session"
        variant="danger"
        onConfirm={confirmEnd}
        onCancel={() => setEndingId(null)}
      />
    </div>
  );
}
