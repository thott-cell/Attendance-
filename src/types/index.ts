// Shared domain types used across the app.

export interface Student {
  id: string;
  fullName: string;
  matricNumber: string;
  department: string;
  faculty: string;
  level: string;
  email: string;
  phone: string;
  imageUrl: string;
  // face-api.js descriptor stored as a plain number[] for Firestore.
  descriptor: number[];
  dateRegistered: string; // ISO string
}

export interface AttendanceSession {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  venue: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  active: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  courseCode: string;
  courseTitle: string;
  studentName: string;
  matricNumber: string;
  department: string;
  level: string;
  imageUrl: string;
  checkInTime: string; // ISO string
  status: 'Present';
}

export interface LecturerProfile {
  uid: string;
  email: string;
  fullName: string;
  department: string;
  faculty: string;
}

export interface AppSettings {
  attendanceDurationMinutes: number;
  theme: 'light' | 'dark';
}

export const FACULTIES = [
  'Faculty of Science',
  'Faculty of Engineering',
  'Faculty of Arts',
  'Faculty of Social Sciences',
  'Faculty of Education',
  'Faculty of Management Sciences',
  'Faculty of Law',
  'Faculty of Medical Sciences',
] as const;

export const LEVELS = ['100', '200', '300', '400', '500', '600'] as const;
