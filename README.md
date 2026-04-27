# ☕ Cafe Kachino: Professional POS Ecosystem

**Cafe Kachino** is a high-density, cloud-synced Point of Sale (POS) and Enterprise Resource Planning (ERP) system designed for boutique coffee shops and retreat spaces. Built with a "Fluid Scaling" architecture, it provides a premium, terminal-first experience for high-traffic operations.

---

## 🚀 Core Features

### 🛒 Intelligent POS Terminal
- **Dine-In & Takeaway**: Full floor plan management with table session tracking.
- **Dynamic Categories**: Instant menu filtering with "All" prioritized navigation.
- **Loyalty Integration**: Real-time point calculation and redemption for repeat patrons.
- **Fluid Checkout**: Support for multi-method payments with automated receipt generation.

### 📊 Business Intelligence & Fiscal Auditing
- **Trend Analytics**: Real-time Revenue vs. Expense charts with Daily, Weekly, and Monthly granularity.
- **Daily Z-Report**: One-click shift settlement with physical print capabilities for drawer reconciliation.
- **Expense Velocity**: Granular tracking of business overheads with dynamic category management.
- **Audit Logging**: Comprehensive traceability for every administrative action and POS transaction.

### 🛡️ Enterprise Security & Management
- **High-Security Mode**: Automated PIN lock after every sale to prevent unauthorized access.
- **Terminal Isolation**: Local persistent state with Supabase cloud synchronization for multi-terminal consistency.
- **Inventory Resilience**: Automated stock tracking with low-stock alerts and "Resilience Indicators."
- **Staff Control**: PIN-protected administrative actions and role-based access.

---

## 🛠️ Technical Architecture

- **Frontend**: React 18 with Vite for ultra-fast HMR.
- **State Management**: Zustand with persistence middleware and custom localStorage obfuscation.
- **Backend**: Supabase (PostgreSQL) for real-time cloud synchronization.
- **UI/UX**: Custom "Compact Fluid Scaling" system using CSS `clamp()` and Vanilla CSS.
- **Animations**: Framer Motion for premium micro-interactions.
- **Icons**: Lucide React for consistent visual language.

---

## 📖 Operational Guide

### 1. Daily Operations (Staff)
- **Login**: Enter your unique 4-digit PIN to access the terminal.
- **POS**: Select items from the menu. Tap "Dine-In" to assign to a table or "Takeaway" for quick checkout.
- **Points**: Search for a customer by phone or name to apply loyalty points (1 point per $1000 spent).
- **Checkout**: Choose Cash/Card. The system will automatically revert to the Lock Screen if "High Security" is enabled.

### 2. Administrative Tasks (Admin Only)
- **Dashboard**: Access analytics via the sidebar. Use the Z-Report at end-of-shift to settle the drawer.
- **Inventory**: Add/Edit products and categories. Monitor "Critical" alerts for low stock.
- **Expenses**: Log business overheads. These will reflect instantly in the Dashboard's profit calculations.
- **Settings**: Adjust tax rates, currency, and toggle High Security Mode.

### 3. Shift Settlement (Z-Report)
- Navigate to **Dashboard**.
- Click **"Close Register"**.
- Review the daily summary.
- Click **"Print Report"** for a physical audit copy.

---

## 🎨 Design System
Cafe Kachino follows a **"Compact Fluid"** design philosophy:
- **Density**: 8px-12px padding scales to maximize information on 10" - 15" POS terminals.
- **Aesthetic**: #080808 (Deep) background with #d4af37 (Gold) accents for a premium "retreat" feel.
- **Typography**: Outfit for UI readability and Playfair Display for branding elements.

---

*Developed for Cafe Kachino — Read • Sip • Retreat*
