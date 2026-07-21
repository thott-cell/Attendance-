import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  CalendarClock,
  TrendingUp,
  ScanFace,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import {
  getStudents,
  getAttendanceRecords,
  getSessions,
  watchActiveSession,
} from '../services/firestore';
import type { AttendanceSession, AttendanceRecord, Student } from '../types';
import { formatDate, todayISO, toMillis } from '../utils/helpers';

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const [s, r, sess] = await Promise.all([getStudents(), getAttendanceRecords(), getSessions()]);
      setStudents(s);
      setRecords(r);
      setSessions(sess.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)));
      unsub = watchActiveSession(setActiveSession);
      setLoading(false);
    })();
    return () => unsub?.();
  }, []);

  const today = todayISO();
  const presentToday = records.filter((r) => r.checkInTime.slice(0, 10) === today).length;
  const totalStudents = students.length;
  const absentToday = Math.max(totalStudents - presentToday, 0);
  const attendancePct = totalStudents
    ? Math.round((presentToday / totalStudents) * 100)
    : 0;

  // Simple 7-day sparkline of attendance counts.
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      count: records.filter((r) => r.checkInTime.slice(0, 10) === iso).length,
    };
  });
  const maxCount = Math.max(...last7.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-ink-900 p-6 sm:p-8 text-white shadow-glow"
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Welcome back, Lecturer
            </h2>
            <p className="mt-1 text-brand-100/90">
              Here's your attendance summary for today.
            </p>
          </div>
          <Link
            to="/live"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur px-4 py-2.5 text-sm font-medium hover:bg-white/25 transition w-fit"
          >
            <ScanFace className="h-4 w-4" />
            Start Live Attendance
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : (
            <>
              <StatCard
                label="Total Students"
                value={totalStudents}
                icon={<Users className="h-5 w-5" />}
                accent="brand"
                hint="Enrolled with face data"
                delay={0}
              />
              <StatCard
                label="Present Today"
                value={presentToday}
                icon={<UserCheck className="h-5 w-5" />}
                accent="emerald"
                hint={`Out of ${totalStudents} students`}
                delay={0.05}
              />
              <StatCard
                label="Absent Today"
                value={absentToday}
                icon={<UserX className="h-5 w-5" />}
                accent="rose"
                hint="Not yet checked in"
                delay={0.1}
              />
              <StatCard
                label="Attendance %"
                value={`${attendancePct}%`}
                icon={<TrendingUp className="h-5 w-5" />}
                accent="amber"
                hint="Today's rate"
                delay={0.15}
              />
            </>
          )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active session card */}
        <Card className="lg:col-span-1" delay={0.2}>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-700 dark:text-ink-100">
                Active Attendance Session
              </p>
              <p className="text-xs text-ink-400">
                {activeSession ? 'Live now' : 'No active session'}
              </p>
            </div>
          </div>
          {activeSession ? (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-ink-400">Course</span>
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-100">
                  {activeSession.courseCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-ink-400">Title</span>
                <span className="text-sm text-ink-700 dark:text-ink-100">
                  {activeSession.courseTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-ink-400">Venue</span>
                <span className="text-sm text-ink-700 dark:text-ink-100">{activeSession.venue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-ink-400">Window</span>
                <span className="text-sm text-ink-700 dark:text-ink-100">
                  {activeSession.startTime} – {activeSession.endTime}
                </span>
              </div>
              <Link
                to="/live"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition"
              >
                Open Live View <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-ink-100/60 dark:bg-ink-700/40 p-4 text-sm text-ink-500 dark:text-ink-300">
              No attendance session is currently running.
              <Link
                to="/sessions"
                className="mt-3 block font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Create a session →
              </Link>
            </div>
          )}
        </Card>

        {/* 7-day chart */}
        <Card className="lg:col-span-2" delay={0.25}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-700 dark:text-ink-100">
                Attendance — last 7 days
              </p>
              <p className="text-xs text-ink-400">Daily check-in counts</p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              View reports →
            </Link>
          </div>
          <div className="mt-6 flex items-end justify-between gap-2 h-44">
            {last7.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.1 * i, ease: 'easeOut' }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 min-h-[6px]"
                  title={`${d.count} check-ins`}
                />
                <span className="text-[11px] text-ink-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent sessions & check-ins */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card delay={0.3}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-700 dark:text-ink-100">
              Recent sessions
            </p>
            <Link
              to="/sessions"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              All sessions →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl bg-ink-50/60 dark:bg-ink-700/30 p-3"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 shrink-0">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-ink-700 dark:text-ink-100">
                    {s.courseCode}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {s.date} · {s.startTime}–{s.endTime}
                  </p>
                </div>
                <span
                  className={
                    s.active
                      ? 'rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300'
                      : 'rounded-full bg-ink-100 dark:bg-ink-700/60 px-2 py-0.5 text-[11px] font-medium text-ink-500'
                  }
                >
                  {s.active ? 'Live' : 'Closed'}
                </span>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-400">No sessions yet.</p>
            )}
          </div>
        </Card>

        <Card delay={0.35}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-700 dark:text-ink-100">
              Recent check-ins
            </p>
            <Link
              to="/records"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              All records →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {records.slice(-5).reverse().map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl bg-ink-50/60 dark:bg-ink-700/30 p-3"
              >
                <img
                  src={r.imageUrl}
                  alt={r.studentName}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-ink-700 dark:text-ink-100">
                    {r.studentName}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {r.matricNumber} · {r.courseCode}
                  </p>
                </div>
                <span className="text-xs text-ink-400">{formatDate(r.checkInTime)}</span>
              </div>
            ))}
            {records.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-400">No check-ins yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
