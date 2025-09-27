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
  // Translation object for pre-defined translations
  translation?: {
    en_sectionname?: string;
    en_label?: string;
    en_value?: string;
    en_placeholder?: string;
    en_helptext?: string;
    en_agreementcontent?: string;
    en_agreementtitle?: string;
    en_checkboxlabel?: string;
    en_linktext?: string;
    zh_sectionname?: string;
    zh_label?: string;
    zh_value?: string;
    zh_placeholder?: string;
    zh_helptext?: string;
    zh_agreementcontent?: string;
    zh_agreementtitle?: string;
    zh_checkboxlabel?: string;
    zh_linktext?: string;
    ja_sectionname?: string;
    ja_label?: string;
    ja_value?: string;
    ja_placeholder?: string;
    ja_helptext?: string;
    ja_agreementcontent?: string;
    ja_agreementtitle?: string;
    ja_checkboxlabel?: string;
    ja_linktext?: string;
    ko_sectionname?: string;
    ko_label?: string;
    ko_value?: string;
    ko_placeholder?: string;
    ko_helptext?: string;
    ko_agreementcontent?: string;
    ko_agreementtitle?: string;
    ko_checkboxlabel?: string;
    ko_linktext?: string;
  };
  // Legacy fields for backward compatibility
  id?: string;
}

export interface SessionTimeInfo {
  hour: number;
  millis: number;
  minute: number;
  second: number;
  SQLTime: string;
}

export interface SessionData {
  id: string;
  title: string;
  date: string;
  start_time: SessionTimeInfo;
  end_time: SessionTimeInfo;
  description: string;
  speaker_name: string;
  speaker_id: string;
  area_name: string;
  area_id: string;
  session_accessibility: string;
}

export interface ExhibitorData {
  display_name: string;
  en_company_name?: string;
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
  sessions?: SessionData[];
  registration_form: any[];
  status: string;
  created_date: string;
  badge_size: string;
  badge_printing: boolean;
  one_time_check_in?: boolean;
  ticket_mode?: boolean;
  floor_plan_pdf?: string;
  directory_url?: string;
}

