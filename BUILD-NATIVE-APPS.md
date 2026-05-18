# Building Native Apps from Vault OS

This HTML app can be wrapped into a real Android APK and desktop app using **Capacitor** (by Ionic).
No React, no complex setup — it wraps your plain HTML/JS files directly.

---

## Prerequisites

Install these once on your computer:
- **Node.js 18+** → https://nodejs.org
- **Android Studio** (for APK) → https://developer.android.com/studio
- **Xcode** (for iOS, Mac only) → App Store

---

## Step 1 — Set up Capacitor

```bash
# In the vault-os folder:
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# Init Capacitor (answer the prompts)
npx cap init "Vault OS" "com.vaultos.app" --web-dir .
```

---

## Step 2 — Add Android platform

```bash
npx cap add android
npx cap sync android
```

---

## Step 3 — Build the APK

```bash
# Open Android Studio and build from there:
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to finish
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

To install directly to your Android phone (USB debugging on):
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 4 — Desktop App (Windows / Mac / Linux)

Use **Electron** to wrap the app as a desktop executable.

```bash
npm install --save-dev electron electron-builder

# Add this to package.json "scripts":
# "electron": "electron .",
# "build-win": "electron-builder --win",
# "build-mac": "electron-builder --mac",
# "build-linux": "electron-builder --linux"
```

Create `electron-main.js`:
```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    icon: path.join(__dirname, 'icon-512.png'),
    webPreferences: { nodeIntegration: false }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
```

Add to `package.json`:
```json
{
  "main": "electron-main.js",
  "build": {
    "appId": "com.vaultos.app",
    "productName": "Vault OS",
    "icon": "icon-512.png",
    "win": { "target": "nsis" },
    "mac": { "target": "dmg" },
    "linux": { "target": "AppImage" }
  }
}
```

Build:
```bash
npm run build-win    # → Windows .exe installer
npm run build-mac    # → Mac .dmg
npm run build-linux  # → Linux .AppImage
```

---

## Quick Reference

| Platform | Tool | Output |
|----------|------|--------|
| Android APK | Capacitor + Android Studio | `.apk` file |
| Windows | Electron Builder | `.exe` installer |
| Mac | Electron Builder | `.dmg` |
| Linux | Electron Builder | `.AppImage` |
| iOS | Capacitor + Xcode | `.ipa` (Mac only) |

---

## Notes

- The app uses `localStorage` for all data — this works in Capacitor and Electron out of the box
- No internet required after install (service worker caches everything)
- All tokens entered stay in memory only (never written to disk)
