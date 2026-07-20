import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import DataTable, { type Column } from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { getAttendanceRecords, getStudents } from '../services/firestore';
import type { AttendanceRecord, Student } from '../types';
import { formatDate, todayISO } from '../utils/helpers';

export default function AttendanceRecordsPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [date, setDate] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [r, s] = await Promise.all([getAttendanceRecords(), getStudents()]);
        setRecords(r);
        setStudents(s);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load records', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const courses = useMemo(
    () => Array.from(new Set(records.map((r) => r.courseCode))).sort(),
    [records]
  );
  const departments = useMemo(
    () => Array.from(new Set(students.map((s) => s.department))).filter(Boolean).sort(),
    [students]
  );

  const filtered = useMemo(() => {
    return records
      .filter((r) => (course ? r.courseCode === course : true))
      .filter((r) => (date ? r.checkInTime.slice(0, 10) === date : true))
      .filter((r) => (department ? r.department === department : true))
      .filter((r) => (level ? r.level === level : true))
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          r.studentName.toLowerCase().includes(q) ||
          r.matricNumber.toLowerCase().includes(q) ||
          r.courseCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));
  }, [records, course, date, department, level, search]);

  function exportCsv() {
    const headers = ['Name', 'Matric', 'Course', 'Department', 'Level', 'Date', 'Time', 'Status'];
    const rows = filtered.map((r) => [
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
    a.download = `attendance-records-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Records exported as CSV.', 'success');
  }

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'photo',
      header: 'Photo',
      render: (r) => (
        <img src={r.imageUrl} alt={r.studentName} className="h-9 w-9 rounded-full object-cover" />
      ),
    },
    { key: 'studentName', header: 'Full Name', render: (r) => <span className="font-medium text-ink-700 dark:text-ink-100">{r.studentName}</span> },
    { key: 'matricNumber', header: 'Matric No.' },
    { key: 'courseCode', header: 'Course', render: (r) => <span className="text-ink-600 dark:text-ink-300">{r.courseCode}</span> },
    { key: 'department', header: 'Department' },
    { key: 'level', header: 'Level' },
    { key: 'checkInTime', header: 'Date', render: (r) => r.checkInTime.slice(0, 10) },
    { key: 'time', header: 'Time', render: (r) => r.checkInTime.slice(11, 16) },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Present
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <p className="mb-1 text-sm font-medium text-ink-700 dark:text-ink-200">
              Search & Filter
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search name, matric, course…"
                  icon={<Search className="h-4 w-4" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">All courses</option>
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">All departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">All levels</option>
                {['100', '200', '300', '400', '500', '600'].map((l) => (
                  <option key={l} value={l}>{l} Level</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="lg:w-44" />
            <Button variant="secondary" size="md" onClick={() => { setSearch(''); setCourse(''); setDate(''); setDepartment(''); setLevel(''); }} icon={<Filter className="h-4 w-4" />}>
              Clear
            </Button>
            <Button variant="primary" size="md" onClick={exportCsv} icon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
            Attendance Records
          </h3>
          <span className="text-xs text-ink-400">
            Showing {filtered.length} of {records.length} records
          </span>
        </div>
        {loading ? <TableSkeleton /> : <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />}
      </Card>
    </div>
  );
}
