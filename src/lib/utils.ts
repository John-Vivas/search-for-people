// Utility functions for class names, formatting, etc.

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return dateString;
}

export function generateCode(type: string): string {
  const prefix = type === 'mascota' ? 'PET' : type === 'nn' ? 'NN' : 'COL';
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `#${prefix}-${year}-${randomNum}`;
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });

export function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) {
    return `Actualizado ${RELATIVE_TIME.format(diffMinutes, 'minute')}`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `Actualizado ${RELATIVE_TIME.format(diffHours, 'hour')}`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return `Actualizado ${RELATIVE_TIME.format(diffDays, 'day')}`;
  }

  return `Actualizado: ${date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
