# Laboratory Inventory Management System (IMS)

A modern, secure, and role-based inventory management system designed for high-throughput laboratories. This system handles asset tracking, procurement lifecycles, and audit compliance with strict data integrity enforcement.

## 🚀 Core Features

### 📦 Inventory Management
*   **Asset Tracking**: Real-time tracking of chemical reagents and equipment.
*   **Stock Take Tool**: Specialized interfaces for stock audits.
    *   **Admin Mode**: Full physical audit capabilities.
    *   **Researcher Mode**: Restricted to "Utilisation Reporting" only.
*   **Expiry Alerts**: Automated visual indicators for expiring or low-stock items.

### 📝 Procurement & Orders
*   **Batch Operations**: Create Purchase Orders or Audit Batches for multiple items simultaneously.
*   **Procurement Lifecycle**:
    *   `Requested` → `Received` → `Finalised`
*   **PDF Generation**: Professional Purchase Order export for vendors (powered by `react-to-print`).
*   **Reconciliation**: Built-in "Requested vs. Received" discrepancy tracking.

### 🛡️ Security & RBAC
*   **Role-Based Access Control**:
    *   **Admins**: Full control over assets, users, and approvals.
    *   **Researchers**: View-only access to registry; can report usage but cannot alter core records.
*   **Strict Session Integrity**:
    *   **No Ghost Users**: Backend strictly validates every write operation against the live database.
    *   **Forced Logout**: Client automatically forces re-authentication if a session becomes stale or invalid (e.g., deleted user).
*   **Audit Trail**: Immutable logs for every stock movement, tagged with the initiating user and reason context.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Database**: MongoDB (via Mongoose)
*   **Authentication**: NextAuth.js (Custom Credentials Provider)
*   **Styling**: Vanilla CSS with modern tokens / Glassmorphism UI
*   **Icons**: Lucide React
*   **PDF Engine**: React-to-Print

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-org/ims.git
    cd ims
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    Create a `.env` file in the root directory:
    ```env
    MONGODB_URI=mongodb://localhost:27017/ims
    NEXTAUTH_SECRET=your_super_secret_key
    NEXTAUTH_URL=http://localhost:3000
    ```

4.  Seed the Database (Optional):
    ```bash
    npm run seed
    ```

5.  Run Development Server:
    ```bash
    npm run dev
    ```

## 📂 Project Structure

*   `/app`: Next.js App Router pages and API endpoints.
*   `/components`: Reusable UI components (Navbar, PO Template, etc.).
*   `/models`: Mongoose database schemas (User, Item, Order, UsageLog).
*   `/lib`: Utility functions (Auth, DB Connect).

## 🔒 Security Best Practices

This project implements a **"Trust No One"** architecture for session management.
*   API endpoints do not trust the JWT token alone; they verify the user's existence in the database for every state-changing request.
*   Orphaned sessions are aggressively completely invalidated to prevent data corruption.
