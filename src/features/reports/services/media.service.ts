/**
 * Media / Storage service — Phase 7
 * Handles Supabase Storage uploads and signed URLs.
 */
import { getSupabaseClient } from '../../../lib/supabase';
import { isMockMode } from '../../../lib/dataSource';
import { ok, fail, ServiceResponse } from '../../../services/api/errors';
import type { ReportMediaRow } from '../../../types/database';
import type { MediaType } from '../../../types/enums';

export type ReportMedia = ReportMediaRow;

export interface UploadMediaInput {
  file: File;
  bucket: string;
  path: string;
  mediaType: MediaType;
  reportId?: string;
  personId?: string;
  petId?: string;
  isPrimary?: boolean;
}

const MEDIA_COLUMNS =
  'id, report_id, person_id, pet_id, storage_bucket, storage_path, media_type, mime_type, file_size_bytes, is_primary, created_at' as const;

export const mediaService = {
  async uploadMedia(input: UploadMediaInput): Promise<ServiceResponse<ReportMedia>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Subida de archivos disponible con Supabase Storage');
    }

    try {
      const supabase = getSupabaseClient();

      const { error: uploadError } = await supabase.storage
        .from(input.bucket)
        .upload(input.path, input.file, { upsert: false });

      if (uploadError) return fail(uploadError, 'No se pudo subir el archivo');

      const { data, error } = await supabase
        .from('report_media')
        .insert({
          storage_bucket: input.bucket,
          storage_path: input.path,
          media_type: input.mediaType,
          mime_type: input.file.type || null,
          file_size_bytes: input.file.size,
          report_id: input.reportId ?? null,
          person_id: input.personId ?? null,
          pet_id: input.petId ?? null,
          is_primary: input.isPrimary ?? false,
        })
        .select(MEDIA_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo registrar el archivo');
      return ok(data);
    } catch (error) {
      return fail(error, 'No se pudo subir el archivo');
    }
  },

  async deleteMedia(id: string, bucket: string, path: string): Promise<ServiceResponse<boolean>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Eliminación disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();

      const { error: storageError } = await supabase.storage.from(bucket).remove([path]);
      if (storageError) return fail(storageError, 'No se pudo eliminar el archivo');

      const { error } = await supabase.from('report_media').delete().eq('id', id);
      if (error) return fail(error, 'No se pudo eliminar el registro del archivo');

      return ok(true);
    } catch (error) {
      return fail(error, 'No se pudo eliminar el archivo');
    }
  },

  /**
   * Returns a public or signed URL depending on bucket policy.
   * Phase 7+: use createSignedUrl for private buckets.
   */
  async getMediaUrl(
    bucket: string,
    path: string,
    expiresInSeconds = 3600
  ): Promise<ServiceResponse<string>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'URLs de media disponibles con Supabase');
    }

    try {
      const supabase = getSupabaseClient();

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
      if (publicData?.publicUrl) {
        return ok(publicData.publicUrl);
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (error) return fail(error, 'No se pudo obtener la URL del archivo');
      return ok(data.signedUrl);
    } catch (error) {
      return fail(error, 'No se pudo obtener la URL del archivo');
    }
  },
};
