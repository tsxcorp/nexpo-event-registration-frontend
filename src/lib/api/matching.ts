import { apiClient } from './client';

export interface MatchingRequest {
  event_id: string;
  registration_id: string;
  exhibitor_company: string; // This should contain exhibitor_profile_id
  date: string;
  time: string;
  message: string;
}

export interface MatchingResponse {
  success: boolean;
  message: string;
  data?: any;
  matching_id?: string;
  submitted_data?: {
    event_id: string;
    registration_id: string;
    exhibitor_company: string;
    meeting_date: string;
    meeting_time: string;
    message: string;
  };
}

export const matchingApi = {
  // Submit a matching request
  submitRequest: async (matchingData: MatchingRequest): Promise<MatchingResponse> => {
    try {
      const response = await apiClient.post<MatchingResponse>('/api/business-matching/submit', matchingData);
      return response.data;
    } catch (error: any) {
      // More specific error message based on status
      if (error.response?.status === 500) {
        const backendError = error.response?.data?.message || error.response?.data?.error || 'Internal server error';
        throw new Error(`Backend error: ${backendError}`);
      } else if (error.response?.status === 404) {
        throw new Error('API endpoint not found - check if backend is running');
      } else if (error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors || [error.response?.data?.message];
        throw new Error(`Validation error: ${validationErrors.join(', ')}`);
      } else if (!error.response) {
        throw new Error('Network error - check if backend is running');
      }
      
      throw new Error(`Failed to submit matching request: ${error.message}`);
    }
  },



  // Validate matching data locally before sending
  validateLocally: (matchingData: MatchingRequest): { isValid: boolean, errors: string[] } => {
    const errors: string[] = [];
    
    if (!matchingData.event_id || matchingData.event_id.trim() === '') {
      errors.push('Event ID is required');
    }
    
    if (!matchingData.registration_id || matchingData.registration_id.trim() === '') {
      errors.push('Registration ID is required');
    }
    
    if (!matchingData.exhibitor_company || matchingData.exhibitor_company.trim() === '') {
      errors.push('Exhibitor company is required');
    }
    
    if (!matchingData.date || matchingData.date.trim() === '') {
      errors.push('Date is required');
    } else {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(matchingData.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      }
    }
    
    if (!matchingData.time || matchingData.time.trim() === '') {
      errors.push('Time is required');
    } else {
      // Validate time format HH:MM
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(matchingData.time)) {
        errors.push('Time must be in HH:MM format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}; 