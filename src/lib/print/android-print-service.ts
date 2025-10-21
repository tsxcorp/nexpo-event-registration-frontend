/**
 * Android Print Service - Tích hợp với Bixolon SDK trên Android
 * Hỗ trợ auto-detect và kết nối với máy in Bixolon trên thiết bị Android
 */

export interface AndroidPrinterInfo {
  name: string;
  address: string;
  connectionType: 'usb' | 'bluetooth' | 'wifi' | 'ethernet';
  status: 'connected' | 'disconnected' | 'error';
  model?: string;
  isBixolon: boolean;
}

export interface AndroidPrintJob {
  requestId: string;
  printerAddress: string;
  connectionType: 'usb' | 'bluetooth' | 'wifi' | 'ethernet';
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

export interface AndroidPrintResponse {
  result: 'OK' | 'ERROR' | 'IN_PROGRESS';
  jobId?: string;
  error?: string;
  printerInfo?: AndroidPrinterInfo;
}

export interface AndroidDeviceInfo {
  isAndroid: boolean;
  isIminSwan2: boolean;
  chromeVersion?: string;
  androidVersion?: string;
  deviceModel?: string;
  hasBixolonSDK: boolean;
  supportedConnections: ('usb' | 'bluetooth' | 'wifi')[];
}

export class AndroidPrintService {
  private isAndroid: boolean = false;
  private isIminSwan2: boolean = false;
  private deviceInfo: AndroidDeviceInfo | null = null;
  private detectedPrinters: AndroidPrinterInfo[] = [];
  private defaultPrinter: AndroidPrinterInfo | null = null;
  private bixolonSDK: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.detectAndroidDevice();
    if (this.isAndroid) {
      await this.loadBixolonSDK();
      await this.autoDetectPrinters();
    }
  }

  /**
   * Detect thiết bị Android và Imin Swan 2
   */
  private detectAndroidDevice(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    this.isAndroid = userAgent.includes('android');
    
    // Detect Imin Swan 2 specifically
    this.isIminSwan2 = userAgent.includes('imin') && userAgent.includes('swan');
    
    this.deviceInfo = {
      isAndroid: this.isAndroid,
      isIminSwan2: this.isIminSwan2,
      chromeVersion: this.extractChromeVersion(userAgent),
      androidVersion: this.extractAndroidVersion(userAgent),
      deviceModel: this.extractDeviceModel(userAgent),
      hasBixolonSDK: false, // Will be updated when SDK loads
      supportedConnections: this.getSupportedConnections()
    };
  }

  /**
   * Load Bixolon SDK cho Android
   */
  private async loadBixolonSDK(): Promise<void> {
    try {
      // Check if Bixolon SDK is available
      if (typeof window !== 'undefined' && (window as any).BixolonSDK) {
        this.bixolonSDK = (window as any).BixolonSDK;
        this.deviceInfo!.hasBixolonSDK = true;
        console.log('✅ Bixolon SDK loaded successfully');
      } else {
        // Try to load SDK dynamically
        await this.loadSDKDynamically();
      }
    } catch (error) {
      console.error('❌ Failed to load Bixolon SDK:', error);
      this.deviceInfo!.hasBixolonSDK = false;
    }
  }