export const eventApi = {
  // Test new API endpoint
  getEventInfoRest: async (eventId: string): Promise<{ event: EventData }> => {
    try {
      const timestamp = Date.now(); // Cache busting
      const requestUrl = `/api/events-rest/?eventId=${eventId}&_t=${timestamp}`;
      
      const response = await apiClient.get(requestUrl);
      
      
      // Check if response has event object first
      let event = response.data.event;
      
      // If no event object, try to construct from response.data
      if (!event && response.data) {
        event = {
          id: response.data.id || eventId,
          name: response.data.name || '',
          description: response.data.description || '',
          start_date: response.data.start_date || '',
          end_date: response.data.end_date || '',
          banner: response.data.banner || '',
          logo: response.data.logo || '',
          header: response.data.header || '',
          footer: response.data.footer || '',
          favicon: response.data.favicon || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          website: response.data.website || '',
          formFields: response.data.formFields || [],
          matching_enabled: response.data.matching_enabled || false,
          matching_fields: response.data.matching_fields || [],
          badge_template: response.data.badge_template || '',
          badge_size: response.data.badge_size || '',
          badge_printing: response.data.badge_printing || false,
          ticket_mode: response.data.ticket_mode || false,
          floor_plan_pdf: response.data.floor_plan_pdf || '',
          directory_url: response.data.directory_url || ''
        };
      }
      
      if (!event) {
        throw new Error('Event not found in /api/events-rest response');
      }
      
      
      return { event };
    } catch (error: any) {
      throw error;
    }
  },

  getEventInfo: async (eventId: string): Promise<{ event: EventData }> => {
    // The backend uses a query parameter for this specific route
    const timestamp = Date.now(); // Cache busting
    const response = await apiClient.get(`/api/events/?eventId=${eventId}&_t=${timestamp}`);
    
    
    // Check if response has event object first
    let event = response.data.event;
    
    // If no event object, try to construct from response.data
    if (!event && response.data) {
      event = {
        id: response.data.id || eventId,
        name: response.data.name || '',
        description: response.data.description || '',
        start_date: response.data.start_date || '',
        end_date: response.data.end_date || '',
        banner: response.data.banner || '',
        logo: response.data.logo || '',
        header: response.data.header || '',
        footer: response.data.footer || '',
        favicon: response.data.favicon || '',
        email: response.data.email || '',
        location: response.data.location || '',
        formFields: response.data.formFields || [],
        exhibitors: response.data.exhibitors || [],
        sessions: response.data.sessions || [],
        registration_form: response.data.registration_form || [],
        status: response.data.status || '',
        created_date: response.data.created_date || '',
        badge_size: response.data.badge_size || '',
        badge_printing: response.data.badge_printing || false,
        ticket_mode: response.data.ticket_mode || false,
        floor_plan_pdf: response.data.floor_plan_pdf || '',
        directory_url: response.data.directory_url || ''
      };
    }
    
    // Ensure we have a valid event object
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }
    

    
    // Robust mapping for formFields (camelCase or snake_case)
    if (!event.formFields && event.form_fields) {
      event.formFields = event.form_fields;
    }
    if (!Array.isArray(event.formFields)) {
      event.formFields = [];
    }
    
    // Map badge_printing field (check multiple possible names)
    if (event.badge_printing === undefined) {
      // Try different possible field names
      if (event.badgePrinting !== undefined) {
        event.badge_printing = event.badgePrinting;
      } else if (event.badge_print !== undefined) {
        event.badge_printing = event.badge_print;
      } else if (event.badgeprint !== undefined) {
        event.badge_printing = event.badgeprint;
      } else if (event.print_badge !== undefined) {
        event.badge_printing = event.print_badge;
      } else if (event.printBadge !== undefined) {
        event.badge_printing = event.printBadge;
      }
    }
    
    // Ensure badge_printing is boolean
    if (event.badge_printing !== undefined) {
      // Convert string "true"/"false" to boolean
      if (typeof event.badge_printing === 'string') {
        event.badge_printing = event.badge_printing.toLowerCase() === 'true';
      }
      // Convert number 1/0 to boolean
      else if (typeof event.badge_printing === 'number') {
        event.badge_printing = event.badge_printing === 1;
      }
    }
    

    
    return { event };
  },

  getAllEvents: async (): Promise<{ events: EventData[] }> => {
    // Get all events using NEXPO parameter with detailed=true for accurate data
    const timestamp = Date.now(); // Cache busting
    const response = await apiClient.get(`/api/events/?eventId=NEXPO&detailed=true&_t=${timestamp}`);
    

    
    let events = response.data.events || response.data || [];
    
    // Ensure events is an array
    if (!Array.isArray(events)) {
      events = [];
    }
    

    
    // Process each event to ensure formFields consistency and field mapping
    events = events.map((event: any) => {
      // Map formFields (camelCase vs snake_case)
      if (!event.formFields && event.form_fields) {
        event.formFields = event.form_fields;
      }
      if (!Array.isArray(event.formFields)) {
        event.formFields = [];
      }
      
      // Map badge_printing field (check multiple possible names)
      if (event.badge_printing === undefined) {
        // Try different possible field names
        if (event.badgePrinting !== undefined) {
          event.badge_printing = event.badgePrinting;
        } else if (event.badge_print !== undefined) {
          event.badge_printing = event.badge_print;
        } else if (event.badgeprint !== undefined) {
          event.badge_printing = event.badgeprint;
        } else if (event.print_badge !== undefined) {
          event.badge_printing = event.print_badge;
        } else if (event.printBadge !== undefined) {
          event.badge_printing = event.printBadge;
        }
      }
      
      // Ensure badge_printing is boolean
      if (event.badge_printing !== undefined) {
        // Convert string "true"/"false" to boolean
        if (typeof event.badge_printing === 'string') {
          event.badge_printing = event.badge_printing.toLowerCase() === 'true';
        }
        // Convert number 1/0 to boolean
        else if (typeof event.badge_printing === 'number') {
          event.badge_printing = event.badge_printing === 1;
        }
      }
      
      return event;
    });
    

    
    return { events };
  },

  getAllEventsBasic: async (): Promise<{ events: EventData[] }> => {
    // Get all events without detailed=true for faster loading
    const response = await apiClient.get(`/api/events/?eventId=NEXPO`);
    

    
    let events = response.data.events || response.data || [];
    
    // Ensure events is an array
    if (!Array.isArray(events)) {
      events = [];
    }
    

    
    // Minimal processing for basic event list
    events = events.map((event: any) => {
      // Only essential fields for multi-event selection
      return {
        id: event.id,
        name: event.name,
        badge_printing: event.badge_printing || false,
        badge_size: event.badge_size || '',
        badge_custom_content: event.badge_custom_content || ''
      };
    });
    

    
    return { events };
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