# 🛒 KirayaKart - Rental Marketplace System

> **Team Number: 65**

## 👥 Team Members

| Role | Name |
|------|------|
| **Team Leader** | **Sunny Radadiya** |
| Member | Aayush Tilva |
| Member | Veer Bhalodiya |
| Member | Jenil Sutariya |

---

## 📖 Project Overview

**KirayaKart** is a comprehensive rental marketplace platform that connects rental service providers (vendors) with customers. It solves the problem of buying expensive items for short-term use by offering a seamless rental experience. The project consists of a feature-rich **Web Application** for full management and a distinct **Mobile Application** for on-the-go customer access.

### 🌐 Web Application (Primary Platform)
The web platform is the core of KirayaKart, offering extensive features for:
- **Customers**: Browse products, manage cart, place rental orders, and track history.
- **Vendors**: Manage inventory, track rentals, generate invoices, and view analytics.
- **Admins**: oversee user activity and platform management.

### 📱 Mobile Application (Secondary Platform)
A customer-focused Android app built with React Native for browsing and quick ordering.

---

## 🛠️ Tech Stack

### **Frontend (Web Client)**
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Icons**: Lucide React

### **Backend (Server)**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon DB)
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer

### **Mobile App**
- **Framework**: React Native
- **Navigation**: React Navigation
- **Payments**: Razorpay Integration

---

## ✨ Key Features

### **Web Platform**
- **Dual Role Registration**: Sign up as a Customer or Vendor.
- **Role-Based Dashboards**:
  - *Vendor*: Inventory management, Earnings reports, Order processing.
  - *Customer*: Wishlist, Order history, Profile settings.
- **Product Management**: Upload products with images, set descriptions, and rental rates.
- **Advanced Search**: Filter by category, price, and availability.
- **Cart & Checkout**: Select rental dates (Start/End), auto-calculate rent, and secure checkout.
- **Invoicing System**: Auto-generate invoices for orders.

### **Mobile App**
- **On-the-Go Browsing**: Optimized for mobile screens.
- **Touch-Friendly Interface**: Easy date selection and cart management.
- **Secure Payments**: Integrated Razorpay for online transactions and COD support.
- **Real-time Order Status**: View current order progress.

---

## 🚀 Installation & Setup Guide

Follow these steps to set up the entire project locally.

### 1. Backend Setup
The backend serves both the Web and Mobile clients.

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables (.env)
# Create a .env file with DATABASE_URL, JWT_SECRET, Port, etc.

# Run Database Migrations
npx prisma generate
npx prisma db push

# Start the Server
npm start
```

### 2. Frontend (Web) Setup

```bash
cd client/vite-project

# Install dependencies
npm install

# Start the Development Server
npm run dev
```
*Access the web app at `http://localhost:5173`*

### 3. Mobile App Setup

```bash
cd mobile/KirayaKartMobile

# Install dependencies
npm install

# Start Metro Bundler
npx react-native start

# Run on Android Device/Emulator
npx react-native run-android
```

---

## 📄 License

This project is developed by **Team 65** for the **OdooXGcet-Final** project.
All rights reserved.
