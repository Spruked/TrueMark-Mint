# 🔧 TrueMark Payment Setup Guide

## 📋 What You Need to Provide

### 1. 🏦 **Square Account Information**
To connect your Square payment processing:

```
Square Developer Dashboard: https://developer.squareup.com/
1. Sign in to your Square account
2. Go to "My Applications" 
3. Create new app or use existing
4. Copy these values:
   • Application ID (starts with sq0idb-)
   • Location ID (starts with L)
```

### 2. 💳 **MetaMask Wallet Addresses**
Your crypto receiving wallets:

```
MetaMask Browser Extension:
1. Open MetaMask
2. Click on account name to copy address
3. Polygon Address: 0x... (42 characters)
4. Ethereum Address: 0x... (same or different wallet)
```

---

## 🔐 **Configuration Steps**

### Step 1: Update Your `.env` File
Replace the placeholder values in `.env`:

```bash
# Square Payment Configuration
SQUARE_APPLICATION_ID=sq0idb-YOUR_ACTUAL_APP_ID_HERE
SQUARE_LOCATION_ID=YOUR_ACTUAL_LOCATION_ID_HERE
SQUARE_ENVIRONMENT=sandbox

# Your Crypto Wallet Addresses  
POLYGON_WALLET_ADDRESS=0xYOUR_ACTUAL_POLYGON_ADDRESS_HERE
ETHEREUM_WALLET_ADDRESS=0xYOUR_ACTUAL_ETHEREUM_ADDRESS_HERE

# Business Information
BUSINESS_NAME=TrueMark LLC
BUSINESS_EMAIL=bryan@truemark.com
BUSINESS_PHONE=your_actual_phone_number
```

### Step 2: Test Configuration
Open browser console on your mint page and run:
```javascript
CONFIG_LOADER.isProductionReady()
// Should return true when properly configured
```

### Step 3: Test Payments
1. **Crypto Test**: Use Polygon testnet first
2. **Card Test**: Use Square sandbox mode
3. **Switch to Production**: Change `SQUARE_ENVIRONMENT=production`

---

## 📊 **Square Account Setup Details**

### Getting Your Square Credentials:

1. **Go to Square Developer Portal**
   - URL: https://developer.squareup.com/
   - Sign in with your Square business account

2. **Create or Select Application**
   - Click "Create Application" or use existing
   - Name it "TrueMark Payments" or similar

3. **Get Application ID**
   - Look for "Application ID" in app settings
   - Starts with `sq0idb-` (sandbox) or `sq0idp-` (production)
   - Copy the full ID

4. **Get Location ID**
   - Go to "Locations" tab in your app
   - Copy the Location ID (starts with `L`)
   - This identifies which business location receives payments

5. **Sandbox vs Production**
   - Start with `sandbox` for testing
   - Switch to `production` when ready for real payments

---

## 💰 **MetaMask Wallet Setup**

### For Receiving Payments:

1. **Polygon Wallet (Recommended)**
   - Low fees (~$0.01 per transaction)
   - Fast confirmations
   - Perfect for $49.95 payments

2. **Ethereum Wallet (Premium)**
   - Higher fees (~$12+ per transaction)  
   - Maximum security
   - Better for high-value payments

3. **Wallet Security**
   - Use a dedicated business wallet
   - Keep small amounts for testing
   - Backup your seed phrase securely

---

## 🚀 **Quick Start Checklist**

- [ ] Get Square Application ID from developer.squareup.com
- [ ] Get Square Location ID from your app settings  
- [ ] Copy your MetaMask wallet address(es)
- [ ] Update all values in `.env` file
- [ ] Test configuration: `CONFIG_LOADER.isProductionReady()`
- [ ] Test a small payment on testnet/sandbox
- [ ] Switch to production when ready

---

## ❓ **Need Your Specific Info**

**Send me these when ready:**

```
Square Application ID: sq0idb-XXXXXXXXX
Square Location ID: LXXXXXXXXX
Polygon Wallet: 0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Ethereum Wallet: 0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Phone Number: +1-XXX-XXX-XXXX
```

I'll update the configuration files with your real values and remove all placeholders! 🎯