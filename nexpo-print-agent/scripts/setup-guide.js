/**
 * User-Friendly Setup Guide
 * Hướng dẫn user cài đặt BIXOLON driver một cách thân thiện
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

class SetupGuide {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
  }

  generateSetupGuide() {
    const guide = {
      platform: this.platform,
      arch: this.arch,
      steps: this.getSetupSteps(),
      downloadUrl: this.getDownloadUrl(),
      instructions: this.getInstructions()
    };

    return guide;
  }

  getSetupSteps() {
    if (this.platform === 'win32') {
      return [
        'Tải xuống BIXOLON driver cho Windows',
        'Chạy file .exe với quyền Administrator',
        'Làm theo hướng dẫn cài đặt',
        'Kết nối BIXOLON printer qua USB',
        'Khởi động lại Nexpo Print Agent'
      ];
    } else if (this.platform === 'darwin') {
      return [
        'Tải xuống BIXOLON driver cho macOS',
        'Mở file .pkg và làm theo hướng dẫn',
        'Nhập password admin khi được yêu cầu',
        'Kết nối BIXOLON printer qua USB',
        'Khởi động lại Nexpo Print Agent'
      ];
    } else if (this.platform === 'linux') {
      return [
        'Tải xuống BIXOLON driver cho Linux',
        'Chạy: sudo dpkg -i bixolon-driver.deb',
        'Hoặc: sudo apt install ./bixolon-driver.deb',
        'Kết nối BIXOLON printer qua USB',
        'Khởi động lại Nexpo Print Agent'
      ];
    }
    return [];
  }

  getDownloadUrl() {
    const urls = {
      'win32': {
        'x64': 'https://www.bixolon.com/downloads/drivers/SLP-TX403_Windows_Driver_v1.0.0.exe',
        'ia32': 'https://www.bixolon.com/downloads/drivers/SLP-TX403_Windows_Driver_v1.0.0.exe'
      },
      'darwin': {
        'x64': 'https://www.bixolon.com/downloads/drivers/SLP-TX403_macOS_Driver_v1.0.0.pkg',
        'arm64': 'https://www.bixolon.com/downloads/drivers/SLP-TX403_macOS_Driver_v1.0.0.pkg'
      },
      'linux': {
        'x64': 'https://www.bixolon.com/downloads/drivers/SLP-TX403_Linux_Driver_v1.0.0.deb',
        'arm64': 'https://www.bixolon.com/downloads/drivers/SLP-TX403_Linux_Driver_v1.0.0.deb'
      }
    };

    return urls[this.platform]?.[this.arch] || '';
  }

  getInstructions() {
    if (this.platform === 'win32') {
      return {
        title: 'Cài đặt BIXOLON Driver trên Windows',
        description: 'Để in badge tự động, bạn cần cài đặt BIXOLON driver trên Windows.',
        steps: [
          {
            step: 1,
            title: 'Tải xuống driver',
            description: 'Click vào link bên dưới để tải xuống BIXOLON driver cho Windows.',
            action: 'download'
          },
          {
            step: 2,
            title: 'Chạy với quyền Administrator',
            description: 'Right-click vào file .exe và chọn "Run as administrator".',
            action: 'install'
          },
          {
            step: 3,
            title: 'Làm theo hướng dẫn',
            description: 'Làm theo các bước trong wizard cài đặt.',
            action: 'follow'
          },
          {
            step: 4,
            title: 'Kết nối printer',
            description: 'Kết nối BIXOLON printer qua USB cable.',
            action: 'connect'
          },
          {
            step: 5,
            title: 'Khởi động lại agent',
            description: 'Khởi động lại Nexpo Print Agent để detect printer.',
            action: 'restart'
          }
        ]
      };
    } else if (this.platform === 'darwin') {
      return {
        title: 'Cài đặt BIXOLON Driver trên macOS',
        description: 'Để in badge tự động, bạn cần cài đặt BIXOLON driver trên macOS.',
        steps: [
          {
            step: 1,
            title: 'Tải xuống driver',
            description: 'Click vào link bên dưới để tải xuống BIXOLON driver cho macOS.',
            action: 'download'
          },
          {
            step: 2,
            title: 'Mở file .pkg',
            description: 'Double-click vào file .pkg để mở installer.',
            action: 'install'
          },
          {
            step: 3,
            title: 'Nhập password',
            description: 'Nhập password admin khi được yêu cầu.',
            action: 'password'
          },
          {
            step: 4,
            title: 'Kết nối printer',
            description: 'Kết nối BIXOLON printer qua USB cable.',
            action: 'connect'
          },
          {
            step: 5,
            title: 'Khởi động lại agent',
            description: 'Khởi động lại Nexpo Print Agent để detect printer.',
            action: 'restart'
          }
        ]
      };
    } else if (this.platform === 'linux') {
      return {
        title: 'Cài đặt BIXOLON Driver trên Linux',
        description: 'Để in badge tự động, bạn cần cài đặt BIXOLON driver trên Linux.',
        steps: [
          {
            step: 1,
            title: 'Tải xuống driver',
            description: 'Click vào link bên dưới để tải xuống BIXOLON driver cho Linux.',
            action: 'download'
          },
          {
            step: 2,
            title: 'Cài đặt driver',
            description: 'Chạy lệnh: sudo dpkg -i bixolon-driver.deb',
            action: 'install'
          },
          {
            step: 3,
            title: 'Kết nối printer',
            description: 'Kết nối BIXOLON printer qua USB cable.',
            action: 'connect'
          },
          {
            step: 4,
            title: 'Khởi động lại agent',
            description: 'Khởi động lại Nexpo Print Agent để detect printer.',
            action: 'restart'
          }
        ]
      };
    }
    return {};
  }

  saveSetupGuide() {
    const guide = this.generateSetupGuide();
    const guidePath = path.join(__dirname, '..', 'setup-guide.json');
    
    try {
      fs.writeFileSync(guidePath, JSON.stringify(guide, null, 2));
      console.log('✅ Setup guide saved to:', guidePath);
      return guidePath;
    } catch (error) {
      console.error('❌ Failed to save setup guide:', error);
      return null;
    }
  }
}

module.exports = SetupGuide;
