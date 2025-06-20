import { apiClient } from './client';

export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  values?: string[];
  options?: string[];
  default?: string;
  groupmember?: boolean;
  helptext?: string;
}

export interface EventData {
  id: string;
  name: string;
  description: string;
  banner?: string;
  header?: string;
  logo?: string;
  footer?: string;
  formFields: FormField[];
}

export const eventApi = {
  getEventInfo: async (eventId: string): Promise<{ event: EventData }> => {
    // The backend uses a query parameter for this specific route
    const response = await apiClient.get(`/api/events/?eventId=${eventId}`);
    return response.data;
  },

  submitRegistration: async (eventId: string, data: Record<string, any>) => {
    const response = await apiClient.post(`/api/events/${eventId}/register`, data);
    return response.data;
  },

  getRegistrations: async (eventId: string) => {
    const response = await apiClient.get(`/api/events/${eventId}/registrations`);
    return response.data;
  },
}; 