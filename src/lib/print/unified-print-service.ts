/**
 * Unified Print Service - Tích hợp cả Android và Desktop printing
 * Tự động detect platform và sử dụng service phù hợp
 */

import { nativePrintService, type BadgeData, type BadgeLayout } from './native-print-service';
import { androidPrintService, type AndroidPrintJob, type AndroidDeviceInfo } from './android-print-service';

export interface UnifiedPrinterInfo {
  name: string;
  address?: string;
  connectionType?: 'usb' | 'bluetooth' | 'wifi' | 'ethernet';
  status: 'ready' | 'busy' | 'offline' | 'error' | 'connected' | 'disconnected';
  isBixolon: boolean;
  platform: 'android' | 'desktop';
  logicalName?: string;
  type?: 'usb' | 'network' | 'bluetooth';
}

export interface UnifiedPrintJob {
  requestId: string;
  printer: string;
  template: string;
  data: {
    fullName: string;
    company?: string;
    qr: string;
    customContent?: string[];
    [key: string]: any;
  };
  options?: {
    dither?: boolean;
    speed?: number;
    density?: number;
    orientation?: 'portrait' | 'landscape';
    labelSize?: 'small' | 'medium' | 'large';
  };
  copies?: number;
}

export interface UnifiedPrintResponse {
  result: 'OK' | 'ERROR' | 'IN_PROGRESS';
  jobId?: string;
  error?: string;
  platform: 'android' | 'desktop';
  printerInfo?: UnifiedPrinterInfo;
}

export interface PlatformInfo {
  isAndroid: boolean;
  isIminSwan2: boolean;
  isDesktop: boolean;
  deviceInfo?: AndroidDeviceInfo;
  supportedPrintMethods: ('native' | 'android')[];
}

