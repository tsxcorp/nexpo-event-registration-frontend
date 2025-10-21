/**
 * Nexpo Local Print SDK - Web Client
 * Giao tiếp với Nexpo Print Agent chạy local trên port 18082
 */

export interface PrinterInfo {
  name: string;
  status: 'ready' | 'busy' | 'offline' | 'error';
  logicalName?: string;
  type?: 'usb' | 'network' | 'bluetooth';
}

export interface PrintJob {
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
  };
  copies?: number;
}

export interface PrintResponse {
  result: 'OK' | 'ERROR' | 'IN_PROGRESS';
  jobId?: string;
  queuedAt?: number;
  error?: string;
}

export interface AgentStatus {
  connected: boolean;
  version?: string;
  printers: PrinterInfo[];
  defaultPrinter?: string;
}

export class NexpoPrintSDK {
  private baseURL: string;
  private timeout: number;
  private isAgentDetected: boolean = false;

  constructor(config: { baseURL?: string; timeout?: number } = {}) {
    this.baseURL = config.baseURL || 'http://127.0.0.1:18082';
    this.timeout = config.timeout || 3000;
  }

  /**
   * Kiểm tra xem Nexpo Print Agent có đang chạy không
   */
  async detectAgent(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/v1/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      this.isAgentDetected = response.ok;
      return response.ok;
    } catch (error) {
      console.log('🔍 Nexpo Print Agent not detected:', error);
      this.isAgentDetected = false;
      return false;
    }
  }

  /**
   * Lấy danh sách máy in có sẵn
   */
  async listPrinters(): Promise<PrinterInfo[]> {
    if (!this.isAgentDetected) {
      await this.detectAgent();
    }

    if (!this.isAgentDetected) {
      throw new Error('Nexpo Print Agent not running. Please install and start the agent first.');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/printers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list printers: ${response.statusText}`);
      }

      const data = await response.json();
      return data.printers || [];
    } catch (error) {
      console.error('❌ Error listing printers:', error);
      throw error;
    }
  }

  /**
   * In badge với template và data
   */
  async printBadge(job: PrintJob): Promise<PrintResponse> {
    if (!this.isAgentDetected) {
      await this.detectAgent();
    }

    if (!this.isAgentDetected) {
      throw new Error('Nexpo Print Agent not running. Please install and start the agent first.');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...job,
          options: {
            dither: true,
            speed: 5,
            density: 10,
            orientation: 'portrait',
            ...job.options,
          },
          copies: job.copies || 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Print failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error printing badge:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái máy in
   */
  async getPrinterStatus(printerName: string): Promise<PrinterInfo | null> {
    const printers = await this.listPrinters();
    return printers.find(p => p.name === printerName || p.logicalName === printerName) || null;
  }

  /**
   * Lấy trạng thái tổng thể của agent
   */
  async getStatus(): Promise<AgentStatus> {
    if (!this.isAgentDetected) {
      await this.detectAgent();
    }

    if (!this.isAgentDetected) {
      return {
        connected: false,
        printers: [],
      };
    }

    try {
      const [healthResponse, printersResponse] = await Promise.all([
        fetch(`${this.baseURL}/v1/health`),
        fetch(`${this.baseURL}/v1/printers`),
      ]);

      const healthData = healthResponse.ok ? await healthResponse.json() : {};
      const printersData = printersResponse.ok ? await printersResponse.json() : { printers: [] };

      return {
        connected: true,
        version: healthData.version,
        printers: printersData.printers || [],
        defaultPrinter: healthData.defaultPrinter,
      };
    } catch (error) {
      console.error('❌ Error getting agent status:', error);
      return {
        connected: false,
        printers: [],
      };
    }
  }

  /**
   * Đặt máy in mặc định
   */
  async setDefaultPrinter(printerName: string): Promise<boolean> {
    if (!this.isAgentDetected) {
      await this.detectAgent();
    }

    if (!this.isAgentDetected) {
      throw new Error('Nexpo Print Agent not running');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/printers/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printer: printerName }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error setting default printer:', error);
      return false;
    }
  }

  /**
   * Tạo request ID duy nhất cho idempotency
   */
  generateRequestId(eventId: string, visitorId: string): string {
    const timestamp = Date.now();
    return `evt_${eventId}_visitor_${visitorId}_${timestamp}`;
  }

  /**
   * Kiểm tra xem có thể sử dụng native print không
   */
  async canUseNativePrint(): Promise<boolean> {
    return await this.detectAgent();
  }
}

// Singleton instance
export const nexpoPrintSDK = new NexpoPrintSDK();

// Export types
export type { PrinterInfo, PrintJob, PrintResponse, AgentStatus };
