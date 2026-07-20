import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AttendanceRecord, AttendanceSession, Student } from '../types';

/* ---------------- Students ---------------- */

export async function addStudent(data: Omit<Student, 'id' | 'dateRegistered'>) {
  const ref = await addDoc(collection(db, 'students'), {
    ...data,
    dateRegistered: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getStudents(): Promise<Student[]> {
  const snap = await getDocs(collection(db, 'students'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
}

export function watchStudents(cb: (students: Student[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'students'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
  });
}

/* ---------------- Attendance Sessions ---------------- */

export async function createSession(
  data: Omit<AttendanceSession, 'id' | 'active' | 'createdAt'>
) {
  // Only one active session at a time: deactivate any existing active sessions.
  const active = await getActiveSession();
  if (active) {
    await updateDoc(doc(db, 'attendanceSessions', active.id), { active: false });
  }
  const ref = await addDoc(collection(db, 'attendanceSessions'), {
    ...data,
    active: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function startSession(sessionId: string) {
  // Deactivate all others first.
  const snap = await getDocs(query(collection(db, 'attendanceSessions'), where('active', '==', true)));
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { active: false })));
  await updateDoc(doc(db, 'attendanceSessions', sessionId), { active: true });
}

export async function endSession(sessionId: string) {
  await updateDoc(doc(db, 'attendanceSessions', sessionId), { active: false });
}

export async function getSessions(): Promise<AttendanceSession[]> {
  const snap = await getDocs(collection(db, 'attendanceSessions'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceSession, 'id'>) }));
}

export async function getActiveSession(): Promise<AttendanceSession | null> {
  const snap = await getDocs(query(collection(db, 'attendanceSessions'), where('active', '==', true)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<AttendanceSession, 'id'>) };
}

export function watchActiveSession(cb: (s: AttendanceSession | null) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'attendanceSessions'), where('active', '==', true)),
    (snap) => {
      if (snap.empty) return cb(null);
      const d = snap.docs[0];
      cb({ id: d.id, ...(d.data() as Omit<AttendanceSession, 'id'>) });
    }
  );
}

/* ---------------- Attendance Records ---------------- */

export async function addAttendanceRecord(data: Omit<AttendanceRecord, 'id'>) {
  const ref = await addDoc(collection(db, 'attendanceRecords'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const snap = await getDocs(collection(db, 'attendanceRecords'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

export async function getRecordsForSession(sessionId: string): Promise<AttendanceRecord[]> {
  const snap = await getDocs(
    query(collection(db, 'attendanceRecords'), where('sessionId', '==', sessionId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

export async function hasStudentAttended(sessionId: string, studentId: string): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, 'attendanceRecords'),
      where('sessionId', '==', sessionId),
      where('studentId', '==', studentId)
    )
  );
  return !snap.empty;
}

/* ---------------- Settings ---------------- */

export async function getSettings(): Promise<{ attendanceDurationMinutes: number } | null> {
  const snap = await getDocs(collection(db, 'settings'));
  if (snap.empty) return null;
  const d = snap.docs.find((x) => x.id === 'app');
  if (!d) return null;
  return d.data() as { attendanceDurationMinutes: number };
}

export async function saveSettings(data: Record<string, unknown>) {
  await setDoc(doc(db, 'settings', 'app'), data, { merge: true });
}

export { orderBy };
