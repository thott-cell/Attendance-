import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import Button from './Button';

interface WebcamProps {
  onCapture?: (blob: Blob, dataUrl: string) => void;
  /** When true, capture a frame automatically every `interval` ms. */
  autoCapture?: boolean;
  interval?: number;
  /** Mirror the video horizontally (selfie view). */
  mirror?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Reusable webcam component. Starts the user's camera, shows a live preview,
 * and either captures on demand (button) or on an interval (autoCapture).
 */
export default function Webcam({
  onCapture,
  autoCapture = false,
  interval = 2500,
  mirror = true,
  children,
  className,
}: WebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'live' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus('starting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('live');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unable to access camera');
        setStatus('error');
      }
    }

    start();
    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Auto-capture loop.
  useEffect(() => {
    if (!autoCapture || status !== 'live') return;
    const id = setInterval(() => capture(), interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCapture, status, interval]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.toBlob((blob) => {
      if (blob && onCapture) onCapture(blob, canvas.toDataURL('image/jpeg', 0.9));
    }, 'image/jpeg', 0.9);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 aspect-[4/3] shadow-glass">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {status === 'live' && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-6 rounded-xl border-2 border-brand-400/70 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]" />
            <div className="absolute left-1/2 top-6 h-1 w-24 -translate-x-1/2 rounded-full bg-brand-400/80 animate-pulse" />
          </div>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <Camera className="h-8 w-8 animate-pulse" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 px-6 text-center">
            <CameraOff className="h-8 w-8 text-rose-400" />
            <p className="text-sm">{error || 'Camera unavailable'}</p>
          </div>
        )}

        {children}
      </div>

      {!autoCapture && status === 'live' && (
        <div className="mt-3 flex justify-center">
          <Button onClick={() => capture()} icon={<Camera className="h-4 w-4" />}>
            Capture Photo
          </Button>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-3 flex justify-center">
          <Button variant="secondary" onClick={() => location.reload()} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
