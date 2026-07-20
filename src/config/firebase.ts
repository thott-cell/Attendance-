/**
 * Firebase configuration.
 *
 * Replace the placeholder values below with your Firebase project's config.
 * You can find these in Firebase Console → Project Settings → General →
 * "Your apps" → SDK setup and configuration.
 */
export const firebaseConfig = {
   apiKey: "AIzaSyCNZykAW7aSemKMXC_eEF0KFM9cZyuPSh4",

  authDomain: "quiz-question-and-answer.firebaseapp.com",

  projectId: "quiz-question-and-answer",

  storageBucket: "quiz-question-and-answer.firebasestorage.app",

  messagingSenderId: "93655133377",

  appId: "1:93655133377:web:08ac3115f86e7892073840",
};

/**
 * Cloudinary configuration.
 *
 * Replace with your Cloudinary credentials. Find them in the Cloudinary
 * Console → Dashboard. Use an *unsigned* upload preset created under
 * Settings → Upload → Upload presets.
 */
export const cloudinaryConfig = {
  cloudName: 'dbj6koi4f',
  uploadPreset: 'JobConnect-upload',
};

/**
 * Path to the face-api.js model weights. These must be served alongside the
 * app. Download from:
 * https://github.com/justadudewhohacks/face-api.js/tree/master/weights
 * and place them in `/public/models`.
 */
export const FACE_MODELS_URL = '/models';
