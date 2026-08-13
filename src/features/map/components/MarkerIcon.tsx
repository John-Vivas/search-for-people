import { MapLocationType, PersonMapStatus, FacilityType } from '@/src/features/map/types/map.types';

export interface MarkerStyle {
  bg: string;
  border: string;
  icon: string;
  label: string;
}

export function getMarkerStyle(
  type: MapLocationType,
  status?: PersonMapStatus | FacilityType
): MarkerStyle {
  if (type === 'PERSON') {
    switch (status) {
      case 'MISSING':
        return {
          bg: '#ba1a1a',
          border: '#93000a',
          icon: 'person_alert',
          label: 'Desaparecido',
        };
      case 'FOUND':
        return {
          bg: '#00685d',
          border: '#004d45',
          icon: 'person',
          label: 'Encontrado',
        };
      case 'UNIDENTIFIED':
        return {
          bg: '#8e711f',
          border: '#735802',
          icon: 'person_search',
          label: 'NN — Sin identificar',
        };
      default:
        return { bg: '#6d7a77', border: '#3d4947', icon: 'person', label: 'Persona' };
    }
  }

  if (type === 'PET') {
    return {
      bg: '#735802',
      border: '#5a4600',
      icon: 'pets',
      label: 'Mascota',
    };
  }

  return {
    bg: '#436370',
    border: '#2d434f',
    icon: 'local_hospital',
    label: 'Centro de atención',
  };
}

export function buildMarkerHtml(style: MarkerStyle, selected = false): string {
  const scale = selected ? 'scale(1.15)' : 'scale(1)';
  return `
    <div
      role="img"
      aria-label="${style.label}"
      style="
        width: 44px;
        height: 44px;
        background: ${style.bg};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) ${scale};
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease;
      "
    >
      <span
        class="material-symbols-outlined"
        style="
          color: white;
          font-size: 18px;
          transform: rotate(45deg);
          font-variation-settings: 'FILL' 1;
        "
      >${style.icon}</span>
    </div>
  `;
}

export function buildClusterHtml(count: number, label: string, selected = false): string {
  const size = selected ? 56 : 48;
  return `
    <div
      role="img"
      aria-label="${label}: ${count} registros"
      style="
        width: ${size}px;
        height: ${size}px;
        background: #008376;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        font-family: Inter, sans-serif;
      "
    >
      <span style="font-size: 16px; font-weight: 800; line-height: 1;">${count}</span>
      <span style="font-size: 8px; font-weight: 600; opacity: 0.9; max-width: 44px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${label}</span>
    </div>
  `;
}

export function buildZoneAreaStyle(active: boolean) {
  return {
    color: active ? '#008376' : '#6d7a77',
    fillColor: active ? '#008376' : '#bcc9c6',
    fillOpacity: active ? 0.12 : 0.06,
    weight: active ? 2 : 1,
  };
}
