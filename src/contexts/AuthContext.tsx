import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../services/firebase';
import type { LecturerProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: LecturerProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    fullName: string;
    email: string;
    password: string;
    department?: string;
    faculty?: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<LecturerProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Hard cap on how long we'll wait for Firebase to resolve the initial auth
// state. If it hangs (stale cached token, network issue, misconfigured creds),
// we release the UI so the Login page always renders.
const AUTH_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const settledRef = useRef(false);

  useEffect(() => {
    const auth = getAuth(app);

    const settle = () => {
      if (settledRef.current) return;
      settledRef.current = true;
      setLoading(false);
    };

    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        setUser(u);
        if (u) {
          try {
            const snap = await getDoc(doc(db, 'lecturers', u.uid));
            if (snap.exists()) {
              setProfile({ uid: u.uid, ...(snap.data() as Omit<LecturerProfile, 'uid'>) });
            } else {
              const minimal: LecturerProfile = {
                uid: u.uid,
                email: u.email ?? '',
                fullName: u.displayName ?? 'Lecturer',
                department: '',
                faculty: '',
              };
              await setDoc(doc(db, 'lecturers', u.uid), minimal);
              setProfile(minimal);
            }
          } catch {
            // Firestore failure shouldn't block the UI — fall back to a
            // minimal profile derived from the auth user.
            setProfile({
              uid: u.uid,
              email: u.email ?? '',
              fullName: u.displayName ?? 'Lecturer',
              department: '',
              faculty: '',
            });
          }
        } else {
          setProfile(null);
        }
        settle();
      },
      // Error callback: Firebase failed to resolve auth (e.g. bad config,
      // network). Release the UI so the Login page renders.
      () => settle()
    );

    // Safety net: if onAuthStateChanged never fires within the timeout,
    // unblock the UI anyway.
    const timeoutId = window.setTimeout(() => settle(), AUTH_TIMEOUT_MS);

    return () => {
      unsub();
      window.clearTimeout(timeoutId);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (data: {
    fullName: string;
    email: string;
    password: string;
    department?: string;
    faculty?: string;
  }) => {
    const auth = getAuth(app);
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const newProfile: LecturerProfile = {
      uid: cred.user.uid,
      email: data.email,
      fullName: data.fullName,
      department: data.department ?? '',
      faculty: data.faculty ?? '',
    };
    await setDoc(doc(db, 'lecturers', cred.user.uid), newProfile);
    setProfile(newProfile);
  };

  const resetPassword = async (email: string) => {
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(getAuth(app));
  };

  const changePassword = async (newPassword: string) => {
    if (!user) throw new Error('Not signed in');
    await updatePassword(user, newPassword);
  };

  const updateProfile = async (data: Partial<LecturerProfile>) => {
    if (!user) throw new Error('Not signed in');
    const next = { ...profile, ...data, uid: user.uid } as LecturerProfile;
    await setDoc(doc(db, 'lecturers', user.uid), next, { merge: true });
    setProfile(next);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, signup, resetPassword, logout, changePassword, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
