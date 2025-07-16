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

export const visitorApi = {
  /**
   * Fetch visitor details by visitor ID
   * @param visitorId - The visitor ID from Zoho Creator
   * @returns Promise<VisitorResponse>
   */
  async getVisitorInfo(visitorId: string): Promise<VisitorResponse> {
    console.log('🔍 Fetching visitor data for ID:', visitorId);
    
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
      if (!visitor.id || !visitor.name || !visitor.email) {
        console.log('⚠️ Invalid visitor data - missing essential fields:', visitor);
        throw new Error('Visitor not found');
      }
      
      // Log visitor ID mapping (QR code -> Visitor ID)
      if (visitor.id !== visitorId) {
        console.log('📋 QR Code to Visitor ID mapping - QR:', visitorId, 'Visitor ID:', visitor.id);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching visitor data:', error);
      
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
  }
}; 