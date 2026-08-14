/**
 * Cloudinary Types & Interfaces
 */

export interface CloudinaryUploadOptions {
  /** Folder path in Cloudinary, e.g. estamos-buscando/persons/missing/{personId} */
  folder?: string;
  tags?: string[];
}

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature?: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
}

export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

export interface ProcessedUploadItem {
  id: string;
  /** Archivo local (modo "subir foto"). Ausente en items desde enlace. */
  file?: File;
  previewUrl: string;
  status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error';
  progress: number;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  errorMessage?: string;
  isPrimary?: boolean;
  /** URL de la publicación (modo "pegar link"). */
  sourceUrl?: string;
}
