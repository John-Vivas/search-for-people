/**
 * Cloudinary Service — Browser image compression & unsigned REST upload
 */

import { ok, fail, ServiceResponse } from '@/src/services/api/errors';
import type {
  CloudinaryUploadOptions,
  CloudinaryUploadResponse,
  CompressedImageResult,
} from '@/src/services/cloudinary/cloudinary.types';

const MAX_IMAGE_WIDTH = 1200;
const COMPRESSION_QUALITY = 0.8;

function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  return {
    cloudName: cloudName ? String(cloudName).trim() : '',
    uploadPreset: uploadPreset ? String(uploadPreset).trim() : '',
  };
}

/**
 * Automatically compress image in browser using Canvas HTML5 API.
 * - Maximum width: 1200px (maintains aspect ratio).
 * - Format: WebP (or original if canvas blob conversion fails).
 * - Quality: 75%-80%.
 */
export async function compressImage(
  file: File,
  maxWidth: number = MAX_IMAGE_WIDTH,
  quality: number = COMPRESSION_QUALITY
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // Return SVG or non-image files unchanged
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      const previewUrl = URL.createObjectURL(file);
      return resolve({
        file,
        previewUrl,
        width: 0,
        height: 0,
        originalSizeBytes: file.size,
        compressedSizeBytes: file.size,
      });
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('No se pudo leer la imagen seleccionada'));
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const previewUrl = URL.createObjectURL(file);
        return resolve({
          file,
          previewUrl,
          width: img.width,
          height: img.height,
          originalSizeBytes: file.size,
          compressedSizeBytes: file.size,
        });
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP
      const targetMime = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const previewUrl = URL.createObjectURL(file);
            return resolve({
              file,
              previewUrl,
              width,
              height,
              originalSizeBytes: file.size,
              compressedSizeBytes: file.size,
            });
          }

          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: targetMime,
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(compressedFile);
          resolve({
            file: compressedFile,
            previewUrl,
            width,
            height,
            originalSizeBytes: file.size,
            compressedSizeBytes: compressedFile.size,
          });
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('No se pudo cargar la imagen para optimización'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload compressed image to Cloudinary using unsigned preset.
 */
export async function uploadToCloudinary(
  file: File,
  options?: CloudinaryUploadOptions
): Promise<ServiceResponse<CloudinaryUploadResponse>> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    return fail(
      new Error('Cloudinary not configured'),
      'Cloudinary no está configurado. Verifique VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.'
    );
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    if (options?.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cloudinary Upload Error]', response.status, errorText);
      return fail(
        new Error(`Cloudinary upload failed: ${response.status}`),
        'No se pudo subir la fotografía a Cloudinary. Intenta nuevamente.'
      );
    }

    const result: CloudinaryUploadResponse = await response.json();
    return ok(result);
  } catch (error) {
    console.error('[Cloudinary Network Error]', error);
    return fail(error, 'Error de conexión al subir la fotografía.');
  }
}

/**
 * Sube una imagen a Cloudinary DESDE UNA URL remota (Cloudinary la descarga y
 * la guarda). Se usa para el modo "pegar link": así la foto queda alojada en
 * Cloudinary de forma durable y no depende del CDN de la red social (que expira).
 */
export async function uploadRemoteToCloudinary(
  imageUrl: string,
  options?: CloudinaryUploadOptions
): Promise<ServiceResponse<CloudinaryUploadResponse>> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    return fail(
      new Error('Cloudinary not configured'),
      'Cloudinary no está configurado.'
    );
  }

  try {
    const formData = new FormData();
    formData.append('file', imageUrl); // Cloudinary acepta una URL remota como file
    formData.append('upload_preset', uploadPreset);
    if (options?.folder) formData.append('folder', options.folder);
    if (options?.tags?.length) formData.append('tags', options.tags.join(','));

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(endpoint, { method: 'POST', body: formData });

    if (!response.ok) {
      return fail(
        new Error(`Cloudinary remote upload failed: ${response.status}`),
        'No se pudo guardar la imagen del enlace. Probá subir la foto.'
      );
    }

    const result: CloudinaryUploadResponse = await response.json();
    return ok(result);
  } catch (error) {
    return fail(error, 'Error al guardar la imagen del enlace.');
  }
}

/**
 * Generate transformed Cloudinary URL (f_auto, q_auto, responsive sizes).
 */
export function getOptimizedImageUrl(
  urlOrPublicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): string {
  if (!urlOrPublicId) return '';

  // If it's already a full Cloudinary URL
  if (urlOrPublicId.includes('res.cloudinary.com')) {
    const parts = urlOrPublicId.split('/upload/');
    if (parts.length === 2) {
      const transforms: string[] = [];
      const format = options?.format || 'f_auto';
      const quality = options?.quality || 'q_auto';
      transforms.push(format, quality);

      if (options?.width) transforms.push(`w_${options.width}`);
      if (options?.height) transforms.push(`h_${options.height}`);
      if (options?.crop) transforms.push(`c_${options.crop}`);

      return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
    }
    return urlOrPublicId;
  }

  const { cloudName } = getCloudinaryConfig();
  if (!cloudName) return urlOrPublicId;

  const transforms: string[] = ['f_auto', 'q_auto'];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${urlOrPublicId}`;
}

export const cloudinaryService = {
  compressImage,
  uploadToCloudinary,
  getOptimizedImageUrl,
};
