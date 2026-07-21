import type * as FaceApi from 'face-api.js';
import { FACE_MODELS_URL } from '../config/firebase';

export interface FaceValidationResult {
  ok: boolean;
  reason?: string;
  descriptor?: Float32Array;
  box?: FaceApi.Box;
}

// face-api.js is heavy (~1MB). We load it dynamically only when the Live
// Attendance or Register Student page needs it, so it never enters the
// initial bundle and never blocks the Login page.
let faceapi: typeof FaceApi | null = null;
let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function ensureLib(): Promise<typeof FaceApi> {
  if (faceapi) return faceapi;
  const mod = await import('face-api.js');
  faceapi = mod;
  return mod;
}

/** Load all face-api.js models needed for detection + recognition. */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const api = await ensureLib();
    await Promise.all([
      api.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL),
      api.nets.faceLandmark68Net.loadFromUri(FACE_MODELS_URL),
      api.nets.faceRecognitionNet.loadFromUri(FACE_MODELS_URL),
    ]);
    modelsLoaded = true;
  })();

  return loadingPromise;
}

export function areModelsLoaded() {
  return modelsLoaded;
}

/** Detect a single face and compute its 128-d descriptor from a video/image element. */
export async function detectFace(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{ descriptor: Float32Array; box: FaceApi.Box } | null> {
  const api = await ensureLib();
  await loadFaceModels();
  const options = new api.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const result = await api
    .detectSingleFace(input, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) return null;
  return { descriptor: result.descriptor, box: result.detection.box };
}

/**
 * Validate a captured frame for student registration:
 *  - exactly one face detected
 *  - image is not blurred
 *  - descriptor can be computed
 * Returns ok=false with a reason string when validation fails.
 */
export async function validateFaceForRegistration(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<FaceValidationResult> {
  const api = await ensureLib();
  await loadFaceModels();
  const options = new api.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

  // Detect ALL faces to reject multi-face images.
  const all = await api.detectAllFaces(input, options).withFaceLandmarks();
  if (all.length === 0) {
    return { ok: false, reason: 'No face detected in the photo. Please retake.' };
  }
  if (all.length > 1) {
    return { ok: false, reason: 'Multiple faces detected. Ensure only one face is in the frame.' };
  }

  // Blur check via face detection score — low score often indicates blur.
  const detection = all[0].detection;
  if (detection.score < 0.6) {
    return { ok: false, reason: 'Image appears blurry. Please retake with better lighting and focus.' };
  }

  // Compute descriptor for the single detected face.
  const withDescriptor = await api
    .detectSingleFace(input, options)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!withDescriptor) {
    return { ok: false, reason: 'Could not compute face descriptor. Please retake.' };
  }
  return {
    ok: true,
    descriptor: withDescriptor.descriptor,
    box: withDescriptor.detection.box,
  };
}

/** Euclidean distance between two descriptors. Lower = more similar. */
export function compareDescriptors(a: Float32Array | number[], b: Float32Array | number[]): number {
  const api = faceapi;
  if (!api) {
    // Fallback if lib somehow not loaded: compute manually.
    const av = a instanceof Float32Array ? a : new Float32Array(a);
    const bv = b instanceof Float32Array ? b : new Float32Array(b);
    let sum = 0;
    for (let i = 0; i < av.length; i++) {
      const d = av[i] - bv[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }
  return api.euclideanDistance(
    a instanceof Float32Array ? a : new Float32Array(a),
    b instanceof Float32Array ? b : new Float32Array(b)
  );
}

export const MATCH_THRESHOLD = 0.5;
