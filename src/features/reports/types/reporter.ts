export type ReporterType = import('@/src/types/enums').ReporterType;

export type ReporterRoleUI = 'familiar' | 'testigo' | 'voluntario' | 'otra_persona';
export type ReporterRole = ReporterRoleUI;

export interface ReporterInfo {
  reporterId?: string;
  reporterType: ReporterType;
  name: string;
  documentType: string;
  documentId: string;
  phone: string;
  email: string;
  relationship: string;
  isVolunteer?: boolean;
}

export function mapRoleUIToType(role: ReporterRoleUI): ReporterType {
  switch (role) {
    case 'familiar':
      return 'FAMILY';
    case 'testigo':
      return 'WITNESS';
    case 'voluntario':
      return 'VOLUNTEER';
    case 'otra_persona':
    default:
      return 'OTHER';
  }
}

export function mapTypeToRoleUI(type: ReporterType): ReporterRoleUI {
  switch (type) {
    case 'FAMILY':
      return 'familiar';
    case 'WITNESS':
      return 'testigo';
    case 'VOLUNTEER':
      return 'voluntario';
    case 'OTHER':
    default:
      return 'otra_persona';
  }
}
