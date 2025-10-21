/**
 * Native Print Service - Tích hợp với Nexpo Print SDK
 * Thay thế popup print bằng native printing
 */

import { nexpoPrintSDK, type PrintJob, type PrinterInfo } from './nexpo-print-sdk';

export interface BadgeData {
  visitorData: {
    name: string;
    id: string;
    [key: string]: any;
  };
  eventData: {
    id: string;
    name: string;
    [key: string]: any;
  };
  qrData: string;
  customContent?: string[];
}

export interface BadgeLayout {
  width: number;
  height: number;
  isVerticalLayout: boolean;
}

export class NativePrintService {
  private isNativePrintAvailable: boolean = false;
  private defaultPrinter: string = '';
  private printers: PrinterInfo[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.isNativePrintAvailable = await nexpoPrintSDK.canUseNativePrint();
      if (this.isNativePrintAvailable) {
        await this.loadPrinters();
      }
    } catch (error) {
      console.log('Native print not available:', error);
    }
  }

  /**
   * Kiểm tra xem native print có sẵn sàng không
   */
  async isAvailable(): Promise<boolean> {
    return await nexpoPrintSDK.canUseNativePrint();
  }

  /**
   * Kiểm tra BIXOLON printer và trả về thông tin setup
   */
  async checkBixolonPrinter(): Promise<{
    hasBixolon: boolean;
    hasAnyPrinter: boolean;
    printers: PrinterInfo[];
    needsDriver: boolean;
    setupGuide?: any;
  }> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          hasBixolon: false,
          hasAnyPrinter: false,
          printers: [],
          needsDriver: false
        };
      }

      await this.loadPrinters();
      const printers = this.printers;
      const hasBixolon = printers.some(p => 
        p.name.toLowerCase().includes('bixolon') || 
        p.name.toLowerCase().includes('slp-tx403')
      );
      const hasAnyPrinter = printers.length > 0;
      
      let needsDriver = false;
      let setupGuide = null;
      
      if (!hasBixolon && hasAnyPrinter) {
        // Có printer khác nhưng không có BIXOLON
        needsDriver = true;
        try {
          const response = await fetch('http://localhost:18082/v1/setup-guide');
          const data = await response.json();
          setupGuide = data.guide;
        } catch (error) {
          console.error('Failed to get setup guide:', error);
        }
      }
      
      return {
        hasBixolon,
        hasAnyPrinter,
        printers,
        needsDriver,
        setupGuide
      };
    } catch (error) {
      return {
        hasBixolon: false,
        hasAnyPrinter: false,
        printers: [],
        needsDriver: false
      };
    }
  }

  /**
   * Load danh sách máy in
   */
  private async loadPrinters(): Promise<void> {
    try {
      this.printers = await nexpoPrintSDK.listPrinters();
      // Tìm BIXOLON printer làm mặc định
      const bixolonPrinter = this.printers.find(p => 
        p.name.toLowerCase().includes('bixolon') || 
        p.name.toLowerCase().includes('tx403')
      );
      this.defaultPrinter = bixolonPrinter?.name || this.printers[0]?.name || '';
    } catch (error) {
      console.error('Error loading printers:', error);
    }
  }

  /**
   * Lấy danh sách máy in
   */
  getPrinters(): PrinterInfo[] {
    return this.printers;
  }

  /**
   * Lấy máy in mặc định
   */
  getDefaultPrinter(): string {
    return this.defaultPrinter;
  }

  /**
   * Đặt máy in mặc định
   */
  async setDefaultPrinter(printerName: string): Promise<boolean> {
    try {
      const success = await nexpoPrintSDK.setDefaultPrinter(printerName);
      if (success) {
        this.defaultPrinter = printerName;
      }
      return success;
    } catch (error) {
      console.error('Error setting default printer:', error);
      return false;
    }
  }

  /**
   * In badge với native print
   */
  async printBadge(badgeData: BadgeData, layout: BadgeLayout): Promise<boolean> {
    if (!this.isNativePrintAvailable) {
      throw new Error('Native print not available. Please install Nexpo Print Agent.');
    }

    try {
      const printJob: PrintJob = {
        requestId: nexpoPrintSDK.generateRequestId(badgeData.eventData.id, badgeData.visitorData.id),
        printer: this.defaultPrinter,
        template: 'visitor_v1',
        data: {
          fullName: badgeData.visitorData.name,
          company: this.extractCompany(badgeData.visitorData),
          qr: badgeData.qrData,
          customContent: badgeData.customContent || [],
          // Thêm các field khác từ visitorData
          ...this.extractAdditionalFields(badgeData.visitorData)
        },
        options: {
          dither: true,
          speed: 5,
          density: 10,
          orientation: layout.isVerticalLayout ? 'portrait' : 'landscape'
        },
        copies: 1
      };

      const result = await nexpoPrintSDK.printBadge(printJob);
      
      if (result.result === 'OK') {
        console.log('✅ Native print successful:', result.jobId);
        return true;
      } else {
        console.error('❌ Native print failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error in native print:', error);
      throw error;
    }
  }

  /**
   * Trích xuất thông tin công ty từ visitor data
   */
  private extractCompany(visitorData: any): string {
    // Thử các field có thể chứa thông tin công ty
    const companyFields = ['company', 'organization', 'workplace', 'employer', 'company_name'];
    
    for (const field of companyFields) {
      if (visitorData[field] && visitorData[field].trim()) {
        return visitorData[field].trim();
      }
    }
    
    return '';
  }

  /**
   * Trích xuất các field bổ sung từ visitor data
   */
  private extractAdditionalFields(visitorData: any): Record<string, any> {
    const additionalFields: Record<string, any> = {};
    
    // Thêm các field quan trọng khác
    const importantFields = ['email', 'phone', 'position', 'department', 'title'];
    
    for (const field of importantFields) {
      if (visitorData[field] && visitorData[field].trim()) {
        additionalFields[field] = visitorData[field].trim();
      }
    }
    
    return additionalFields;
  }

  /**
   * Kiểm tra trạng thái máy in
   */
  async checkPrinterStatus(printerName?: string): Promise<PrinterInfo | null> {
    const targetPrinter = printerName || this.defaultPrinter;
    if (!targetPrinter) return null;
    
    try {
      return await nexpoPrintSDK.getPrinterStatus(targetPrinter);
    } catch (error) {
      console.error('Error checking printer status:', error);
      return null;
    }
  }

  /**
   * Refresh danh sách máy in
   */
  async refreshPrinters(): Promise<void> {
    await this.loadPrinters();
  }

  /**
   * Lấy thông tin chi tiết về agent
   */
  async getAgentInfo() {
    return await nexpoPrintSDK.getStatus();
  }
}

// Singleton instance
export const nativePrintService = new NativePrintService();
