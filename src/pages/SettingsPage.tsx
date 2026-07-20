import { useEffect, useState } from 'react';
import { User, Lock, Clock, Palette, Save, Moon, Sun } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getSettings, saveSettings } from '../services/firestore';

export default function SettingsPage() {
  const { profile, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [name, setName] = useState(profile?.fullName ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [faculty, setFaculty] = useState(profile?.faculty ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [duration, setDuration] = useState(60);
  const [savingDuration, setSavingDuration] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => { if (s?.attendanceDurationMinutes) setDuration(s.attendanceDurationMinutes); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.fullName);
      setDepartment(profile.department);
      setFaculty(profile.faculty);
    }
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ fullName: name, department, faculty });
      toast('Profile updated.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.', 'warning');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(newPassword);
      toast('Password changed successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  async function saveDuration() {
    setSavingDuration(true);
    try {
      await saveSettings({ attendanceDurationMinutes: Number(duration) });
      toast('Attendance duration saved.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSavingDuration(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile */}
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
              Update Profile
            </h3>
            <p className="text-xs text-ink-400">Your lecturer information</p>
          </div>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={profile?.email ?? ''} disabled hint="Email cannot be changed here" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <Input label="Faculty" value={faculty} onChange={(e) => setFaculty(e.target.value)} />
          </div>
          <Button type="submit" loading={savingProfile} icon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Password */}
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
              Change Password
            </h3>
            <p className="text-xs text-ink-400">Keep your account secure</p>
          </div>
        </div>
        <form onSubmit={savePassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button type="submit" loading={savingPassword} icon={<Lock className="h-4 w-4" />}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Attendance duration */}
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
              Attendance Duration
            </h3>
            <p className="text-xs text-ink-400">Default window for attendance sessions</p>
          </div>
        </div>
        <div className="space-y-4">
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            max={480}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <Button onClick={saveDuration} loading={savingDuration} icon={<Save className="h-4 w-4" />}>
            Save Duration
          </Button>
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
              Appearance
            </h3>
            <p className="text-xs text-ink-400">Switch between light and dark themes</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                : 'border-ink-200 dark:border-ink-700 hover:border-brand-300'
            }`}
          >
            <Sun className="h-7 w-7 text-amber-500" />
            <span className="text-sm font-medium text-ink-700 dark:text-ink-100">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                : 'border-ink-200 dark:border-ink-700 hover:border-brand-300'
            }`}
          >
            <Moon className="h-7 w-7 text-brand-500" />
            <span className="text-sm font-medium text-ink-700 dark:text-ink-100">Dark</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
