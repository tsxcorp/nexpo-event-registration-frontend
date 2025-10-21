# Nexpo Local Print SDK - Kế hoạch Implementation Chi tiết

## Tổng quan
Mục tiêu: Thay thế popup print dialog bằng native printing tới máy in BIXOLON TX403 thông qua Nexpo Print Agent.

## Kiến trúc đã tạo

### 1. **Web SDK** (✅ Hoàn thành)
- **File**: `src/lib/print/nexpo-print-sdk.ts`
- **Chức năng**:
  - Giao tiếp với Nexpo Print Agent qua HTTP (localhost:18082)
  - API: `detectAgent()`, `listPrinters()`, `printBadge()`, `getPrinterStatus()`
  - Hỗ trợ idempotency với requestId
  - Timeout và error handling

### 2. **Native Print Service** (✅ Hoàn thành)
- **File**: `src/lib/print/native-print-service.ts`
- **Chức năng**:
  - Wrapper layer cho Web SDK
  - Tự động detect và load printers
  - Extract badge data từ visitor info
  - Fallback mechanism

### 3. **Print Wizard Component** (✅ Hoàn thành)
- **File**: `src/components/features/PrintWizard.tsx`
- **Chức năng**:
  - 4-step wizard: Detect OS → Install → Pairing → Test
  - Auto-detect Windows/macOS/Linux
  - Guided installation process
  - Printer detection và test print

### 4. **Nexpo Print Agent** (✅ Hoàn thành)
- **Directory**: `nexpo-print-agent/`
- **Files**:
  - `package.json` - Dependencies và build scripts
  - `src/index.js` - Main agent server
- **Chức năng**:
  - HTTP server trên port 18082
  - Printer detection (Windows/macOS/Linux)
  - SLCS command generation cho BIXOLON
  - Print queue với idempotency
  - Health check endpoint

## Các bước Implementation còn lại

### Bước 1: Sửa lỗi trong Checkin Page
**Vấn đề hiện tại**: File `src/app/checkin/[eventId]/page.tsx` có lỗi cấu trúc sau khi chỉnh sửa.

**Giải pháp**:
1. Restore file gốc từ git
2. Thêm imports:
```typescript
import { nativePrintService, type BadgeData, type BadgeLayout } from '@/lib/print/native-print-service';
import PrintWizard from '@/components/features/PrintWizard';
```

3. Thêm state variables:
```typescript
const [isNativePrintAvailable, setIsNativePrintAvailable] = useState(false);
const [showPrintWizard, setShowPrintWizard] = useState(false);
const [nativePrintEnabled, setNativePrintEnabled] = useState(false);
```

4. Thêm useEffect để check native print:
```typescript
useEffect(() => {
  const checkNativePrint = async () => {
    const isAvailable = await nativePrintService.isAvailable();
    setIsNativePrintAvailable(isAvailable);
    if (isAvailable) setNativePrintEnabled(true);
  };
  checkNativePrint();
}, []);
```

5. Thêm native print function:
```typescript
const printBadgeNative = async (visitorData: VisitorData, qrData: string) => {
  const badgeData: BadgeData = {
    visitorData,
    eventData: eventData!,
    qrData,
    customContent: getCustomContent(visitorData)
  };
  const badgeLayout: BadgeLayout = getBadgeLayout();
  const success = await nativePrintService.printBadge(badgeData, badgeLayout);
  if (success) {
    setSuccess(`✅ Check-in thành công! 🖨️ Đã in thẻ tự động!`);
    setIsPrinting(false);
  }
};
```

6. Modify existing `printBadge()` function để try native print first:
```typescript
// In printBadge function, after QR validation:
if (nativePrintEnabled && isNativePrintAvailable) {
  try {
    await printBadgeNative(visitorData, finalQrData);
    return;
  } catch (error) {
    console.warn('Native print failed, falling back to popup');
  }
}
// Continue with existing popup print logic...
```

