import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint, Mail, ArrowLeft, MailCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast('Please enter your email address.', 'warning');
      return;
    }
    // Basic email format check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast('Please enter a valid email address.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
      toast('Password reset email sent. Check your inbox.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
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
            Forgot
            <br />
            your password?
          </h2>
          <p className="max-w-md text-brand-100/90">
            Enter your registered email and we'll send you a secure link to
            reset your password.
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
                Reset Password
              </h1>
              <p className="mt-1 text-sm text-ink-400">
                We'll email you a reset link
              </p>
            </div>

            {sent ? (
              <div className="space-y-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                >
                  <MailCheck className="h-8 w-8" />
                </motion.div>
                <div>
                  <p className="font-medium text-ink-700 dark:text-ink-100">
                    Check your email
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    A password reset link has been sent to{' '}
                    <span className="font-medium text-ink-600 dark:text-ink-200">{email}</span>.
                    Follow the link to set a new password.
                  </p>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate('/login')} icon={<ArrowLeft className="h-4 w-4" />}>
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="lecturer@university.edu"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Button type="submit" loading={submitting} className="w-full" size="lg">
                  Send Reset Link
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
              Remember your password?{' '}
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
