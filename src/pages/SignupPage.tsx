import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Fingerprint,
  Mail,
  Lock,
  User,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FACULTIES } from '../types';

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  faculty: string;
}

const initialForm: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  department: '',
  faculty: '',
};

export default function SignupPage() {
  const { signup, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(initialForm);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      toast('Please fill in your name, email, and password.', 'warning');
      return;
    }
    if (form.password.length < 6) {
      toast('Password must be at least 6 characters.', 'warning');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast('Passwords do not match.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department.trim(),
        faculty: form.faculty,
      });
      toast('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 p-12 text-white">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold">BioAttend</p>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-200">
              Biometric Attendance Suite
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative space-y-6"
        >
          <h2 className="font-display text-4xl font-bold leading-tight">
            Create your
            <br />
            lecturer account.
          </h2>
          <p className="max-w-md text-brand-100/90">
            Join BioAttend to manage private attendance sessions, register
            students with facial recognition, and generate per-course reports —
            all isolated to your account.
          </p>
        </motion.div>

        <p className="relative text-xs text-brand-200/70">
          © {new Date().getFullYear()} BioAttend. University Management System.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-ink-50 dark:bg-ink-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-3xl p-8 shadow-glass">
            <div className="mb-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow lg:hidden">
                <Fingerprint className="h-7 w-7" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold text-ink-800 dark:text-white">
                Lecturer Sign Up
              </h1>
              <p className="mt-1 text-sm text-ink-400">
                Create an account to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name *"
                placeholder="Dr. Jane Doe"
                icon={<User className="h-4 w-4" />}
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                autoComplete="name"
              />
              <Input
                label="Email Address *"
                type="email"
                placeholder="lecturer@university.edu"
                icon={<Mail className="h-4 w-4" />}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
              />
              <div className="relative">
                <Input
                  label="Password *"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  icon={<Lock className="h-4 w-4" />}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-9 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Input
                label="Confirm Password *"
                type={showPwd ? 'text' : 'password'}
                placeholder="Re-enter password"
                icon={<Lock className="h-4 w-4" />}
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                autoComplete="new-password"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Department (optional)"
                  placeholder="Computer Science"
                  icon={<Building2 className="h-4 w-4" />}
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                />
                <Select
                  label="Faculty (optional)"
                  value={form.faculty}
                  onChange={(e) => set('faculty', e.target.value)}
                >
                  <option value="">Select faculty</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </div>

              <Button type="submit" loading={submitting} className="w-full" size="lg" icon={<GraduationCap className="h-4 w-4" />}>
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Sign in
              </Link>
            </p>

            
          </div>
        </motion.div>
      </div>
    </div>
  );
}
