import { apiClient } from '@/src/services/api/httpClient';
import { ServiceResponse } from '@/src/services/api/errors';

/**
 * Login for the Ayuda board: no password, no account — just prove you
 * control a phone number (receive an SMS code, redeem it). The backend
 * sets an httpOnly session cookie; this service never sees or stores the
 * token itself.
 */
export const phoneAuthService = {
  requestCode(phone: string): Promise<ServiceResponse<{ message: string }>> {
    return apiClient.post('/phone-verifications', { phone });
  },

  login(phone: string, code: string): Promise<ServiceResponse<{ expiresAt: string }>> {
    return apiClient.post('/phone-sessions', { phone, code });
  },

  me(): Promise<ServiceResponse<{ phone: string }>> {
    return apiClient.get('/phone-sessions/me');
  },

  logout(): Promise<ServiceResponse<null>> {
    return apiClient.delete('/phone-sessions');
  },
};