  /**
   * Load Bixolon SDK dynamically
   */
  private async loadSDKDynamically(): Promise<void> {
    try {
      // Create script tag to load Bixolon SDK
      const script = document.createElement('script');
      script.src = '/bixolon-sdk/bixolon-android-sdk.js';
      script.async = true;
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          if ((window as any).BixolonSDK) {
            this.bixolonSDK = (window as any).BixolonSDK;
            this.deviceInfo!.hasBixolonSDK = true;
            console.log('✅ Bixolon SDK loaded dynamically');
            resolve();
          } else {
            reject(new Error('Bixolon SDK not found after loading'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Bixolon SDK script'));
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('❌ Failed to load Bixolon SDK dynamically:', error);
      throw error;
    }
  }

  /**
   * Auto-detect printers trên Android
   */
  private async autoDetectPrinters(): Promise<void> {
    if (!this.isAndroid || !this.bixolonSDK) {
      return;
    }

    try {
      console.log('🔍 Auto-detecting printers on Android...');
      
      // Detect USB printers
      const usbPrinters = await this.detectUSBPrinters();
      
      // Detect Bluetooth printers
      const bluetoothPrinters = await this.detectBluetoothPrinters();
      
      // Detect WiFi printers
      const wifiPrinters = await this.detectWiFiPrinters();
      
      this.detectedPrinters = [
        ...usbPrinters,
        ...bluetoothPrinters,
        ...wifiPrinters
      ];
      
      // Auto-select Bixolon printer as default
      const bixolonPrinter = this.detectedPrinters.find(p => p.isBixolon);
      if (bixolonPrinter) {
        this.defaultPrinter = bixolonPrinter;
        console.log('✅ Auto-selected Bixolon printer:', bixolonPrinter.name);
      } else if (this.detectedPrinters.length > 0) {
        this.defaultPrinter = this.detectedPrinters[0];
        console.log('⚠️ No Bixolon printer found, using first available:', this.defaultPrinter.name);
      }
      
      console.log(`📋 Detected ${this.detectedPrinters.length} printers:`, this.detectedPrinters);
    } catch (error) {
      console.error('❌ Error auto-detecting printers:', error);
    }
  }

  /**
   * Detect USB printers
   */
  private async detectUSBPrinters(): Promise<AndroidPrinterInfo[]> {
    try {
      if (!this.bixolonSDK || !this.bixolonSDK.getUSBPrinters) {
        return [];
      }
      
      const usbPrinters = await this.bixolonSDK.getUSBPrinters();
      return usbPrinters.map((printer: any) => ({
        name: printer.name || `USB Printer ${printer.address}`,
        address: printer.address,
        connectionType: 'usb' as const,
        status: printer.connected ? 'connected' as const : 'disconnected' as const,
        model: printer.model,
        isBixolon: this.isBixolonPrinter(printer.name || printer.model)
      }));
    } catch (error) {
      console.error('Error detecting USB printers:', error);
      return [];
    }
  }

  /**
   * Detect Bluetooth printers
   */
  private async detectBluetoothPrinters(): Promise<AndroidPrinterInfo[]> {
    try {
      if (!this.bixolonSDK || !this.bixolonSDK.getBluetoothPrinters) {
        return [];
      }
      
      const bluetoothPrinters = await this.bixolonSDK.getBluetoothPrinters();
      return bluetoothPrinters.map((printer: any) => ({
        name: printer.name || `Bluetooth Printer ${printer.address}`,
        address: printer.address,
        connectionType: 'bluetooth' as const,
        status: printer.connected ? 'connected' as const : 'disconnected' as const,
        model: printer.model,
        isBixolon: this.isBixolonPrinter(printer.name || printer.model)
      }));
    } catch (error) {
      console.error('Error detecting Bluetooth printers:', error);
      return [];
    }
  }

  /**
   * Detect WiFi printers
   */
  private async detectWiFiPrinters(): Promise<AndroidPrinterInfo[]> {
    try {
      if (!this.bixolonSDK || !this.bixolonSDK.getWiFiPrinters) {
        return [];
      }
      
      const wifiPrinters = await this.bixolonSDK.getWiFiPrinters();
      return wifiPrinters.map((printer: any) => ({
        name: printer.name || `WiFi Printer ${printer.address}`,
        address: printer.address,
        connectionType: 'wifi' as const,
        status: printer.connected ? 'connected' as const : 'disconnected' as const,
        model: printer.model,
        isBixolon: this.isBixolonPrinter(printer.name || printer.model)
      }));
    } catch (error) {
      console.error('Error detecting WiFi printers:', error);
      return [];
    }
  }

  /**
   * Check if printer is Bixolon
   */
  private isBixolonPrinter(name: string): boolean {
    if (!name) return false;
    const lowerName = name.toLowerCase();
    return lowerName.includes('bixolon') || 
           lowerName.includes('slp-tx403') || 
           lowerName.includes('slp-tx400') ||
           lowerName.includes('slp-tx300');
  }

  /**
   * Get device info
   */
  getDeviceInfo(): AndroidDeviceInfo | null {
    return this.deviceInfo;
  }

  /**
   * Get detected printers
   */
  getDetectedPrinters(): AndroidPrinterInfo[] {
    return this.detectedPrinters;
  }

  /**
   * Get default printer
   */
  getDefaultPrinter(): AndroidPrinterInfo | null {
    return this.defaultPrinter;
  }

  /**
   * Set default printer
   */
  setDefaultPrinter(printer: AndroidPrinterInfo): void {
    this.defaultPrinter = printer;
  }

  /**
   * Print badge on Android
   */
  async printBadge(job: AndroidPrintJob): Promise<AndroidPrintResponse> {
    if (!this.isAndroid) {
      throw new Error('Android print service only works on Android devices');
    }

    if (!this.bixolonSDK) {
      throw new Error('Bixolon SDK not available. Please install Bixolon Android SDK.');
    }

    if (!this.defaultPrinter) {
      throw new Error('No printer selected. Please connect a printer first.');
    }

    try {
      console.log('🖨️ Printing badge on Android:', job);
      
      // Connect to printer if not connected
      await this.connectToPrinter(this.defaultPrinter);
      
      // Prepare print data
      const printData = this.preparePrintData(job);
      
      // Send print command
      const result = await this.bixolonSDK.print(printData);
      
      if (result.success) {
        console.log('✅ Print successful:', result.jobId);
        return {
          result: 'OK',
          jobId: result.jobId,
          printerInfo: this.defaultPrinter
        };
      } else {
        console.error('❌ Print failed:', result.error);
        return {
          result: 'ERROR',
          error: result.error
        };
      }
    } catch (error) {
      console.error('❌ Error printing badge:', error);
      return {
        result: 'ERROR',
        error: (error as Error).message
      };
    }
  }

  /**
   * Connect to printer
   */
  private async connectToPrinter(printer: AndroidPrinterInfo): Promise<void> {
    try {
      switch (printer.connectionType) {
        case 'usb':
          await this.bixolonSDK.connectUSB(printer.address);
          break;
        case 'bluetooth':
          await this.bixolonSDK.connectBluetooth(printer.address);
          break;
        case 'wifi':
          await this.bixolonSDK.connectWiFi(printer.address);
          break;
        default:
          throw new Error(`Unsupported connection type: ${printer.connectionType}`);
      }
      
      console.log(`✅ Connected to ${printer.name} via ${printer.connectionType}`);
    } catch (error) {
      console.error(`❌ Failed to connect to ${printer.name}:`, error);
      throw error;
    }
  }

  /**
   * Prepare print data for Bixolon SDK
   */
  private preparePrintData(job: AndroidPrintJob): any {
    return {
      template: job.template,
      data: {
        fullName: job.data.fullName,
        company: job.data.company || '',
        qr: job.data.qr,
        customContent: job.data.customContent || []
      },
      options: {
        dither: job.options?.dither ?? true,
        speed: job.options?.speed ?? 5,
        density: job.options?.density ?? 10,
        orientation: job.options?.orientation ?? 'portrait',
        labelSize: job.options?.labelSize ?? 'medium'
      },
      copies: job.copies || 1
    };
  }

  /**
   * Refresh printer list
   */
  async refreshPrinters(): Promise<void> {
    await this.autoDetectPrinters();
  }

  /**
   * Check if Android print is available
   */
  isAvailable(): boolean {
    return this.isAndroid && this.deviceInfo?.hasBixolonSDK === true;
  }

  /**
   * Get supported connections for current device
   */
  private getSupportedConnections(): ('usb' | 'bluetooth' | 'wifi')[] {
    const connections: ('usb' | 'bluetooth' | 'wifi')[] = ['usb']; // USB is always supported
    
    if (this.isIminSwan2) {
      connections.push('bluetooth', 'wifi'); // Imin Swan 2 supports all connections
    }
    
    return connections;
  }

  /**
   * Extract Chrome version from user agent
   */
  private extractChromeVersion(userAgent: string): string | undefined {
    const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract Android version from user agent
   */
  private extractAndroidVersion(userAgent: string): string | undefined {
    const match = userAgent.match(/Android (\d+\.\d+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract device model from user agent
   */
  private extractDeviceModel(userAgent: string): string | undefined {
    const match = userAgent.match(/; ([^;]+) Build/);
    return match ? match[1] : undefined;
  }
}

// Singleton instance
export const androidPrintService = new AndroidPrintService();

// Export types
export type { AndroidPrinterInfo, AndroidPrintJob, AndroidPrintResponse, AndroidDeviceInfo };
