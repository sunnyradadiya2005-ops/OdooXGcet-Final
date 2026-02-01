# Mobile App Network Setup Guide

## Overview

This guide explains how to configure the KirayaKart mobile app to connect to the backend server running on a different laptop over the same local network.

---

## Current Configuration

**Backend Server:**
- IP Address: `10.236.250.182`
- Port: `5000`
- API Base URL: `http://10.236.250.182:5000/api`

**Mobile Device:**
- IP Address: `10.236.250.178`
- Network: Same local network (`10.236.250.0/24`)

---

## Quick Start

### 1. Ensure Backend is Running

On the backend server laptop, verify the backend is running:

```bash
cd backend
npm start
```

The backend should be accessible at `http://0.0.0.0:5000` or `http://10.236.250.182:5000`

### 2. Verify Network Connectivity

From your mobile device's network, test connectivity:

**Option A: Using another computer on the same network**
```bash
ping 10.236.250.182
curl http://10.236.250.182:5000/api/health
```

**Option B: Using browser on mobile device**
- Open browser and navigate to: `http://10.236.250.182:5000`
- You should see a response from the backend

### 3. Run the Mobile App

```bash
cd mobile/KirayaKartMobile
npm run android
```

The app will automatically connect to the backend at `10.236.250.182:5000`

---

## Changing Backend IP Address

If the backend server IP changes, update the configuration:

### Step 1: Find the New IP Address

On the backend server laptop:

**Windows:**
```bash
ipconfig
```
Look for `IPv4 Address` under your active network adapter (Wi-Fi or Ethernet)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Step 2: Update Configuration File

Edit `src/config/apiConfig.js`:

```javascript
// Line 27: Update this constant
const BACKEND_IP = 'http://NEW_IP_ADDRESS:5000';
```

### Step 3: Restart Metro Bundler

```bash
# Stop Metro (Ctrl+C)
# Clear cache and restart
npm start -- --reset-cache
```

---

## Different Environment Configurations

### For Android Emulator

If running on Android Emulator (not physical device):

```javascript
// In src/config/apiConfig.js
const BACKEND_IP = 'http://10.0.2.2:5000';  // Special alias for host machine
```

### For iOS Simulator

If running on iOS Simulator:

```javascript
// In src/config/apiConfig.js
const BACKEND_IP = 'http://localhost:5000';
```

### For Remote Testing (ngrok)

If you need to test from a different network:

1. Install ngrok: https://ngrok.com/
2. On backend server, run:
   ```bash
   ngrok http 5000
   ```
3. Copy the https URL (e.g., `https://xxxx-xx-xx-xxx-xxx.ngrok.io`)
4. Update configuration:
   ```javascript
   // In src/config/apiConfig.js
   const BACKEND_IP = 'https://xxxx-xx-xx-xxx-xxx.ngrok.io';
   ```

---

## Troubleshooting

### Issue: "Cannot connect to server"

**Possible Causes:**
1. Backend server is not running
2. Devices are on different networks
3. Firewall is blocking connections
4. Wrong IP address

**Solutions:**

1. **Verify backend is running:**
   ```bash
   # On backend server
   netstat -an | findstr :5000
   ```
   Should show the server listening on port 5000

2. **Check network connectivity:**
   ```bash
   ping 10.236.250.182
   ```
   Should receive replies

3. **Check firewall settings:**
   - Windows: Allow Node.js through Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall
   - Add exception for port 5000

4. **Verify backend is listening on all interfaces:**
   In `backend/.env` or server configuration:
   ```
   HOST=0.0.0.0  # Not localhost or 127.0.0.1
   PORT=5000
   ```

### Issue: "Request timed out"

**Solutions:**
1. Increase timeout in `src/config/apiConfig.js`:
   ```javascript
   TIMEOUT: 30000,  // 30 seconds
   ```

2. Check network speed/stability

3. Verify backend is responding:
   ```bash
   curl -v http://10.236.250.182:5000/api/health
   ```

### Issue: App works on emulator but not on physical device

**Solution:**
- Emulator uses `10.0.2.2` (host machine alias)
- Physical device needs actual IP address (`10.236.250.182`)
- Make sure to update `apiConfig.js` when switching between emulator and physical device

---

## Network Requirements

### Both Devices Must Be:
- ✅ Connected to the same Wi-Fi network
- ✅ On the same subnet (e.g., `10.236.250.x`)
- ✅ Able to communicate (no network isolation)

### Backend Server Must:
- ✅ Be running on `0.0.0.0` (all interfaces), not `localhost`
- ✅ Have port 5000 open and accessible
- ✅ Not be blocked by firewall

### Mobile Device Must:
- ✅ Have network access
- ✅ Be able to reach backend IP
- ✅ Have correct API configuration

---

## Development Tips

### Enable Debug Logging

The app automatically logs API calls in development mode:

```
📤 API Request: POST /auth/login
✅ API Response: POST /auth/login - 200
❌ API Error: Network Error
```

Check Metro bundler console for these logs.

### Test API Connectivity

Before running the app, test the API:

```bash
# Test health endpoint
curl http://10.236.250.182:5000/api/health

# Test login endpoint
curl -X POST http://10.236.250.182:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Quick IP Switch Script

Create a script to quickly switch between configurations:

**switch-ip.js** (in project root):
```javascript
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/config/apiConfig.js');
const args = process.argv.slice(2);
const newIP = args[0];

if (!newIP) {
    console.log('Usage: node switch-ip.js <IP_ADDRESS>');
    process.exit(1);
}

let config = fs.readFileSync(configPath, 'utf8');
config = config.replace(
    /const BACKEND_IP = '.*';/,
    `const BACKEND_IP = 'http://${newIP}:5000';`
);
fs.writeFileSync(configPath, config);
console.log(`✅ Backend IP updated to: ${newIP}`);
```

Usage:
```bash
node switch-ip.js 10.236.250.182
```

---

## Security Notes

⚠️ **Important:** This configuration is for local development only.

For production:
- Use HTTPS (not HTTP)
- Use proper domain names (not IP addresses)
- Implement proper authentication and authorization
- Use environment variables for configuration
- Never commit sensitive credentials

---

## Support

If you continue to have issues:

1. Check Metro bundler console for errors
2. Check backend server logs
3. Verify network configuration with IT/network admin
4. Try using ngrok for testing

For more help, refer to:
- React Native Networking: https://reactnative.dev/docs/network
- Axios Documentation: https://axios-http.com/docs/intro
