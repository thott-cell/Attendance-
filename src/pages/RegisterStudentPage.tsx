import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, CheckCircle2, Camera, RotateCcw, UploadCloud, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Webcam from '../components/ui/Webcam';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { addStudent, isMatricNumberTaken, isEmailTaken, findMatchingStudent } from '../services/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import { loadFaceModels, validateFaceForRegistration } from '../services/faceApi';
import { FACULTIES, LEVELS } from '../types';
import { todayISO } from '../utils/helpers';

interface FormState {
  fullName: string;
  matricNumber: string;
  department: string;
  faculty: string;
  level: string;
  email: string;
  phone: string;
}

const initialForm: FormState = {
  fullName: '',
  matricNumber: '',
  department: '',
  faculty: '',
  level: '',
  email: '',
  phone: '',
};

export default function RegisterStudentPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadFaceModels()
      .then(() => setModelsReady(true))
      .catch(() => toast('Failed to load face models. Add weights to /public/models.', 'error'));
  }, [toast]);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleCapture(blob: Blob, dataUrl: string) {
    setCapturedBlob(blob);
    setCapturedUrl(dataUrl);
    setDescriptor(null);
    setDetecting(true);
    try {
      const img = await loadImage(dataUrl);
      const result = await validateFaceForRegistration(img);
      if (!result.ok) {
        toast(result.reason ?? 'Face validation failed.', 'warning');
        setDescriptor(null);
        return;
      }
      setDescriptor(result.descriptor ?? null);
      toast('Face captured successfully.', 'success');
    } catch {
      toast('Face detection failed. Check that model weights are in /public/models.', 'error');
    } finally {
      setDetecting(false);
    }
  }

  function retake() {
    setCapturedUrl(null);
    setCapturedBlob(null);
    setDescriptor(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!capturedBlob || !capturedUrl) {
      toast('Please capture the student\'s face photo.', 'warning');
      return;
    }
    if (!descriptor) {
      toast('No face descriptor generated. Recapture the photo.', 'warning');
      return;
    }
    const missing = (Object.keys(form) as (keyof FormState)[]).filter((k) => !form[k].trim());
    if (missing.length) {
      toast('Please fill in all fields.', 'warning');
      return;
    }

    setProcessing(true);
    try {
      // 1. Duplicate matric number check
      if (await isMatricNumberTaken(form.matricNumber)) {
        toast('This matric number is already registered.', 'error');
        return;
      }
      // 2. Duplicate email check
      if (form.email && await isEmailTaken(form.email)) {
        toast('This email has already been registered.', 'error');
        return;
      }
      // 3. Duplicate face check
      const faceMatch = await findMatchingStudent(Array.from(descriptor));
      if (faceMatch) {
        toast('This face has already been registered by another student.', 'error');
        return;
      }

      const imageUrl = await uploadToCloudinary(capturedBlob);
      await addStudent({
        ...form,
        imageUrl,
        descriptor: Array.from(descriptor),
      });
      toast(`${form.fullName} registered successfully!`, 'success');
      setForm(initialForm);
      retake();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Camera column */}
      <div className="lg:col-span-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
                Capture Face
              </h3>
              <p className="text-xs text-ink-400">
                {modelsReady ? 'Models loaded' : 'Loading face models…'}
              </p>
            </div>
            {capturedUrl && (
              <Button variant="secondary" size="sm" onClick={retake} icon={<RotateCcw className="h-4 w-4" />}>
                Retake
              </Button>
            )}
          </div>

          {capturedUrl ? (
            <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-ink-900 shadow-glass">
              <img ref={imgRef} src={capturedUrl} alt="Captured" className="h-full w-full object-cover -scale-x-100" />
              {detecting && (
                <div className="absolute inset-0 grid place-items-center bg-ink-950/40 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Loader2 className="h-5 w-5 animate-spin" /> Analyzing face…
                  </div>
                </div>
              )}
              {descriptor && !detecting && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-medium text-white">
                  <CheckCircle2 className="h-4 w-4" /> Face verified
                </div>
              )}
            </div>
          ) : (
            <Webcam onCapture={handleCapture} />
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3 text-xs text-brand-700 dark:text-brand-300">
            <Camera className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Ensure the face is well-lit, centered, and looking directly at the camera for an
              accurate descriptor.
            </span>
          </div>
        </Card>
      </div>

      {/* Form column */}
      <div className="lg:col-span-3">
        <Card>
          <div className="mb-6">
            <h3 className="font-display text-lg font-semibold text-ink-700 dark:text-ink-100">
              Student Information
            </h3>
            <p className="text-xs text-ink-400">
              Fields marked with * are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Full Name *"
                placeholder="e.g. Ada Lovelace"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </div>
            <Input
              label="Matric Number *"
              placeholder="e.g. CSC/2021/001"
              value={form.matricNumber}
              onChange={(e) => set('matricNumber', e.target.value)}
            />
            <Input
              label="Department *"
              placeholder="e.g. Computer Science"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
            />
            <Select
              label="Faculty *"
              value={form.faculty}
              onChange={(e) => set('faculty', e.target.value)}
            >
              <option value="">Select faculty</option>
              {FACULTIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
            <Select
              label="Level *"
              value={form.level}
              onChange={(e) => set('level', e.target.value)}
            >
              <option value="">Select level</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l} Level</option>
              ))}
            </Select>
            <Input
              label="Email *"
              type="email"
              placeholder="student@university.edu"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            <Input
              label="Phone Number *"
              placeholder="e.g. +234 800 000 0000"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />

            <div className="sm:col-span-2 mt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-xs text-ink-400">
                Registered on: <span className="font-medium text-ink-600 dark:text-ink-300">{todayISO()}</span>
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setForm(initialForm); retake(); }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  loading={processing}
                  icon={!processing ? <UploadCloud className="h-4 w-4" /> : undefined}
                >
                  Register Student
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

// Helper: load an image element from a data URL.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
