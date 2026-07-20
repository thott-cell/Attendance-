# BioAttend — Student Biometric Attendance Management System

A modern, professional Student Biometric Attendance Management System built with
React + Vite, using **Firebase Authentication + Firestore**, **Cloudinary** for face
image storage, and **face-api.js** for facial recognition.

## Features

- Lecturer login (Firebase Authentication)
- Dashboard with live stats (Total Students, Present Today, Absent, Active Session, Attendance %)
- Student registration with webcam face capture, Cloudinary upload, and face descriptor generation
- Attendance session creation with start/end controls (only one active at a time)
- Live attendance with real-time facial recognition and automatic check-in
- Time-window enforcement ("Attendance has not started." / "Attendance is closed.")
- Searchable, filterable attendance records table (by course, date, department, level)
- Reports page with charts (Recharts) and PDF / Excel / Print export
- Settings: update profile, change password, configure attendance duration, toggle light/dark theme
- Glassmorphism UI, Framer Motion animations, toast notifications, loading skeletons, confirmation modals
- Fully responsive (desktop, tablet, mobile)

## Tech Stack

- React + Vite + TypeScript
- Firebase (Auth + Firestore)
- Cloudinary (image storage)
- face-api.js (facial recognition)
- React Router
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide & React Icons

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create a Firebase project, enable **Email/Password** authentication, and create a
Firestore database. Then edit `src/config/firebase.ts` and replace the placeholder
values with your project's config:

```ts
export const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
};
```

### 3. Configure Cloudinary

Create a Cloudinary account and an **unsigned upload preset**
(Console → Settings → Upload → Upload presets). Add them to
`src/config/firebase.ts`:

```ts
export const cloudinaryConfig = {
  cloudName: 'your-cloud-name',
  uploadPreset: 'your-unsigned-upload-preset',
};
```

### 4. Add face-api.js model weights

Download the model weights from the
[face-api.js repo](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
and place them in `public/models/`. The app loads:

- `tiny_face_detector`
- `face_landmark_68`
- `face_recognition`

### 5. Firestore Collections

The app uses these collections (created automatically as data is written):

- `students` — registered students with face descriptors
- `attendanceSessions` — class attendance sessions
- `attendanceRecords` — individual check-in records
- `lecturers` — lecturer profile info
- `settings` — app settings (theme, attendance duration)

### 6. Run

```bash
npm run dev
```

## Notes

- No mock data is used — all data flows through Firebase Firestore and Cloudinary.
- The first time a lecturer logs in, a minimal profile document is created in
  the `lecturers` collection.
- Live attendance enforces the session's scheduled date/time window.
- Duplicate check-ins within the same session are prevented (Firestore query + in-memory buffer).
