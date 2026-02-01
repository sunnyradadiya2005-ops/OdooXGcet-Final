# Git Push Guide for React Native Mobile App

## ⚠️ IMPORTANT: Before Pushing

### 1. Review API Configuration
The file `src/config/apiConfig.js` contains your backend IP address (`10.236.250.182`). 

**Options:**
- **Option A (Recommended)**: Use environment variables
  - Create `.env` file (already in .gitignore)
  - Move IP to `.env`: `BACKEND_IP=http://10.236.250.182:5000`
  - Update `apiConfig.js` to read from env
  
- **Option B**: Keep as-is if this is a development-only repo
  - Current IP is a local network IP, relatively safe
  - But change it before deploying to production

### 2. Files That Will Be Committed

**Source Code:**
- ✅ `src/` - All your app source code
- ✅ `android/` - Android native configuration
- ✅ `ios/` - iOS native configuration
- ✅ Configuration files (package.json, babel.config.js, etc.)
- ✅ Documentation (README.md, MOBILE_SETUP.md, etc.)

**Excluded (in .gitignore):**
- ❌ `node_modules/` - Dependencies (will be installed via npm)
- ❌ `build/` - Build artifacts
- ❌ `.env` files - Environment variables
- ❌ Platform-specific build files

---

## 🚀 Git Commands to Push

### First Time Setup (if not already done)

```bash
cd d:\Project\KirayaKart\mobile\KirayaKartMobile

# Initialize git (if not already initialized)
git init

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/KirayaKart-Mobile.git
```

### Commit and Push

```bash
# Check what files will be committed
git status

# Add all files (respecting .gitignore)
git add .

# Commit with a descriptive message
git commit -m "feat: Add Razorpay payment integration and fix order flow

- Integrated Razorpay payment gateway with online and COD options
- Fixed CartScreen function parameters
- Created PaymentScreen with payment method selection
- Updated CheckoutScreen to navigate to payment flow
- Fixed order extraction to handle array response structure
- Added comprehensive error handling and logging
- Updated documentation (README, MOBILE_SETUP)"

# Push to GitHub
git push -u origin main
# OR if your branch is named 'master'
git push -u origin master
```

---

## 📋 Quick Checklist

Before pushing, verify:

- [ ] `.gitignore` is properly configured ✅ (Done)
- [ ] No sensitive data in committed files
- [ ] `node_modules/` is excluded ✅
- [ ] Build folders are excluded ✅
- [ ] README.md is up to date ✅
- [ ] All tests pass (if applicable)

---

## 🔐 Security Notes

**Current Configuration:**
- Backend IP: `10.236.250.182` (local network)
- This is relatively safe as it's not a public IP
- However, for production, use environment variables

**Sensitive Files Already Excluded:**
- `.env` files
- Keystore files (except debug.keystore)
- Local configuration files

---

## 📝 Recommended Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat: Implement Razorpay payment integration

- Added PaymentScreen with online and COD payment options
- Integrated react-native-razorpay package
- Fixed order creation and extraction flow
- Updated navigation to include payment screen

Closes #123
```

---

## 🎯 Next Steps After Push

1. **Create a README badge** (optional)
2. **Set up GitHub Actions** for CI/CD (optional)
3. **Add branch protection rules** (recommended)
4. **Create a .env.example** file to show required environment variables

---

## ⚡ Quick Commands Reference

```bash
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Your message"

# Push
git push

# View commit history
git log --oneline

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
```
