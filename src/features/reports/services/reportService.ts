import { ReportForm, AdminReportItem, SightingReport } from '../types/report';
import { PersonItem } from '../../persons/types/person';
import { mapRoleUIToType } from '../types/reporter';
import { generateCode } from '../../../lib/utils';
import { mockApiCall, SupabaseResponse } from '../../../services/api/supabase';

export const reportService = {
  /**
   * Submit a new report (creates both public PersonItem and AdminReportItem).
   * Internal reporter data is kept private in AdminReportItem.
   * Prepared for Supabase transaction: insert to `reports` and `reporters` table.
   */
  async createReport(form: ReportForm): Promise<SupabaseResponse<{ newItem: PersonItem; newAdminReport: AdminReportItem }>> {
    const code = generateCode(form.itemType);
    const id = code.toLowerCase().replace('#', '');
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })} - ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

    const reporterType = mapRoleUIToType(form.reporterRole);
    const isVolunteer = reporterType === 'VOLUNTEER';

    const newItem: PersonItem = {
      id,
      code,
      type: form.itemType,
      name: form.subjectName || (form.itemType === 'nn' ? 'Persona Sin Identificar' : 'Por identificar'),
      age: form.subjectAge || 'Edad no especificada',
      gender: form.subjectGender || 'No especificado',
      photo: form.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      location: form.locationZone || 'Ubicación no especificada',
      city: form.locationZone.split(',')[0] || 'Bogotá',
      coordinates: [4.6097 + (Math.random() - 0.5) * 0.1, -74.0817 + (Math.random() - 0.5) * 0.1],
      updatedAt: 'Hace un momento',
      lastSeenDate: form.eventDate || 'Recientemente',
      verified: false,
      additionalDetails: form.observations,
      // Note: Reporter contact details are NOT attached to public item by default for privacy
    };

    const newAdminReport: AdminReportItem = {
      id: `rep-${Date.now()}`,
      code: `REP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: form.itemType,
      status: 'pending',
      reportDate: dateFormatted,
      reporterName: form.reporterName,
      reporterRole: `${form.reporterRole} (${form.reporterRelationship})`,
      reporterPhone: form.reporterPhone,
      reporterEmail: form.reporterEmail,
      reporterDocumentType: 'Cédula de Ciudadanía',
      reporterDocumentId: form.reporterDocumentId,
      reporterRelationship: form.reporterRelationship,
      reporterId: `usr-${form.reporterDocumentId || Date.now()}`,
      reporterType,
      personName: form.subjectName,
      personAge: form.subjectAge,
      personLocation: form.locationZone,
      personCity: newItem.city,
      personPhoto: newItem.photo,
      notes: form.observations,
      assignedReviewer: isVolunteer ? 'Voluntario Verificado' : 'Admin de Turno',
    };

    return mockApiCall({ newItem, newAdminReport });
  },

  /**
   * Submit a sighting or identification report for an existing person.
   * Prepared for Supabase insert to `sightings` table.
   */
  async submitSighting(sighting: SightingReport): Promise<SupabaseResponse<boolean>> {
    console.log('[reportService] Sighting submitted:', sighting);
    return mockApiCall(true);
  }
};
