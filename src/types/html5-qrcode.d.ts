declare module 'html5-qrcode' {
  export interface Html5QrcodeConfig {
    fps?: number;
    qrbox?: { width: number; height: number } | number;
    aspectRatio?: number;
    disableFlip?: boolean;
    rememberLastUsedCamera?: boolean;
  }

  export interface CameraDevice {
    id: string;
    label: string;
  }

  export interface QrcodeSuccessCallback {
    (decodedText: string, decodedResult: any): void;
  }

  export interface QrcodeErrorCallback {
    (errorMessage: string): void;
  }

  export interface Html5QrcodeCameraScanConfig {
    facingMode?: "user" | "environment";
    deviceId?: string;
  }

  export class Html5Qrcode {
    constructor(elementId: string);
    
    start(
      cameraIdOrConfig: string | Html5QrcodeCameraScanConfig,
      configuration: Html5QrcodeConfig,
      qrCodeSuccessCallback: QrcodeSuccessCallback,
      qrCodeErrorCallback?: QrcodeErrorCallback
    ): Promise<void>;
    
    stop(): Promise<void>;
    clear(): Promise<void>;
    
    static getCameras(): Promise<CameraDevice[]>;
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: Html5QrcodeConfig,
      verbose?: boolean
    );
    
    render(
      qrCodeSuccessCallback: QrcodeSuccessCallback,
      qrCodeErrorCallback?: QrcodeErrorCallback
    ): void;
    
    clear(): void;
  }
} 