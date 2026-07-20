import { cloudinaryConfig } from '../config/firebase';

/**
 * Upload an image blob to Cloudinary using an unsigned upload preset.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadToCloudinary(blob: Blob): Promise<string> {
  const { cloudName, uploadPreset } = cloudinaryConfig;
  if (!cloudName || cloudName.startsWith('YOUR_')) {
    throw new Error('Cloudinary is not configured. Add your credentials in src/config/firebase.ts');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  form.append('file', blob);
  form.append('upload_preset', uploadPreset);

  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}
