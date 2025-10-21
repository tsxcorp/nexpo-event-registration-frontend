/**
 * Auto-detect BIXOLON Printer
 * Tự động detect BIXOLON printer qua USB, Network, Bluetooth
 */

const { exec } = require('child_process');
const os = require('os');

class BixolonPrinterDetector {
  constructor() {
    this.platform = os.platform();
  }

  async detectUSBPrinters() {
    console.log('🔍 Detecting USB BIXOLON printers...');
    
    try {
      if (this.platform === 'win32') {
        return await this.detectWindowsUSB();
      } else if (this.platform === 'darwin') {
        return await this.detectMacOSUSB();
      } else if (this.platform === 'linux') {
        return await this.detectLinuxUSB();
      }
    } catch (error) {
      console.error('❌ Error detecting USB printers:', error);
      return [];
    }
  }

  async detectNetworkPrinters() {
    console.log('🌐 Detecting Network BIXOLON printers...');
    
    try {
      if (this.platform === 'win32') {
        return await this.detectWindowsNetwork();
      } else if (this.platform === 'darwin') {
        return await this.detectMacOSNetwork();
      } else if (this.platform === 'linux') {
        return await this.detectLinuxNetwork();
      }
    } catch (error) {
      console.error('❌ Error detecting network printers:', error);
      return [];
    }
  }

  async detectBluetoothPrinters() {
    console.log('📶 Detecting Bluetooth BIXOLON printers...');
    
    try {
      if (this.platform === 'win32') {
        return await this.detectWindowsBluetooth();
      } else if (this.platform === 'darwin') {
        return await this.detectMacOSBluetooth();
      } else if (this.platform === 'linux') {
        return await this.detectLinuxBluetooth();
      }
    } catch (error) {
      console.error('❌ Error detecting bluetooth printers:', error);
      return [];
    }
  }

  async detectWindowsUSB() {
    return new Promise((resolve) => {
      exec('wmic printer list brief | findstr -i bixolon', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
              const parts = line.split(/\s+/);
              return {
                name: parts[0] || 'Unknown',
                status: parts[1] || 'Unknown',
                type: 'usb',
                connection: 'USB'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectMacOSUSB() {
    return new Promise((resolve) => {
      exec('lpstat -p | grep -i bixolon', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
              const match = line.match(/printer (\w+) is/);
              return {
                name: match ? match[1] : 'Unknown',
                status: 'ready',
                type: 'usb',
                connection: 'USB'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectLinuxUSB() {
    return new Promise((resolve) => {
      exec('lpstat -p | grep -i bixolon', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
              const match = line.match(/printer (\w+) is/);
              return {
                name: match ? match[1] : 'Unknown',
                status: 'ready',
                type: 'usb',
                connection: 'USB'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectWindowsNetwork() {
    return new Promise((resolve) => {
      exec('wmic printer list brief | findstr -i "\\\\"', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim() && line.toLowerCase().includes('bixolon'))
            .map(line => {
              const parts = line.split(/\s+/);
              return {
                name: parts[0] || 'Unknown',
                status: parts[1] || 'Unknown',
                type: 'network',
                connection: 'Network'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectMacOSNetwork() {
    return new Promise((resolve) => {
      exec('lpstat -p | grep -i bixolon', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim() && line.includes('://'))
            .map(line => {
              const match = line.match(/printer (\w+) is/);
              return {
                name: match ? match[1] : 'Unknown',
                status: 'ready',
                type: 'network',
                connection: 'Network'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectLinuxNetwork() {
    return new Promise((resolve) => {
      exec('lpstat -p | grep -i bixolon', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim() && line.includes('://'))
            .map(line => {
              const match = line.match(/printer (\w+) is/);
              return {
                name: match ? match[1] : 'Unknown',
                status: 'ready',
                type: 'network',
                connection: 'Network'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectWindowsBluetooth() {
    return new Promise((resolve) => {
      exec('wmic printer list brief | findstr -i bluetooth', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim() && line.toLowerCase().includes('bixolon'))
            .map(line => {
              const parts = line.split(/\s+/);
              return {
                name: parts[0] || 'Unknown',
                status: parts[1] || 'Unknown',
                type: 'bluetooth',
                connection: 'Bluetooth'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectMacOSBluetooth() {
    return new Promise((resolve) => {
      exec('system_profiler SPBluetoothDataType | grep -i bixolon', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
              return {
                name: line.trim(),
                status: 'ready',
                type: 'bluetooth',
                connection: 'Bluetooth'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async detectLinuxBluetooth() {
    return new Promise((resolve) => {
      exec('bluetoothctl devices | grep -i bixolon', (error, stdout) => {
        if (error) {
          resolve([]);
        } else {
          const printers = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
              const parts = line.split(' ');
              return {
                name: parts[1] || 'Unknown',
                status: 'ready',
                type: 'bluetooth',
                connection: 'Bluetooth'
              };
            });
          resolve(printers);
        }
      });
    });
  }

  async autoDetect() {
    console.log('🚀 Starting BIXOLON printer auto-detection...');
    
    try {
      const usbPrinters = await this.detectUSBPrinters();
      const networkPrinters = await this.detectNetworkPrinters();
      const bluetoothPrinters = await this.detectBluetoothPrinters();
      
      const allPrinters = [
        ...usbPrinters,
        ...networkPrinters,
        ...bluetoothPrinters
      ];
      
      console.log(`✅ Found ${allPrinters.length} BIXOLON printers:`);
      allPrinters.forEach(printer => {
        console.log(`   - ${printer.name} (${printer.connection})`);
      });
      
      return allPrinters;
    } catch (error) {
      console.error('❌ Auto-detection failed:', error);
      return [];
    }
  }
}

module.exports = BixolonPrinterDetector;
