import React, { useRef, useState } from 'react';
import {
  Upload,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Star,
  Link as LinkIcon,
} from 'lucide-react';
import type { ProcessedUploadItem } from '@/src/services/cloudinary/cloudinary.types';

interface ImageUploaderProps {
  items: ProcessedUploadItem[];
  isUploading: boolean;
  maxImages?: number;
  globalError?: string | null;
  onAddFiles: (files: FileList | File[]) => void;
  onAddLink?: (url: string) => void;
  onRemoveImage: (id: string) => void;
  onRetryUpload: (id: string) => void;
  onSetPrimaryImage?: (id: string) => void;
  label?: string;
  helperText?: string;
}

export function ImageUploader({
  items,
  isUploading,
  maxImages = 3,
  globalError,
  onAddFiles,
  onAddLink,
  onRemoveImage,
  onRetryUpload,
  onSetPrimaryImage,
  label = 'Fotografías de la persona o mascota',
  helperText = 'Puedes adjuntar hasta 3 fotografías (JPG, PNG, WEBP). Se optimizarán automáticamente.',
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [linkValue, setLinkValue] = useState('');

  const submitLink = () => {
    const url = linkValue.trim();
    if (!url || !onAddLink) return;
    onAddLink(url);
    setLinkValue('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const canAddMore = items.length < maxImages;

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[#191c1d]">
          {label}{' '}
          <span className="text-xs font-normal text-[#6d7a77]">
            ({items.length}/{maxImages})
          </span>
        </label>
        {isUploading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#00685d] font-medium animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Optimizando y subiendo...
          </span>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-[#5c6462] leading-relaxed">{helperText}</p>
      )}

      {globalError && (
        <div className="p-3 bg-[#ffdad6] border border-[#ffb4ab] rounded-xl text-xs text-[#410002] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {onAddLink && (
        <div className="flex gap-1 p-1 bg-[#f0f2f1] rounded-xl">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'upload' ? 'bg-white text-[#00685d] shadow-sm' : 'text-[#5c6462]'
            }`}
          >
            <Upload className="w-4 h-4" /> Subir foto
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'link' ? 'bg-white text-[#00685d] shadow-sm' : 'text-[#5c6462]'
            }`}
          >
            <LinkIcon className="w-4 h-4" /> Pegar link
          </button>
        </div>
      )}

      {mode === 'link' && onAddLink && canAddMore && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="url"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitLink();
                }
              }}
              placeholder="Pega el link de Instagram, Facebook o TikTok"
              className="flex-1 h-11 px-3 rounded-xl border border-[#c1c8c5] text-sm focus:outline-none focus:border-[#00685d] focus:ring-1 focus:ring-[#00685d]"
            />
            <button
              type="button"
              onClick={submitLink}
              disabled={!linkValue.trim()}
              className="h-11 px-4 rounded-xl bg-[#00685d] text-white text-sm font-bold hover:bg-[#008376] transition-colors cursor-pointer disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
          <p className="text-[11px] text-[#6d7a77]">
            Tomamos la foto de portada de la publicación (debe ser pública). Si no tiene link, usá "Subir foto".
          </p>
        </div>
      )}

      {/* Grid of uploaded items + Upload dropzone button */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`relative group rounded-xl overflow-hidden border bg-white shadow-sm transition-all flex flex-col ${
              item.isPrimary ? 'ring-2 ring-[#00685d] border-transparent' : 'border-[#c1c8c5]'
            }`}
          >
            {/* Image Preview Container */}
            <div className="relative aspect-square bg-[#f0f2f1] overflow-hidden flex items-center justify-center">
              <img
                src={item.cloudinaryUrl || item.previewUrl}
                alt={`Fotografía ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Status Overlay */}
              {item.status === 'compressing' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-white text-center">
                  <RefreshCw className="w-5 h-5 animate-spin mb-1 text-[#40e0d0]" />
                  <span className="text-[11px] font-medium">Comprimiendo...</span>
                </div>
              )}

              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-white text-center">
                  <RefreshCw className="w-5 h-5 animate-spin mb-1 text-[#008376]" />
                  <span className="text-[11px] font-medium">Subiendo {item.progress}%</span>
                  <div className="w-3/4 bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#008376] h-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {item.status === 'error' && (
                <div className="absolute inset-0 bg-[#ba1a1a]/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-white text-center">
                  <AlertCircle className="w-5 h-5 mb-1" />
                  <span className="text-[11px] leading-tight line-clamp-2 px-1">
                    {item.errorMessage || 'Error al subir'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRetryUpload(item.id)}
                    className="mt-2 px-2.5 py-1 bg-white text-[#ba1a1a] text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar
                  </button>
                </div>
              )}

              {/* Primary Badge */}
              {item.isPrimary && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#00685d] text-white text-[10px] font-bold rounded-md shadow-xs flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Principal
                </span>
              )}

              {/* Success Badge */}
              {item.status === 'success' && !item.isPrimary && (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#00685d]/90 text-white text-[10px] font-medium rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#40e0d0]" /> Listo
                </span>
              )}

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {onSetPrimaryImage && !item.isPrimary && item.status === 'success' && (
                  <button
                    type="button"
                    onClick={() => onSetPrimaryImage(item.id)}
                    title="Marcar como foto principal"
                    className="p-1.5 bg-black/60 hover:bg-[#00685d] text-white rounded-full transition-colors cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveImage(item.id)}
                  title="Eliminar fotografía"
                  className="p-1.5 bg-black/60 hover:bg-[#ba1a1a] text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="p-2 text-[11px] text-[#5c6462] truncate bg-white flex items-center justify-between border-t border-[#f0f2f1]">
              <span className="truncate max-w-[75%] flex items-center gap-1">
                {!item.file && <LinkIcon className="w-3 h-3 shrink-0 text-[#00685d]" />}
                {item.file ? item.file.name : 'Desde enlace'}
              </span>
              {item.file && (
                <span className="text-[10px] font-mono text-[#8c9491]">
                  {(item.file.size / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Add More Dropzone Card */}
        {canAddMore && mode === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="aspect-square border-2 border-dashed border-[#a6b0ac] hover:border-[#00685d] bg-[#f8f9fa] hover:bg-[#f0f5f4] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-white group-hover:bg-[#e6f4f1] border border-[#c1c8c5] group-hover:border-[#00685d] flex items-center justify-center text-[#5c6462] group-hover:text-[#00685d] transition-colors mb-2 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#191c1d] group-hover:text-[#00685d] transition-colors">
              {items.length === 0 ? 'Agregar foto' : 'Agregar otra foto'}
            </span>
            <span className="text-[10px] text-[#6d7a77] mt-1">
              Arrastra o haz clic
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxImages > 1}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