7. Thêm UI cho native print status và setup button (trong phần Auto-Print Status):
```tsx
{isNativePrintAvailable ? (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
    <Icon name="CheckCircleIcon" className="w-3 h-3" />
    <span>Native Print: Sẵn sàng</span>
  </div>
) : (
  <button
    onClick={() => setShowPrintWizard(true)}
    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200"
  >
    <Icon name="CogIcon" className="w-3 h-3" />
    <span>Setup Native Print</span>
  </button>
)}
```

8. Thêm PrintWizard component trước closing tag:
```tsx
<PrintWizard
  isOpen={showPrintWizard}
  onClose={() => setShowPrintWizard(false)}
  onAgentReady={() => {
    setNativePrintEnabled(true);
    setIsNativePrintAvailable(true);
    setShowPrintWizard(false);
  }}
  currentLanguage={currentLanguage}
/>
```

### Bước 2: Build Nexpo Print Agent

#### 2.1. Install dependencies
```bash
cd nexpo-print-agent
npm install
```

#### 2.2. Test agent locally
```bash
npm start
```

#### 2.3. Build executables
```bash
npm run build
```
Tạo ra:
- `dist/nexpo-print-agent-win.exe` (Windows)
- `dist/nexpo-print-agent-macos` (macOS)
- `dist/nexpo-print-agent-linux` (Linux)

### Bước 3: Tạo Installers

#### 3.1. Windows Installer (MSI)
**Tool**: WiX Toolset hoặc Inno Setup

**Script mẫu** (`nexpo-print-agent/scripts/windows-installer.iss`):
```inno
[Setup]
AppName=Nexpo Print Agent
AppVersion=1.0.0
DefaultDirName={pf}\Nexpo\PrintAgent
OutputDir=installers
OutputBaseFilename=NexpoPrintAgent_Setup

[Files]
Source: "dist\nexpo-print-agent-win.exe"; DestDir: "{app}"

[Run]
Filename: "{app}\nexpo-print-agent-win.exe"; Parameters: "--install-service"; Flags: runhidden

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Start service after installation
    Exec('sc', 'start NexpoPrintAgent', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
```

#### 3.2. macOS Installer (PKG)
```bash
pkgbuild --root dist/ \
  --identifier com.nexpo.printagent \
  --version 1.0.0 \
  --install-location /Applications/Nexpo/PrintAgent \
  --scripts scripts/macos/ \
  NexpoPrintAgent.pkg
```

**Post-install script** (`scripts/macos/postinstall`):
```bash
#!/bin/bash
# Create launchd plist
cat > /Library/LaunchDaemons/com.nexpo.printagent.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nexpo.printagent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/Nexpo/PrintAgent/nexpo-print-agent-macos</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# Load and start service
launchctl load /Library/LaunchDaemons/com.nexpo.printagent.plist
```

#### 3.3. Linux Installer (DEB)
```bash
# Create package structure
mkdir -p nexpo-agent-deb/DEBIAN
mkdir -p nexpo-agent-deb/usr/local/bin
mkdir -p nexpo-agent-deb/etc/systemd/system

# Copy executable
cp dist/nexpo-print-agent-linux nexpo-agent-deb/usr/local/bin/

# Create control file
cat > nexpo-agent-deb/DEBIAN/control << EOF
Package: nexpo-print-agent
Version: 1.0.0
Architecture: amd64
Maintainer: Nexpo Team
Description: Nexpo Local Print Agent for native badge printing
EOF

# Create systemd service
cat > nexpo-agent-deb/etc/systemd/system/nexpo-print-agent.service << EOF
[Unit]
Description=Nexpo Print Agent
After=network.target

[Service]
ExecStart=/usr/local/bin/nexpo-print-agent-linux
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

# Create postinst script
cat > nexpo-agent-deb/DEBIAN/postinst << EOF
#!/bin/bash
systemctl daemon-reload
systemctl enable nexpo-print-agent
systemctl start nexpo-print-agent
EOF
chmod +x nexpo-agent-deb/DEBIAN/postinst

# Build package
dpkg-deb --build nexpo-agent-deb
mv nexpo-agent-deb.deb nexpo-agent_1.0.0_amd64.deb
```

### Bước 4: Upload Installers

