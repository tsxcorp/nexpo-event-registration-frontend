import { apiClient } from './client';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  field_id?: string; // New field ID for robust conditional logic
  sort: number;
  label: string;
  type: string;
  required: boolean;
  groupmember: boolean;
  helptext: string;
  placeholder: string;
  field_condition: string;
  section_id?: string; // New section ID
  section_name: string;
  section_sort: number;
  section_condition: string;
  matching_field: boolean;
  values?: string[] | FieldOption[];
  options?: string[] | FieldOption[];
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

export interface ExhibitorData {
  display_name: string;
  country: string;
  email: string;
  tel: string;
  mobile: string;
  fax: string;
  website: string;
  zip_code: string;
  vie_address: string;
  eng_address: string;
  vie_company_description: string;
  eng_company_description: string;
  vie_display_products: string;
  eng_display_products: string;
  introduction_video: string;
  company_logo: string;
  cover_image: string;
}

export interface EventData {
  id: string;
  name: string;
  description: string;
  email?: string;
  location?: string;
  start_date: string;
  end_date: string;
  banner?: string;
  header?: string;
  logo?: string;
  favicon?: string;
  footer?: string;
  formFields: FormField[];
  exhibitors?: ExhibitorData[];
}

export const eventApi = {
  getEventInfo: async (eventId: string): Promise<{ event: EventData }> => {
    // The backend uses a query parameter for this specific route
    const response = await apiClient.get(`/api/events/?eventId=${eventId}`);
    let event = response.data.event || response.data;
    // Robust mapping for formFields (camelCase or snake_case)
    if (!event.formFields && event.form_fields) {
      event.formFields = event.form_fields;
    }
    if (!Array.isArray(event.formFields)) {
      event.formFields = [];
    }
    return { event };
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