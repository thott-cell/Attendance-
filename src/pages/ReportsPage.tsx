import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { FileText, FileSpreadsheet, Printer, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { getAttendanceRecords, getStudents } from '../services/firestore';
import type { AttendanceRecord, Student } from '../types';

const PIE_COLORS = ['#3b82f6', '#f43f5e'];

export default function ReportsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([getStudents(), getAttendanceRecords()]);
        setStudents(s);
        setRecords(r);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalStudents = students.length;
  const totalAttendance = records.length;
  const totalAbsentees = Math.max(totalStudents - new Set(records.map((r) => r.studentId)).size, 0);
  const attendancePct = totalStudents
    ? Math.round((new Set(records.map((r) => r.studentId)).size / totalStudents) * 100)
    : 0;

  // Attendance by course.
  const byCourse = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => map.set(r.courseCode, (map.get(r.courseCode) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [records]);

  // Attendance trend (last 14 days).
  const trend = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const iso = d.toISOString().slice(0, 10);
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        checkIns: records.filter((r) => r.checkInTime.slice(0, 10) === iso).length,
      };
    });
  }, [records]);

  // Attendance by department.
  const byDepartment = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => map.set(r.department || 'Unknown', (map.get(r.department) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [records]);

  const pieData = [
    { name: 'Present', value: new Set(records.map((r) => r.studentId)).size },
    { name: 'Absent', value: totalAbsentees },
  ];

  function exportPdf() {
    // Trigger the browser print dialog; the user can "Save as PDF".
    toast('Opening print dialog — choose "Save as PDF".', 'info');
    window.print();
  }

  function exportExcel() {
    const headers = ['Name', 'Matric', 'Course', 'Department', 'Level', 'Date', 'Time', 'Status'];
    const rows = records.map((r) => [
      r.studentName, r.matricNumber, r.courseCode, r.department, r.level,
      r.checkInTime.slice(0, 10), r.checkInTime.slice(11, 16), r.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Report exported as Excel-compatible file.', 'success');
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="space-y-6">
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

      {/* Print header (visible only when printing) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">BioAttend — Attendance Report</h1>
        <p className="text-sm">Generated {new Date().toLocaleString()}</p>
        <p>Total Students: {totalStudents} · Attendance: {totalAttendance} · Absentees: {totalAbsentees} · Rate: {attendancePct}%</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 print:hidden">
        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
            Attendance Trend (14 days)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b822" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                <Line type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
            Present vs Absent
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
            Attendance by Course
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b822" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
            Attendance by Department
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b822" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Print-friendly table */}
      <Card className="print:block">
        <div className="print:hidden flex flex-wrap gap-3 justify-end mb-4">
          <Button variant="secondary" icon={<FileText className="h-4 w-4" />} onClick={exportPdf}>
            Export to PDF
          </Button>
          <Button variant="secondary" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel}>
            Export to Excel
          </Button>
          <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={printReport}>
            Print Report
          </Button>
        </div>

        <h3 className="mb-3 font-display text-lg font-semibold text-ink-700 dark:text-ink-100 print:hidden">
          Detailed Records
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 dark:border-ink-700/60 text-left">
                <th className="px-3 py-2 font-semibold text-ink-500">Name</th>
                <th className="px-3 py-2 font-semibold text-ink-500">Matric</th>
                <th className="px-3 py-2 font-semibold text-ink-500">Course</th>
                <th className="px-3 py-2 font-semibold text-ink-500">Date</th>
                <th className="px-3 py-2 font-semibold text-ink-500">Time</th>
                <th className="px-3 py-2 font-semibold text-ink-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 50).map((r) => (
                <tr key={r.id} className="border-b border-ink-100 dark:border-ink-800">
                  <td className="px-3 py-2">{r.studentName}</td>
                  <td className="px-3 py-2">{r.matricNumber}</td>
                  <td className="px-3 py-2">{r.courseCode}</td>
                  <td className="px-3 py-2">{r.checkInTime.slice(0, 10)}</td>
                  <td className="px-3 py-2">{r.checkInTime.slice(11, 16)}</td>
                  <td className="px-3 py-2 text-emerald-600">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
