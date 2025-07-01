import { apiClient } from './client';

export interface FormField {
  sort: number;
  label: string;
  type: string;
  required: boolean;
  groupmember: boolean;
  helptext: string;
  placeholder: string;
  field_condition: string;
  section_name: string;
  section_sort: number;
  section_condition: string;
  matching_field: boolean;
  values?: string[];
  options?: string[];
  default?: string;
  // Agreement specific fields
  title?: string;
  content?: string;
  checkbox_label?: string;
  checkboxLabel?: string; // Alternative camelCase
  link_text?: string;
  linkText?: string; // Alternative camelCase
  link_url?: string;
  linkUrl?: string; // Alternative camelCase
  // Legacy fields for backward compatibility
  id?: string;
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