Upload các file installer lên CDN hoặc S3:
```
https://nexpo-print-agent.s3.amazonaws.com/NexpoPrintAgent_Setup.msi
https://nexpo-print-agent.s3.amazonaws.com/NexpoPrintAgent.pkg
https://nexpo-print-agent.s3.amazonaws.com/nexpo-agent.deb
```

Update URLs trong `PrintWizard.tsx`:
```typescript
const downloadUrls = {
  windows: 'https://nexpo-print-agent.s3.amazonaws.com/NexpoPrintAgent_Setup.msi',
  macos: 'https://nexpo-print-agent.s3.amazonaws.com/NexpoPrintAgent.pkg',
  linux: 'https://nexpo-print-agent.s3.amazonaws.com/nexpo-agent.deb'
};
```

### Bước 5: BIXOLON Driver Installation

#### Windows
Bundle BIXOLON Unified Label Printer Driver vào installer:
```inno
[Files]
Source: "drivers\BIXOLON_Label_Printer_Driver_x64.msi"; DestDir: "{tmp}"

[Run]
Filename: "msiexec.exe"; Parameters: "/i ""{tmp}\BIXOLON_Label_Printer_Driver_x64.msi"" /quiet /norestart"; Flags: runhidden
```

#### macOS/Linux
Hướng dẫn user cài đặt CUPS driver:
```bash
# macOS
brew install cups
sudo lpadmin -p BIXOLON_TX403 -E -v usb://BIXOLON/TX403

# Linux
sudo apt-get install cups
sudo lpadmin -p BIXOLON_TX403 -E -v usb://BIXOLON/TX403
```

### Bước 6: Testing

#### 6.1. Test Agent
```bash
# Start agent
cd nexpo-print-agent
npm start

# Test health endpoint
curl http://localhost:18082/v1/health

# Test list printers
curl http://localhost:18082/v1/printers

# Test print
curl -X POST http://localhost:18082/v1/print \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test_001",
    "printer": "BIXOLON SLP-TX403",
    "template": "visitor_v1",
    "data": {
      "fullName": "Nguyen Van A",
      "company": "ABC Corp",
      "qr": "NEXPO:TEST:001"
    }
  }'
```

#### 6.2. Test Web Integration
1. Start Nexpo frontend: `npm run dev`
2. Mở checkin page: `http://localhost:3001/checkin/[eventId]`
3. Kiểm tra native print status
4. Click "Setup Native Print" để test wizard
5. Test print badge sau khi setup

### Bước 7: Deployment

#### 7.1. Frontend
```bash
npm run build
npm run start
```

#### 7.2. Agent Distribution
- Upload installers lên CDN
- Tạo documentation cho user
- Tạo video hướng dẫn cài đặt

## Roadmap

### MVP (Tuần 1-2)
- [x] Web SDK
- [x] Native Print Service
- [x] Print Wizard
- [x] Agent core (Node.js)
- [ ] Sửa lỗi Checkin Page integration
- [ ] Test với BIXOLON TX403

### Phase 2 (Tuần 3-4)
- [ ] Windows installer (MSI)
- [ ] macOS installer (PKG)
- [ ] Linux installer (DEB)
- [ ] Bundle BIXOLON drivers
- [ ] Upload installers lên CDN
- [ ] Documentation

### Phase 3 (Tuần 5+)
- [ ] Multi-printer support
- [ ] Print queue management UI
- [ ] Agent auto-update
- [ ] Dashboard monitoring
- [ ] Android support (BIXOLON Web Print SDK)

## Troubleshooting

### Agent không start
- Kiểm tra port 18082 có bị chiếm không
- Kiểm tra logs tại `nexpo-print-agent/logs/`
- Restart service

### Printer không detect được
- Kiểm tra driver đã cài đặt chưa
- Kiểm tra kết nối USB/Network
- Kiểm tra quyền truy cập (Windows: Administrator, Linux: lpadmin group)

### Print job thất bại
- Kiểm tra printer status
- Kiểm tra SLCS commands trong logs
- Test print trực tiếp từ OS

## Tài liệu tham khảo

- BIXOLON SLCS Programming Manual
- Node.js printer module documentation
- Windows WinSpool API
- CUPS documentation (macOS/Linux)

