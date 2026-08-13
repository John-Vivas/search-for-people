import { useState, useCallback } from 'react';
import {
  compressImage,
  uploadToCloudinary,
} from '@/src/services/cloudinary/cloudinary.service';
import type { ProcessedUploadItem } from '@/src/services/cloudinary/cloudinary.types';

const MAX_IMAGES_LIMIT = 3;
const MAX_INITIAL_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UseImageUploadOptions {
  maxImages?: number;
  folderCategory?: 'persons/missing' | 'persons/found' | 'persons/unidentified' | 'pets';
  entityId?: string;
}

export function useImageUpload(options?: UseImageUploadOptions) {
  const maxImages = options?.maxImages ?? MAX_IMAGES_LIMIT;
  const folderCategory = options?.folderCategory ?? 'persons/missing';

  const [items, setItems] = useState<ProcessedUploadItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const processAndUploadFile = async (
    item: ProcessedUploadItem,
    folderPath: string
  ) => {
    // 1. Compression phase
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: 'compressing', progress: 20 } : i
      )
    );

    try {
      const compressed = await compressImage(item.file);

      // 2. Upload phase
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                file: compressed.file,
                previewUrl: compressed.previewUrl,
                status: 'uploading',
                progress: 50,
              }
            : i
        )
      );

      const uploadResult = await uploadToCloudinary(compressed.file, {
        folder: folderPath,
      });

      if (uploadResult.error || !uploadResult.data) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  progress: 0,
                  errorMessage:
                    uploadResult.error?.message ||
                    'No se pudo subir la fotografía. Reintenta.',
                }
              : i
          )
        );
        return;
      }

      const { secure_url, public_id } = uploadResult.data;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'success',
                progress: 100,
                cloudinaryUrl: secure_url,
                cloudinaryPublicId: public_id,
              }
            : i
        )
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'error',
                progress: 0,
                errorMessage:
                  err instanceof Error
                    ? err.message
                    : 'Error inesperado al procesar la imagen.',
              }
            : i
        )
      );
    }
  };

  const addFiles = useCallback(
    async (fileList: FileList | File[], customFolder?: string) => {
      setGlobalError(null);
      const filesArray = Array.from(fileList);

      if (filesArray.length === 0) return;

      const currentCount = items.length;
      if (currentCount >= maxImages) {
        setGlobalError(`Solo se permite un máximo de ${maxImages} fotografías por registro.`);
        return;
      }

      const availableSlots = maxImages - currentCount;
      const filesToProcess = filesArray.slice(0, availableSlots);

      if (filesArray.length > availableSlots) {
        setGlobalError(
          `Solo se agregaron ${availableSlots} fotografía(s). El máximo permitido es ${maxImages}.`
        );
      }

      const newItems: ProcessedUploadItem[] = [];

      for (let index = 0; index < filesToProcess.length; index++) {
        const file = filesToProcess[index];

        // Format check
        if (!ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())) {
          setGlobalError(
            `El archivo "${file.name}" no es una imagen válida (JPG, PNG, WEBP).`
          );
          continue;
        }

        // Initial size check
        if (file.size > MAX_INITIAL_FILE_SIZE_BYTES) {
          setGlobalError(
            `El archivo "${file.name}" supera los 5 MB recomendados. Intentaremos optimizarlo.`
          );
        }

        const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const previewUrl = URL.createObjectURL(file);
        const isPrimary = currentCount === 0 && newItems.length === 0;

        const newItem: ProcessedUploadItem = {
          id,
          file,
          previewUrl,
          status: 'idle',
          progress: 0,
          isPrimary,
        };

        newItems.push(newItem);
      }

      if (newItems.length === 0) return;

      setItems((prev) => [...prev, ...newItems]);

      const subFolder = customFolder || `estamos-buscando/${folderCategory}/${options?.entityId || 'draft'}`;

      for (const item of newItems) {
        processAndUploadFile(item, subFolder);
      }
    },
    [items.length, maxImages, folderCategory, options?.entityId]
  );

  const removeImage = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      // Revoke preview object URL
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      // Re-assign primary if needed
      if (filtered.length > 0 && !filtered.some((i) => i.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  }, []);

  const retryUpload = useCallback(
    (id: string) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;

      const subFolder = `estamos-buscando/${folderCategory}/${options?.entityId || 'draft'}`;
      processAndUploadFile(target, subFolder);
    },
    [items, folderCategory, options?.entityId]
  );

  const setPrimaryImage = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        isPrimary: i.id === id,
      }))
    );
  }, []);

  const clearImages = useCallback(() => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setItems([]);
    setGlobalError(null);
  }, [items]);

  const isUploading = items.some(
    (i) => i.status === 'compressing' || i.status === 'uploading'
  );
  const uploadedUrls = items
    .filter((i) => i.status === 'success' && i.cloudinaryUrl)
    .map((i) => i.cloudinaryUrl as string);

  const primaryItem = items.find((i) => i.isPrimary) || items[0];
  const primaryUrl = primaryItem?.cloudinaryUrl || primaryItem?.previewUrl || null;

  return {
    items,
    isUploading,
    uploadedUrls,
    primaryUrl,
    globalError,
    addFiles,
    removeImage,
    retryUpload,
    setPrimaryImage,
    clearImages,
    maxImages,
  };
}