export class UnifiedPrintService {
  private platformInfo: PlatformInfo | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.detectPlatform();
      this.isInitialized = true;
      console.log('✅ Unified Print Service initialized:', this.platformInfo);
    } catch (error) {
      console.error('❌ Failed to initialize Unified Print Service:', error);
    }
  }

  /**
   * Detect platform và capabilities
   */
  private detectPlatform(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');
    const isIminSwan2 = userAgent.includes('imin') && userAgent.includes('swan');
    const isDesktop = !isAndroid;

    const supportedPrintMethods: ('native' | 'android')[] = [];
    
    if (isAndroid) {
      supportedPrintMethods.push('android');
    }
    if (isDesktop) {
      supportedPrintMethods.push('native');
    }

    this.platformInfo = {
      isAndroid,
      isIminSwan2,
      isDesktop,
      deviceInfo: isAndroid ? androidPrintService.getDeviceInfo() : undefined,
      supportedPrintMethods
    };
  }

  /**
   * Get platform info
   */
  getPlatformInfo(): PlatformInfo | null {
    return this.platformInfo;
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.platformInfo) {
      return false;
    }

    if (this.platformInfo.isAndroid) {
      return androidPrintService.isAvailable();
    } else {
      return await nativePrintService.isAvailable();
    }
  }

  /**
   * Get all available printers
   */
  async getPrinters(): Promise<UnifiedPrinterInfo[]> {
    if (!this.platformInfo) {
      return [];
    }

    try {
      if (this.platformInfo.isAndroid) {
        const androidPrinters = androidPrintService.getDetectedPrinters();
        return androidPrinters.map(printer => ({
          name: printer.name,
          address: printer.address,
          connectionType: printer.connectionType,
          status: printer.status === 'connected' ? 'ready' as const : 'offline' as const,
          isBixolon: printer.isBixolon,
          platform: 'android' as const
        }));
      } else {
        const desktopPrinters = nativePrintService.getPrinters();
        return desktopPrinters.map(printer => ({
          name: printer.name,
          logicalName: printer.logicalName,
          status: printer.status,
          isBixolon: printer.name.toLowerCase().includes('bixolon') || 
                    printer.name.toLowerCase().includes('slp-tx403'),
          platform: 'desktop' as const,
          type: printer.type
        }));
      }
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  }

  /**
   * Get default printer
   */
  async getDefaultPrinter(): Promise<UnifiedPrinterInfo | null> {
    if (!this.platformInfo) {
      return null;
    }

    try {
      if (this.platformInfo.isAndroid) {
        const androidPrinter = androidPrintService.getDefaultPrinter();
        if (androidPrinter) {
          return {
            name: androidPrinter.name,
            address: androidPrinter.address,
            connectionType: androidPrinter.connectionType,
            status: androidPrinter.status === 'connected' ? 'ready' as const : 'offline' as const,
            isBixolon: androidPrinter.isBixolon,
            platform: 'android' as const
          };
        }
      } else {
        const desktopPrinterName = nativePrintService.getDefaultPrinter();
        if (desktopPrinterName) {
          const printers = await this.getPrinters();
          return printers.find(p => p.name === desktopPrinterName) || null;
        }
      }
    } catch (error) {
      console.error('Error getting default printer:', error);
    }

    return null;
  }

  /**
   * Set default printer
   */
  async setDefaultPrinter(printer: UnifiedPrinterInfo): Promise<boolean> {
    if (!this.platformInfo) {
      return false;
    }

    try {
      if (this.platformInfo.isAndroid && printer.platform === 'android') {
        const androidPrinter = androidPrintService.getDetectedPrinters().find(p => p.address === printer.address);
        if (androidPrinter) {
          androidPrintService.setDefaultPrinter(androidPrinter);
          return true;
        }
      } else if (this.platformInfo.isDesktop && printer.platform === 'desktop') {
        return await nativePrintService.setDefaultPrinter(printer.name);
      }
    } catch (error) {
      console.error('Error setting default printer:', error);
    }

    return false;
  }

  /**
   * Print badge - unified interface
   */
  async printBadge(badgeData: BadgeData, layout: BadgeLayout): Promise<UnifiedPrintResponse> {
    if (!this.platformInfo) {
      return {
        result: 'ERROR',
        error: 'Platform not detected',
        platform: 'desktop'
      };
    }

    try {
      if (this.platformInfo.isAndroid) {
        // Use Android print service
        const defaultPrinter = androidPrintService.getDefaultPrinter();
        if (!defaultPrinter) {
          return {
            result: 'ERROR',
            error: 'No Android printer selected',
            platform: 'android'
          };
        }

        const androidJob: AndroidPrintJob = {
          requestId: `android_${Date.now()}`,
          printerAddress: defaultPrinter.address,
          connectionType: defaultPrinter.connectionType,
          template: 'visitor_v1',
          data: {
            fullName: badgeData.visitorData.name,
            company: this.extractCompany(badgeData.visitorData),
            qr: badgeData.qrData,
            customContent: badgeData.customContent || [],
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

        const result = await androidPrintService.printBadge(androidJob);
        
        return {
          result: result.result,
          jobId: result.jobId,
          error: result.error,
          platform: 'android',
          printerInfo: result.printerInfo ? {
            name: result.printerInfo.name,
            address: result.printerInfo.address,
            connectionType: result.printerInfo.connectionType,
            status: result.printerInfo.status === 'connected' ? 'ready' as const : 'offline' as const,
            isBixolon: result.printerInfo.isBixolon,
            platform: 'android' as const
          } : undefined
        };
      } else {
        // Use desktop print service
        const result = await nativePrintService.printBadge(badgeData, layout);
        
        return {
          result: result ? 'OK' : 'ERROR',
          error: result ? undefined : 'Desktop print failed',
          platform: 'desktop'
        };
      }
    } catch (error) {
      console.error('Error in unified print:', error);
      return {
        result: 'ERROR',
        error: (error as Error).message,
        platform: this.platformInfo.isAndroid ? 'android' : 'desktop'
      };
    }
  }

  /**
   * Check Bixolon printer status
   */
  async checkBixolonPrinter(): Promise<{
    hasBixolon: boolean;
    hasAnyPrinter: boolean;
    printers: UnifiedPrinterInfo[];
    needsSetup: boolean;
    platform: 'android' | 'desktop';
    setupGuide?: any;
  }> {
    if (!this.platformInfo) {
      return {
        hasBixolon: false,
        hasAnyPrinter: false,
        printers: [],
        needsSetup: false,
        platform: 'desktop'
      };
    }

    try {
      const printers = await this.getPrinters();
      const hasBixolon = printers.some(p => p.isBixolon);
      const hasAnyPrinter = printers.length > 0;
      
      let needsSetup = false;
      let setupGuide = null;
      
      if (this.platformInfo.isDesktop) {
        // Use desktop service for setup guide
        const desktopResult = await nativePrintService.checkBixolonPrinter();
        needsSetup = desktopResult.needsDriver;
        setupGuide = desktopResult.setupGuide;
      } else {
        // Android doesn't need driver setup, just connection
        needsSetup = !hasBixolon && hasAnyPrinter;
      }
      
      return {
        hasBixolon,
        hasAnyPrinter,
        printers,
        needsSetup,
        platform: this.platformInfo.isAndroid ? 'android' : 'desktop',
        setupGuide
      };
    } catch (error) {
      console.error('Error checking Bixolon printer:', error);
      return {
        hasBixolon: false,
        hasAnyPrinter: false,
        printers: [],
        needsSetup: false,
        platform: this.platformInfo.isAndroid ? 'android' : 'desktop'
      };
    }
  }

  /**
   * Refresh printer list
   */
  async refreshPrinters(): Promise<void> {
    if (!this.platformInfo) {
      return;
    }

    try {
      if (this.platformInfo.isAndroid) {
        await androidPrintService.refreshPrinters();
      } else {
        await nativePrintService.refreshPrinters();
      }
    } catch (error) {
      console.error('Error refreshing printers:', error);
    }
  }

  /**
   * Get agent info (desktop only)
   */
  async getAgentInfo() {
    if (this.platformInfo?.isDesktop) {
      return await nativePrintService.getAgentInfo();
    }
    return null;
  }

  /**
   * Extract company from visitor data
   */
  private extractCompany(visitorData: any): string {
    const companyFields = ['company', 'organization', 'workplace', 'employer', 'company_name'];
    
    for (const field of companyFields) {
      if (visitorData[field] && visitorData[field].trim()) {
        return visitorData[field].trim();
      }
    }
    
    return '';
  }

  /**
   * Extract additional fields from visitor data
   */
  private extractAdditionalFields(visitorData: any): Record<string, any> {
    const additionalFields: Record<string, any> = {};
    
    const importantFields = ['email', 'phone', 'position', 'department', 'title'];
    
    for (const field of importantFields) {
      if (visitorData[field] && visitorData[field].trim()) {
        additionalFields[field] = visitorData[field].trim();
      }
    }
    
    return additionalFields;
  }

  /**
   * Generate request ID
   */
  generateRequestId(eventId: string, visitorId: string): string {
    const timestamp = Date.now();
    const platform = this.platformInfo?.isAndroid ? 'android' : 'desktop';
    return `${platform}_${eventId}_${visitorId}_${timestamp}`;
  }
}

// Singleton instance
export const unifiedPrintService = new UnifiedPrintService();

// Export types
export type { UnifiedPrinterInfo, UnifiedPrintJob, UnifiedPrintResponse, PlatformInfo };
