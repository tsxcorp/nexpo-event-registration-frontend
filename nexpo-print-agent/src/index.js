/**
 * Nexpo Print Agent - Local printing service
 * Runs on localhost:18082 to provide native printing capabilities
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const sharp = require('sharp');
const winston = require('winston');
const BixolonDriverInstaller = require('../scripts/auto-install-driver');
const BixolonPrinterDetector = require('../scripts/auto-detect-printer');
const SetupGuide = require('../scripts/setup-guide');

// Import platform-specific printer modules
let printer;
try {
  if (process.platform === 'win32') {
    printer = require('node-printer');
  } else {
    // For macOS/Linux, we'll use a simple approach
    printer = require('node-printer');
  }
} catch (error) {
  console.warn('Printer module not available:', error.message);
  printer = null;
}

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = 18082;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global state
let printers = [];
let defaultPrinter = '';
let printQueue = new Map(); // For idempotency

// Initialize printers on startup
async function initializePrinters() {
  try {
    if (printer) {
      if (process.platform === 'win32') {
        // Windows - use wmic command
        const { exec } = require('child_process');
        const printerList = await new Promise((resolve) => {
          exec('wmic printer list brief', (error, stdout) => {
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
                    type: 'usb'
                  };
                });
              resolve(printers);
            }
          });
        });
        
        printers = printerList;
        if (printerList.length > 0) {
          defaultPrinter = printerList[0].name;
        }
      } else {
        // macOS/Linux - use lpstat command
        const { exec } = require('child_process');
        const printerList = await new Promise((resolve) => {
          exec('lpstat -p', (error, stdout) => {
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
                    type: 'usb'
                  };
                });
              resolve(printers);
            }
          });
        });
        
        printers = printerList;
        if (printerList.length > 0) {
          defaultPrinter = printerList[0].name;
        }
      }
      
      logger.info(`Initialized ${printers.length} printers`, { printers: printers.map(p => p.name) });
    } else {
      logger.warn('Printer module not available - running in demo mode');
      // Demo mode - create fake printers
      printers = [
        { name: 'BIXOLON SLP-TX403', status: 'ready', logicalName: 'TX403_Checkin_01', type: 'usb' },
        { name: 'BIXOLON SLP-TX420', status: 'ready', logicalName: 'TX420_Checkin_02', type: 'usb' }
      ];
      defaultPrinter = printers[0].name;
    }
  } catch (error) {
    logger.error('Error initializing printers:', error);
  }
}

// Health check endpoint
app.get('/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    defaultPrinter,
    printerCount: printers.length
  });
});

// Auto-setup endpoint
app.post('/v1/auto-setup', async (req, res) => {
  try {
    logger.info('Starting auto-setup process...');
    
    // Step 1: Auto-install BIXOLON driver
    const driverInstaller = new BixolonDriverInstaller();
    const driverInstalled = await driverInstaller.autoInstall();
    
    if (!driverInstalled) {
      // If auto-install fails, provide setup guide
      const setupGuide = new SetupGuide();
      const guide = setupGuide.generateSetupGuide();
      
      return res.status(500).json({
        success: false,
        error: 'Failed to install BIXOLON driver automatically',
        step: 'driver_installation',
        setupGuide: guide,
        message: 'Please follow the manual setup guide below'
      });
    }
    
    // Step 2: Auto-detect BIXOLON printers
    const printerDetector = new BixolonPrinterDetector();
    const detectedPrinters = await printerDetector.autoDetect();
    
    if (detectedPrinters.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No BIXOLON printers detected',
        step: 'printer_detection'
      });
    }
    
    // Step 3: Update printer list
    printers = detectedPrinters;
    if (printers.length > 0) {
      defaultPrinter = printers[0].name;
    }
    
    logger.info(`Auto-setup completed: ${printers.length} printers detected`);
    
    res.json({
      success: true,
      message: 'Auto-setup completed successfully',
      printers: printers,
      defaultPrinter: defaultPrinter
    });
    
  } catch (error) {
    logger.error('Auto-setup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      step: 'auto_setup'
    });
  }
});

// Setup guide endpoint
app.get('/v1/setup-guide', (req, res) => {
  try {
    const setupGuide = new SetupGuide();
    const guide = setupGuide.generateSetupGuide();
    
    res.json({
      success: true,
      guide: guide
    });
  } catch (error) {
    logger.error('Failed to generate setup guide:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Soft reload (re-scan printers without killing the process)
app.post('/v1/reload', async (req, res) => {
  try {
    await initializePrinters();
    res.json({ success: true, printers, defaultPrinter });
  } catch (error) {
    logger.error('Reload failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restart endpoint (responds OK then exits; supervisor should bring it back)
app.post('/v1/restart', (req, res) => {
  try {
    res.json({ success: true, message: 'Agent restarting' });
    setTimeout(() => {
      logger.info('Restart requested via API, exiting...');
      process.exit(0);
    }, 200);
  } catch (error) {
    logger.error('Restart failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List printers endpoint
app.get('/v1/printers', (req, res) => {
  res.json({
    printers: printers,
    defaultPrinter
  });
});

// Set default printer endpoint
app.post('/v1/printers/default', (req, res) => {
  const { printer: printerName } = req.body;
  
  if (!printerName) {
    return res.status(400).json({ error: 'Printer name is required' });
  }
  
  const foundPrinter = printers.find(p => p.name === printerName || p.logicalName === printerName);
  if (!foundPrinter) {
    return res.status(404).json({ error: 'Printer not found' });
  }
  
  defaultPrinter = foundPrinter.name;
  logger.info(`Default printer set to: ${defaultPrinter}`);
  
  res.json({ success: true, defaultPrinter });
});

// Print endpoint
app.post('/v1/print', async (req, res) => {
  const { requestId, printer: printerName, template, data, options = {}, copies = 1 } = req.body;
  
  try {
    // Validate required fields
    if (!requestId || !printerName || !template || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields: requestId, printer, template, data' 
      });
    }
    
    // Check idempotency
    if (printQueue.has(requestId)) {
      const existingJob = printQueue.get(requestId);
      return res.json({
        result: existingJob.status === 'completed' ? 'OK' : 'IN_PROGRESS',
        jobId: existingJob.jobId,
        queuedAt: existingJob.queuedAt
      });
    }
    
    // Find printer
    const targetPrinter = printers.find(p => 
      p.name === printerName || p.logicalName === printerName
    );
    
    if (!targetPrinter) {
      return res.status(404).json({ error: 'Printer not found' });
    }
    
    // Create print job
    const jobId = uuidv4();
    const queuedAt = Date.now();
    
    printQueue.set(requestId, {
      jobId,
      status: 'processing',
      queuedAt,
      printer: targetPrinter.name
    });
    
    // Process print job asynchronously
    processPrintJob(requestId, jobId, targetPrinter, template, data, options, copies)
      .then(() => {
        printQueue.set(requestId, { ...printQueue.get(requestId), status: 'completed' });
        logger.info(`Print job completed: ${requestId}`);
      })
      .catch((error) => {
        printQueue.set(requestId, { ...printQueue.get(requestId), status: 'failed', error: error.message });
        logger.error(`Print job failed: ${requestId}`, error);
      });
    
    res.json({
      result: 'OK',
      jobId,
      queuedAt
    });
    
  } catch (error) {
    logger.error('Print request error:', error);
    res.status(500).json({ 
      result: 'ERROR',
      error: error.message 
    });
  }
});

// Process print job
async function processPrintJob(requestId, jobId, printer, template, data, options, copies) {
  try {
    logger.info(`Processing print job: ${requestId}`, { printer: printer.name, template });
    
    // Generate SLCS commands based on template
    const slcsCommands = await generateSLCSCommands(template, data, options);
    logger.info('SLCS payload preview (first 200 chars): ' + slcsCommands.slice(0, 200).replace(/\r/g, '␍').replace(/\n/g, '␊'));
    
    // Print to physical printer
    for (let i = 0; i < copies; i++) {
      await printToPrinter(printer, slcsCommands);
    }
    
    logger.info(`Print job successful: ${requestId} (${copies} copies)`);
    
  } catch (error) {
    logger.error(`Print job failed: ${requestId}`, error);
    throw error;
  }
}

// Minimal print test endpoint to verify output pipeline
app.post('/v1/print-test', async (req, res) => {
  try {
    const printerName = (req.body && req.body.printer) || defaultPrinter;
    const targetPrinter = printers.find(p => p.name === printerName) || printers[0];
    if (!targetPrinter) return res.status(404).json({ success: false, error: 'No printer' });
    const payload = ['N','q400','Q200,24','A50,30,0,3,1,1,N,"TEST"','P1'].join('\r\n') + '\r\n';
    await printToPrinter(targetPrinter, payload);
    res.json({ success: true });
  } catch (e) {
    logger.error('print-test failed', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Generate SLCS commands for BIXOLON printers
async function generateSLCSCommands(template, data, options) {
  let commands = [];
  
  // Initialize printer
  commands.push('N'); // Initialize
  // Allow custom width/height in dots via options; fallback to 4x2 default
  const widthDots = options?.widthDots || 400;
  const heightDots = options?.heightDots || 200;
  const gapDots = options?.gapDots ?? 24;
  commands.push(`q${widthDots}`);
  commands.push(`Q${heightDots},${gapDots}`);
  // Optional: darkness/speed could be tuned if needed
  if (options && typeof options.darkness === 'number') {
    commands.push(`D${options.darkness}`);
  }
  
  // Generate QR code
  if (data.qr) {
    try {
      // Generate QR code as base64 image
      const qrBuffer = await QRCode.toBuffer(data.qr, {
        width: 200,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      // Convert to 1-bit bitmap for SLCS
      const bitmap = await sharp(qrBuffer)
        .resize(200, 200)
        .threshold(128)
        .raw()
        .toBuffer();
      
      // Convert bitmap to SLCS format (simplified)
      commands.push(`B50,50,Q,7,7,200,N,"${data.qr}"`); // QR command
    } catch (error) {
      logger.warn('QR generation failed, using text fallback:', error);
      commands.push(`A50,50,0,3,1,1,N,"QR: ${data.qr.slice(-16)}"`); // Text fallback
    }
  }
  
  // Add name
  if (data.fullName) {
    const nameSize = data.fullName.length > 20 ? '2' : '3';
    commands.push(`A50,30,0,${nameSize},2,2,N,"${data.fullName}"`);
  }
  
  // Add company
  if (data.company) {
    commands.push(`A50,80,0,2,1,1,N,"${data.company}"`);
  }
  
  // Add custom content
  if (data.customContent && Array.isArray(data.customContent)) {
    let yPos = 120;
    data.customContent.forEach((content, index) => {
      if (content && content.trim()) {
        commands.push(`A50,${yPos},0,2,1,1,N,"${content.trim()}"`);
        yPos += 20;
      }
    });
  }
  
  // Print command
  commands.push('P1'); // Print 1 copy
  
  // SLCS expects CRLF line endings
  const payload = commands.join('\r\n') + '\r\n';
  return payload;
}

// Convert a 1-bit raw bitmap buffer to SLCS GW hex payload
function slcsGwFromMonoBitmap(x, y, width, height, monoBuffer) {
  const bytesPerRow = Math.ceil(width / 8);
  let hex = '';
  for (let row = 0; row < height; row++) {
    for (let byteIdx = 0; byteIdx < bytesPerRow; byteIdx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const pxX = byteIdx * 8 + bit;
        if (pxX >= width) continue;
        const idx = row * width + pxX; // 1 byte per pixel (0/255) from sharp threshold raw()
        const v = monoBuffer[idx];
        // SLCS expects 1 for black dot. Our buffer is 0 for black after threshold
        const isBlack = v === 0;
        byte |= (isBlack ? 1 : 0) << (7 - bit);
      }
      hex += byte.toString(16).padStart(2, '0');
    }
  }
  return `GW${x},${y},${bytesPerRow},${height},${hex}`;
}

// Demo endpoint: 106mm x 144mm portrait (approx 1250 x 1700 dots @300dpi)
app.post('/v1/print-demo-106x144', async (req, res) => {
  try {
    const printerName = (req.body && req.body.printer) || defaultPrinter;
    const targetPrinter = printers.find(p => p.name === printerName) || printers[0];
    if (!targetPrinter) return res.status(404).json({ success: false, error: 'No printer' });

    const widthDots = 1250; // ~106mm @300dpi
    const heightDots = 1700; // ~144mm @300dpi
    const gapDots = 24;

    const commands = [];
    commands.push('N');
    commands.push(`q${widthDots}`);
    commands.push(`Q${heightDots},${gapDots}`);

    // Title centered roughly
    const title = 'NEXPO BADGE TEST';
    // Approx char width 24 dots base * scale 3 = 72
    const estCharWidth = 72;
    const titleWidth = estCharWidth * title.length;
    const titleX = Math.max(0, Math.floor((widthDots - titleWidth) / 2));
    commands.push(`A${titleX},120,0,3,3,3,N,"${title}"`);

    // QR centered
    const qrSize = 500;
    const qrX = Math.floor((widthDots - qrSize) / 2);
    const qrY = 350;
    commands.push(`B${qrX},${qrY},Q,7,7,${qrSize},N,"NEXPO:DEMO:106x144"`);

    // Name centered roughly
    const name = (req.body && req.body.name) || 'TEST USER';
    const nameScale = 3;
    const nameChar = 24 * nameScale; // approx
    const nameWidth = nameChar * name.length;
    const nameX = Math.max(0, Math.floor((widthDots - nameWidth) / 2));
    const nameY = qrY + qrSize + 120;
    commands.push(`A${nameX},${nameY},0,3,${nameScale},${nameScale},N,"${name}"`);

    // Print
    commands.push('P1');
    const payload = commands.join('\r\n') + '\r\n';
    await printToPrinter(targetPrinter, payload);
    res.json({ success: true });
  } catch (e) {
    logger.error('print-demo-106x144 failed', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Portrait 106mm x 146mm demo with top artwork margin and centered name
app.post('/v1/print-demo-106x146-portrait', async (req, res) => {
  try {
    const printerName = (req.body && req.body.printer) || defaultPrinter;
    const targetPrinter = printers.find(p => p.name === printerName) || printers[0];
    if (!targetPrinter) return res.status(404).json({ success: false, error: 'No printer' });

    // TX403 @300dpi approximation
    const widthDots = 1250;   // ~106mm
    const heightDots = 1750;  // ~146mm
    const gapDots = 24;

    // Reserve top area for header artwork
    const topMargin = 420; // ~35mm để tránh phần artwork trên

    const commands = [];
    commands.push('N');
    commands.push(`q${widthDots}`);
    commands.push(`Q${heightDots},${gapDots}`);

    // Optional faint anchor mark for debugging alignment (comment out if not needed)
    // commands.push(`A10,${topMargin},0,1,1,1,N,"."`);

    // Name centered large
    const name = (req.body && req.body.name) || 'TONY WANG';
    const font = 5;           // larger base font
    const scale = 5;          // lớn hơn cho badge
    const approxChar = 16 * scale; // font 5 approx 16-dot width base
    const nameWidth = approxChar * name.length;
    const nameX = Math.max(0, Math.floor((widthDots - nameWidth) / 2));
    const nameY = topMargin + 520; // roughly center of printable body
    commands.push(`A${nameX},${nameY},0,${font},${scale},${scale},N,"${name}"`);

    // Subline (company) centered
    const company = (req.body && req.body.company) || '';
    if (company) {
      const subScale = 2;
      const subChar = 16 * subScale;
      const subWidth = subChar * company.length;
      const subX = Math.max(0, Math.floor((widthDots - subWidth) / 2));
      const subY = nameY + 120;
      commands.push(`A${subX},${subY},0,${font},${subScale},${subScale},N,"${company}"`);
    }

    // Optional QR centered below
    if (req.body?.qr) {
      const qrSize = 250; // theo yêu cầu 250px tại 300dpi ~ 250 dots
      const qrX = Math.floor((widthDots - qrSize) / 2);
      const qrY = topMargin + 60; // đặt QR ở nửa trên, cách margin
      // Render QR to mono bitmap and embed as GW
      const qrPng = await QRCode.toBuffer(req.body.qr, { width: qrSize, margin: 0, errorCorrectionLevel: 'M' });
      const mono = await sharp(qrPng).resize(qrSize, qrSize).threshold(180).raw().toBuffer();
      commands.push(slcsGwFromMonoBitmap(qrX, qrY, qrSize, qrSize, mono));
    }

    commands.push('P1');
    const payload = commands.join('\r\n') + '\r\n';
    await printToPrinter(targetPrinter, payload);
    res.json({ success: true });
  } catch (e) {
    logger.error('print-demo-106x146-portrait failed', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Print to physical printer
async function printToPrinter(printer, slcsCommands) {
  try {
    if (process.platform === 'win32') {
      // Windows - use node-printer
      return new Promise((resolve, reject) => {
        printer.printDirect({
          data: slcsCommands,
          printer: printer.name,
          type: 'RAW',
          success: (jobID) => {
            logger.info(`Print job sent to Windows printer: ${printer.name} (Job ID: ${jobID})`);
            resolve(jobID);
          },
          error: (err) => {
            logger.error(`Windows print error: ${printer.name}`, err);
            reject(err);
          }
        });
      });
  } else {
      // macOS/Linux - send RAW data via CUPS so jobs show in system queue
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        try {
          const lp = spawn('lp', ['-d', printer.name, '-o', 'raw']);

          let stderrBuffer = '';
          lp.stderr.on('data', (chunk) => {
            stderrBuffer += chunk.toString();
          });

          lp.on('error', (err) => {
            logger.error(`Failed to start lp for ${printer.name}`, err);
            reject(err);
          });

          lp.on('close', (code) => {
            if (code === 0) {
              logger.info(`Print job sent to CUPS (RAW): ${printer.name}`);
              resolve(true);
            } else {
              const error = new Error(`lp exited with code ${code}: ${stderrBuffer}`);
              logger.error(`CUPS print error: ${printer.name}`, error);
              reject(error);
            }
          });

          // Write SLCS commands to stdin and end
          lp.stdin.write(slcsCommands);
          lp.stdin.end();
        } catch (err) {
          logger.error(`CUPS invocation failed for ${printer.name}`, err);
          reject(err);
        }
      });
    }
  } catch (error) {
    logger.error(`Print to printer failed: ${printer.name}`, error);
    throw error;
  }
}

// Cleanup old print jobs (keep only last 100)
setInterval(() => {
  if (printQueue.size > 100) {
    const entries = Array.from(printQueue.entries());
    const toDelete = entries.slice(0, entries.length - 100);
    toDelete.forEach(([key]) => printQueue.delete(key));
    logger.info(`Cleaned up ${toDelete.length} old print jobs`);
  }
}, 60000); // Every minute

// Start server
async function startServer() {
  try {
    // Create logs directory
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    
    // Initialize printers
    await initializePrinters();
    
    // Start HTTP server
    app.listen(PORT, '127.0.0.1', () => {
      logger.info(`Nexpo Print Agent started on http://127.0.0.1:${PORT}`);
      logger.info(`Available printers: ${printers.length}`);
      logger.info(`Default printer: ${defaultPrinter || 'None'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start Nexpo Print Agent:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down Nexpo Print Agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down Nexpo Print Agent...');
  process.exit(0);
});

// Start the server
startServer();
