import { apiClient } from './client';

export interface MatchingTimeInfo {
  hour: number;
  millis: number;
  minute: number;
  second: number;
  SQLTime: string;
}

export interface MatchingEntry {
  date: string;
  exhibitor_profile_id: number;
  time: MatchingTimeInfo;
  message: string;
  confirmed: boolean;
}

export interface CheckinHistoryEntry {
  checkintime: string;
  event_id?: string;
  visitor_id?: string;
  created_at?: string;
  [key: string]: any;
}

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
  check_in_history: CheckinHistoryEntry[];
  matching_list?: MatchingEntry[];
  custom_fields: Record<string, any>;
  formFields: any[];
}

export interface VisitorResponse {
  visitor: VisitorData;
}

export interface GroupVisitorsResponse {
  visitors: Array<{ visitor: VisitorData }>;
  count: number;
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
   * Fetch visitor details by visitor ID or group ID
   * @param visitorId - The visitor ID or group ID from Zoho Creator
   * @returns Promise<VisitorResponse | GroupVisitorsResponse>
   */
  async getVisitorInfo(visitorId: string): Promise<VisitorResponse | GroupVisitorsResponse> {
    console.log('🔍 Fetching visitor/group data for ID:', visitorId);
    console.log('🌐 API Base URL:', apiClient.defaults.baseURL);
    console.log('🌐 Full request URL:', `${apiClient.defaults.baseURL}/api/visitors?visid=${visitorId}`);
    
    // Check if this is a group ID (contains "GRP")
    const isGroupId = visitorId.includes('GRP');
    console.log('🏷️ ID Type:', isGroupId ? 'Group ID' : 'Single Visitor ID');
    
    try {
      const response = await apiClient.get<VisitorResponse | GroupVisitorsResponse>('/api/visitors', {
        params: { visid: visitorId }
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', response.data);
      console.log('📥 Response data type:', typeof response.data);
      
      if (isGroupId) {
        // Handle group response
        const groupResponse = response.data as GroupVisitorsResponse;
        console.log('📥 Group response visitors:', groupResponse.visitors);
        console.log('📥 Group count:', groupResponse.count);
        
        // Validate group response structure
        if (!groupResponse || !groupResponse.visitors || !Array.isArray(groupResponse.visitors)) {
          console.log('⚠️ Invalid group response structure');
          throw new Error('Group not found');
        }
        
        // Validate each visitor in group
        for (const visitorEntry of groupResponse.visitors) {
          const visitor = visitorEntry.visitor;
          if (!visitor.id || visitor.id === 'undefined' || !visitor.name || visitor.name === '' || !visitor.email || visitor.email === '') {
            console.log('⚠️ Invalid visitor in group:', visitor);
            throw new Error('Invalid visitor data in group');
          }
        }
        
        return groupResponse;
      } else {
        // Handle single visitor response
        const visitorResponse = response.data as VisitorResponse;
        console.log('📥 Single visitor response:', visitorResponse.visitor);
        
        // Validate response data structure
        if (!visitorResponse || !visitorResponse.visitor) {
          console.log('⚠️ Invalid response structure - no visitor data');
          throw new Error('Visitor not found');
        }
        
        const visitor = visitorResponse.visitor;
        
        // Validate essential visitor fields
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
        
        return visitorResponse;
      }
    } catch (error: any) {
      console.log('❌ Error fetching visitor/group data:', error.message || error);
      
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
        throw new Error('Visitor/Group ID is required');
      } else if (error.response?.status === 404) {
        throw new Error(isGroupId ? 'Group not found' : 'Visitor not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error: ' + (error.response?.data?.details || 'Unknown error'));
      } else if (error.message === 'Visitor not found' || error.message === 'Group not found') {
        // Re-throw our custom validation errors
        throw error;
      } else {
        throw new Error('Failed to fetch visitor/group data');
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
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await apiClient.post<CheckinResponse>('/api/visitors/checkin', payload, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Check-in submitted successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error submitting check-in:', error);
      
      // Handle timeout
      if (error.name === 'AbortError') {
        console.error('❌ Check-in submission timed out after 10 seconds');
        throw new Error('Check-in submission timed out');
      }
      
      // Handle different error types
      if (error.response?.status === 400) {
        throw new Error('Invalid visitor data');
      } else if (error.response?.status === 404) {
        throw new Error('Check-in API not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error: ' + (error.response?.data?.details || 'Failed to submit check-in'));
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Check-in API not available');
      } else {
        throw new Error('Failed to submit check-in to Zoho');
      }
    }
  }
}; 