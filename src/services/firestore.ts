import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from './firebase';
import type { AttendanceRecord, AttendanceSession, Student } from '../types';
import { compareDescriptors, MATCH_THRESHOLD } from './faceApi';

/* ---------------- Lecturer auth helper ---------------- */

/**
 * Returns the current authenticated lecturer's uid, or null when not signed in.
 * Every public function below uses this to scope reads/writes so one lecturer
 * can never see another lecturer's data.
 */
function requireUid(): string | null {
  const auth = getAuth(app);
  return auth.currentUser?.uid ?? null;
}

/* ---------------- Students ---------------- */

/** Check whether a matric number already exists for this lecturer. */
export async function isMatricNumberTaken(matricNumber: string): Promise<boolean> {
  const uid = requireUid();
  if (!uid) return false;
  const snap = await getDocs(
    query(
      collection(db, 'students'),
      where('lecturerId', '==', uid),
      where('matricNumber', '==', matricNumber.trim())
    )
  );
  return !snap.empty;
}

/** Check whether an email already exists for this lecturer. */
export async function isEmailTaken(email: string): Promise<boolean> {
  const uid = requireUid();
  if (!uid) return false;
  const snap = await getDocs(
    query(
      collection(db, 'students'),
      where('lecturerId', '==', uid),
      where('email', '==', email.trim().toLowerCase())
    )
  );
  return !snap.empty;
}

/**
 * Check whether a face descriptor already matches an existing student above the
 * recognition threshold. Returns the matching student, if any.
 */
export async function findMatchingStudent(
  descriptor: number[] | Float32Array
): Promise<Student | null> {
  const students = await getStudents();
  let best: { student: Student; dist: number } | null = null;
  for (const st of students) {
    if (!st.descriptor || st.descriptor.length === 0) continue;
    const dist = compareDescriptors(descriptor, st.descriptor);
    if (!best || dist < best.dist) best = { student: st, dist };
  }
  if (best && best.dist <= MATCH_THRESHOLD) return best.student;
  return null;
}

export async function addStudent(data: Omit<Student, 'id' | 'dateRegistered' | 'lecturerId'>) {
  const uid = requireUid();
  if (!uid) throw new Error('Not authenticated');
  const ref = await addDoc(collection(db, 'students'), {
    ...data,
    lecturerId: uid,
    dateRegistered: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getStudents(): Promise<Student[]> {
  const uid = requireUid();
  if (!uid) return [];
  const snap = await getDocs(
    query(collection(db, 'students'), where('lecturerId', '==', uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
}

export function watchStudents(cb: (students: Student[]) => void): Unsubscribe {
  const uid = requireUid();
  if (!uid) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'students'), where('lecturerId', '==', uid)),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    }
  );
}

/* ---------------- Attendance Sessions ---------------- */

export async function createSession(
  data: Omit<AttendanceSession, 'id' | 'active' | 'createdAt' | 'lecturerId' | 'lecturerEmail'>
) {
  const uid = requireUid();
  if (!uid) throw new Error('Not authenticated');
  const auth = getAuth(app);
  const lecturerEmail = auth.currentUser?.email ?? '';
  // Only one active session at a time: deactivate any existing active sessions.
  const active = await getActiveSession();
  if (active) {
    await updateDoc(doc(db, 'attendanceSessions', active.id), { active: false });
  }
  const ref = await addDoc(collection(db, 'attendanceSessions'), {
    ...data,
    lecturerId: uid,
    lecturerEmail,
    active: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function startSession(sessionId: string) {
  const uid = requireUid();
  if (!uid) throw new Error('Not authenticated');
  // Deactivate all others first (scoped to this lecturer).
  const snap = await getDocs(
    query(
      collection(db, 'attendanceSessions'),
      where('lecturerId', '==', uid),
      where('active', '==', true)
    )
  );
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { active: false })));
  await updateDoc(doc(db, 'attendanceSessions', sessionId), { active: true });
}

export async function endSession(sessionId: string) {
  const uid = requireUid();
  if (!uid) throw new Error('Not authenticated');
  await updateDoc(doc(db, 'attendanceSessions', sessionId), { active: false });
}

export async function getSessions(): Promise<AttendanceSession[]> {
  const uid = requireUid();
  if (!uid) return [];
  const snap = await getDocs(
    query(collection(db, 'attendanceSessions'), where('lecturerId', '==', uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceSession, 'id'>) }));
}

export async function getActiveSession(): Promise<AttendanceSession | null> {
  const uid = requireUid();
  if (!uid) return null;
  const snap = await getDocs(
    query(
      collection(db, 'attendanceSessions'),
      where('lecturerId', '==', uid),
      where('active', '==', true)
    )
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<AttendanceSession, 'id'>) };
}

export function watchActiveSession(cb: (s: AttendanceSession | null) => void): Unsubscribe {
  const uid = requireUid();
  if (!uid) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    query(
      collection(db, 'attendanceSessions'),
      where('lecturerId', '==', uid),
      where('active', '==', true)
    ),
    (snap) => {
      if (snap.empty) return cb(null);
      const d = snap.docs[0];
      cb({ id: d.id, ...(d.data() as Omit<AttendanceSession, 'id'>) });
    }
  );
}

/* ---------------- Attendance Records ---------------- */

export async function addAttendanceRecord(
  data: Omit<AttendanceRecord, 'id' | 'lecturerId'>
): Promise<string | null> {
  const uid = requireUid();
  if (!uid) throw new Error('Not authenticated');
  // Server-side dedupe: refuse to create a duplicate record for the same
  // student in the same session.
  if (await hasStudentAttended(data.sessionId, data.studentId)) {
    return null;
  }
  const ref = await addDoc(collection(db, 'attendanceRecords'), {
    ...data,
    lecturerId: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const uid = requireUid();
  if (!uid) return [];
  const snap = await getDocs(
    query(collection(db, 'attendanceRecords'), where('lecturerId', '==', uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

export async function getRecordsForSession(sessionId: string): Promise<AttendanceRecord[]> {
  const uid = requireUid();
  if (!uid) return [];
  const snap = await getDocs(
    query(
      collection(db, 'attendanceRecords'),
      where('lecturerId', '==', uid),
      where('sessionId', '==', sessionId)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

export async function hasStudentAttended(sessionId: string, studentId: string): Promise<boolean> {
  const uid = requireUid();
  if (!uid) return false;
  const snap = await getDocs(
    query(
      collection(db, 'attendanceRecords'),
      where('lecturerId', '==', uid),
      where('sessionId', '==', sessionId),
      where('studentId', '==', studentId)
    )
  );
  return !snap.empty;
}

/* ---------------- Settings ---------------- */

export async function getSettings(): Promise<{ attendanceDurationMinutes: number } | null> {
  const uid = requireUid();
  if (!uid) return null;
  const snap = await getDocs(
    query(collection(db, 'settings'), where('lecturerId', '==', uid))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return d.data() as { attendanceDurationMinutes: number };
}

export async function saveSettings(data: Record<string, unknown>) {
  const uid = requireUid();
  if (!uid) throw new Error('Not authenticated');
  await setDoc(doc(db, 'settings', uid), { ...data, lecturerId: uid }, { merge: true });
}
