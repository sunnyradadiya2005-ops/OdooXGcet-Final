# 📱 KirayaKart Mobile App

> **Team Number: 65**

## 👥 Team Members

| Role | Name |
|------|------|
| **Team Leader** | **Sunny Radadiya** |
| Member | Aayush Tilva |
| Member | Veer Bhalodiya |
| Member | Jenil Sutariya |

---

## 📖 About The Project

**KirayaKart** is a comprehensive rental marketplace application designed to bridge the gap between rental service providers and customers. This mobile application serves as the customer-facing platform, allowing users to browse, rent, and manage items seamlessly.

### 🌟 Key Features

- **User Authentication**: Secure Login and Registration system.
- **Product Browsing**: Browse rental items by category or search for specific products.
- **Detailed Product Views**: View high-quality images, descriptions, rental rates, and availability.
- **Cart Management**: Add items to cart, select rental dates, and manage quantities.
- **Secure Checkout**: Integrated **Razorpay** payment gateway for secure online transactions.
- **Cash on Delivery**: Flexible payment options including COD.
- **Order Management**: Track current orders and view past rental history.
- **Profile Management**: Manage user profile and preferences.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (Javascript)
- **Navigation**: React Navigation (Stack & Tab authentication flows)
- **State Management**: React Context API
- **Styling**: StyleSheet with custom theme constants
- **Networking**: Axios for API communication
- **Payments**: Razorpay Integration
- **Backend**: Node.js & Express (Connected REST API)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- Java Development Kit (JDK 17)
- Android Studio & Android SDK
- React Native CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd KirayaKartMobile
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - The app comes with a default configuration in `src/config/apiConfig.js`.
   - Ensure your backend server is running and reachable.
   - For production, create a `.env` file based on `.env.example`.

### Running the App

1. **Start the Metro Bundler**
   ```bash
   npx react-native start
   ```

2. **Run on Android**
   ```bash
   npx react-native run-android
   ```

3. **Run on iOS** (macOS only)
   ```bash
   npx react-native run-ios
   ```

---

## 📂 Project Structure

```
src/
├── components/    # Reusable UI components (Buttons, Inputs, Cards)
├── config/        # App configuration & API setup
├── context/       # Global state (Auth, Cart)
├── navigation/    # Navigation setup (Stacks, Tabs)
├── screens/       # Application screens (Home, Cart, Payment, etc.)
├── services/      # API service layer
├── utils/         # Helper functions & formatters
└── constants/     # Theme, Colors, and Typography
```

---

## 📸 Screen Previews

- **Home Screen**: Featured rentals and categories.
- **Product Details**: Calander selection for rental periods.
- **Cart**: Calculation of rent based on days.
- **Payment**: Razorpay and COD options.
- **Orders**: Status tracking.

---

## 📜 License

This project is developed by **Team 65** for the purpose of the **OdooXGcet-Final** project. All rights reserved.
