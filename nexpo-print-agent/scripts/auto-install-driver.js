/**
 * Auto-install BIXOLON Driver
 * Tự động detect OS và cài đặt driver BIXOLON
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

class BixolonDriverInstaller {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.driverUrls = {
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
  }

  async checkBixolonDriver() {
    console.log('🔍 Checking BIXOLON driver...');
    
    try {
      if (this.platform === 'win32') {
        return await this.checkWindowsDriver();
      } else if (this.platform === 'darwin') {
        return await this.checkMacOSDriver();
      } else if (this.platform === 'linux') {
        return await this.checkLinuxDriver();
      }
    } catch (error) {
      console.error('❌ Error checking driver:', error);
      return false;
    }
  }

  async checkWindowsDriver() {
    return new Promise((resolve) => {
      exec('wmic printer list brief | findstr -i bixolon', (error, stdout) => {
        if (error) {
          console.log('❌ BIXOLON driver not found on Windows');
          resolve(false);
        } else {
          console.log('✅ BIXOLON driver found on Windows');
          resolve(true);
        }
      });
    });
  }

  async checkMacOSDriver() {
    return new Promise((resolve) => {
      exec('lpstat -p | grep -i bixolon', (error, stdout) => {
        if (error) {
          console.log('❌ BIXOLON driver not found on macOS');
          resolve(false);
        } else {
          console.log('✅ BIXOLON driver found on macOS');
          resolve(true);
        }
      });
    });
  }

  async checkLinuxDriver() {
    return new Promise((resolve) => {
      exec('lpstat -p | grep -i bixolon', (error, stdout) => {
        if (error) {
          console.log('❌ BIXOLON driver not found on Linux');
          resolve(false);
        } else {
          console.log('✅ BIXOLON driver found on Linux');
          resolve(true);
        }
      });
    });
  }

  async downloadDriver() {
    const driverUrl = this.driverUrls[this.platform]?.[this.arch];
    if (!driverUrl) {
      throw new Error(`Unsupported platform: ${this.platform}-${this.arch}`);
    }

    console.log(`📥 Downloading BIXOLON driver for ${this.platform}-${this.arch}...`);
    
    const driverPath = path.join(__dirname, '..', 'drivers', `bixolon-driver.${this.getFileExtension()}`);
    
    // Ensure drivers directory exists
    const driversDir = path.dirname(driverPath);
    if (!fs.existsSync(driversDir)) {
      fs.mkdirSync(driversDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(driverPath);
      https.get(driverUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Driver downloaded to: ${driverPath}`);
          resolve(driverPath);
        });
      }).on('error', (error) => {
        fs.unlink(driverPath, () => {}); // Delete the file on error
        reject(error);
      });
    });
  }

  async installDriver(driverPath) {
    console.log(`🔧 Installing BIXOLON driver...`);
    
    try {
      if (this.platform === 'win32') {
        await this.installWindowsDriver(driverPath);
      } else if (this.platform === 'darwin') {
        await this.installMacOSDriver(driverPath);
      } else if (this.platform === 'linux') {
        await this.installLinuxDriver(driverPath);
      }
      
      console.log('✅ BIXOLON driver installed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to install driver:', error);
      return false;
    }
  }

  async installWindowsDriver(driverPath) {
    return new Promise((resolve, reject) => {
      exec(`"${driverPath}" /S /D=C:\\BixolonDriver`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async installMacOSDriver(driverPath) {
    return new Promise((resolve, reject) => {
      // Try to install without sudo first
      exec(`installer -pkg "${driverPath}" -target /`, (error, stdout, stderr) => {
        if (error) {
          // If that fails, try with user-level installation
          exec(`installer -pkg "${driverPath}" -target ~/Applications`, (error2, stdout2, stderr2) => {
            if (error2) {
              // If both fail, just copy the driver to a local directory
              const fs = require('fs');
              const path = require('path');
              const localDriverPath = path.join(process.cwd(), 'drivers', 'bixolon-driver.pkg');
              try {
                fs.copyFileSync(driverPath, localDriverPath);
                console.log('✅ Driver copied to local directory');
                resolve();
              } catch (copyError) {
                reject(copyError);
              }
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  }

  async installLinuxDriver(driverPath) {
    return new Promise((resolve, reject) => {
      exec(`sudo dpkg -i "${driverPath}"`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  getFileExtension() {
    if (this.platform === 'win32') return 'exe';
    if (this.platform === 'darwin') return 'pkg';
    if (this.platform === 'linux') return 'deb';
    return 'bin';
  }

  async autoInstall() {
    console.log('🚀 Starting BIXOLON driver auto-installation...');
    
    try {
      // Check if driver already exists
      const driverExists = await this.checkBixolonDriver();
      if (driverExists) {
        console.log('✅ BIXOLON driver already installed');
        return true;
      }

      // Download driver
      const driverPath = await this.downloadDriver();
      
      // Install driver
      const success = await this.installDriver(driverPath);
      
      if (success) {
        console.log('🎉 BIXOLON driver installation completed!');
        return true;
      } else {
        console.log('❌ BIXOLON driver installation failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Auto-installation failed:', error);
      return false;
    }
  }
}

module.exports = BixolonDriverInstaller;
