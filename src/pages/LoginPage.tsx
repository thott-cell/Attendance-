import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint, Mail, Lock, Eye, EyeOff, ShieldCheck, ScanFace, CalendarClock, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
      toast('Welcome back, Lecturer!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

        <div className="relative space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl font-bold leading-tight">
              Smarter attendance,
              <br />
              powered by faces.
            </h2>
            <p className="mt-4 max-w-md text-brand-100/90">
              Register students once, then let facial recognition handle roll call —
              accurate, contactless and tamper-proof.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: ScanFace, label: 'Face match' },
              { icon: CalendarClock, label: 'Live sessions' },
              { icon: BarChart3, label: 'Reports' },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="rounded-2xl bg-white/10 backdrop-blur p-4 text-center"
              >
                <f.icon className="mx-auto h-6 w-6 text-brand-100" />
                <p className="mt-2 text-xs text-brand-100">{f.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

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
                Lecturer Login
              </h1>
              <p className="mt-1 text-sm text-ink-400">
                Sign in to manage attendance sessions
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="lecturer@university.edu"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-ink-500 dark:text-ink-300">
                  <input type="checkbox" className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={submitting} className="w-full" size="lg">
                Sign In
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3 text-xs text-brand-700 dark:text-brand-300">
              <ShieldCheck className="h-4 w-4 shrink-0" />
             
            </div>

            <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
