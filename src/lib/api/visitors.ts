import { apiClient } from './client';

export interface VisitorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  registration_date: string;
  status: string;
  event_id: string | number;
  event_name: string;
  group_id: string;
  group_redeem_id: string;
  badge_qr: string;
  redeem_qr: string;
  redeem_id: string;
  encrypt_key: string;
  head_mark: boolean;
  check_in_history: any[];
  custom_fields: Record<string, any>;
  formFields: any[];
}

export interface VisitorResponse {
  visitor: VisitorData;
}

export interface CheckinResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const visitorApi = {
  /**
   * Test basic connectivity to backend
   */
  async checkBackendConnection(): Promise<boolean> {
    try {
      console.log('🏥 Testing backend connection...');
      console.log('🌐 Backend URL:', apiClient.defaults.baseURL);
      
      // Try a simple request to check if backend is reachable
      const response = await fetch(`${apiClient.defaults.baseURL}/api/visitors?visid=test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🏥 Backend response status:', response.status);
      console.log('🏥 Backend reachable:', response.ok || response.status >= 400);
      
      return true; // Any response means backend is reachable
    } catch (error: any) {
      console.log('🏥 Backend connection failed:', error.message);
      console.log('🏥 Possible issues:');
      console.log('   - Backend server not running');
      console.log('   - Wrong NEXT_PUBLIC_BACKEND_API_URL');
      console.log('   - CORS configuration');
      console.log('   - Network connectivity');
      return false;
    }
  },

  /**
   * Fetch visitor details by visitor ID
   * @param visitorId - The visitor ID from Zoho Creator
   * @returns Promise<VisitorResponse>
   */
  async getVisitorInfo(visitorId: string): Promise<VisitorResponse> {
    console.log('🔍 Fetching visitor data for ID:', visitorId);
    console.log('🌐 API Base URL:', apiClient.defaults.baseURL);
    console.log('🌐 Full request URL:', `${apiClient.defaults.baseURL}/api/visitors?visid=${visitorId}`);
    
    try {
      const response = await apiClient.get<VisitorResponse>('/api/visitors', {
        params: { visid: visitorId }
      });
      
      console.log('📥 Visitor data response status:', response.status);
      console.log('📥 Visitor data response:', response.data);
      console.log('📥 Response data type:', typeof response.data);
      console.log('📥 Response data visitor:', response.data?.visitor);
      
      // Validate response data structure
      if (!response.data || !response.data.visitor) {
        console.log('⚠️ Invalid response structure - no visitor data');
        throw new Error('Visitor not found');
      }
      
      const visitor = response.data.visitor;
      
      // Validate essential visitor fields
      // Handle backend's way of returning "not found" - empty/undefined fields
      if (!visitor.id || visitor.id === 'undefined' || !visitor.name || visitor.name === '' || !visitor.email || visitor.email === '') {
        console.log('⚠️ Visitor not found - backend returned empty/undefined fields:', {
          id: visitor.id,
          name: visitor.name, 
          email: visitor.email
        });
        throw new Error('Visitor not found');
      }
      
      // Log visitor ID mapping (QR code -> Visitor ID)
      if (visitor.id !== visitorId) {
        console.log('📋 QR Code to Visitor ID mapping - QR:', visitorId, 'Visitor ID:', visitor.id);
      }
      
      return response.data;
    } catch (error: any) {
      console.log('❌ Error fetching visitor data:', error.message || error);
      
      // Safe logging without triggering Next.js console error interceptor
      if (error.response) {
        console.log('❌ Response status:', error.response.status);
        console.log('❌ Response data:', error.response.data);
      } else {
        console.log('❌ Network/Connection error - no response from server');
        console.log('❌ Possible causes: CORS, server down, wrong URL');
      }
      
      // Handle different error types
      if (error.response?.status === 400) {
        throw new Error('Visitor ID is required');
      } else if (error.response?.status === 404) {
        throw new Error('Visitor not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error: ' + (error.response?.data?.details || 'Unknown error'));
      } else if (error.message === 'Visitor not found') {
        // Re-throw our custom validation errors
        throw error;
      } else {
        throw new Error('Failed to fetch visitor data');
      }
    }
  },

  /**
   * Validate visitor ID by checking if visitor exists
   * @param visitorId - The visitor ID to validate
   * @returns Promise<boolean>
   */
  async validateVisitorId(visitorId: string): Promise<boolean> {
    try {
      await this.getVisitorInfo(visitorId);
      return true;
    } catch (error) {
      console.log('⚠️ Visitor validation failed:', error);
      return false;
    }
  },

  /**
   * Submit check-in data to Zoho Creator
   * @param visitor - The visitor data to submit for check-in
   * @returns Promise<CheckinResponse>
   */
  async submitCheckin(visitor: VisitorData): Promise<CheckinResponse> {
    console.log('📝 Submitting check-in data for visitor:', visitor.id, visitor.name);
    
    const payload = { visitor };
    console.log('📋 JSON payload being submitted to Zoho:');
    console.log(JSON.stringify(payload, null, 2));
    
    try {
      const response = await apiClient.post<CheckinResponse>('/api/visitors/checkin', payload);
      
      console.log('✅ Check-in submitted successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error submitting check-in:', error);
      console.error('❌ Error response data:', error.response?.data);
      
      // Handle different error types
      if (error.response?.status === 400) {
        throw new Error('Invalid visitor data');
      } else if (error.response?.status === 500) {
        throw new Error('Server error: ' + (error.response?.data?.details || 'Failed to submit check-in'));
      } else {
        throw new Error('Failed to submit check-in to Zoho');
      }
    }
  }
}; 