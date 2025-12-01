<div align="center">
<h1 style="text-align:center;">AEGIS Security Dashboard</h1>

![PSIEM Dashboard](https://img.shields.io/badge/PSIEM-Security%20Dashboard-8b5cf6?style=for-the-badge)
![React](https://img.shields.io/badge/React-18+-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=for-the-badge&logo=typescript)

**A Modern Personal Security Information and Event Management System**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Team](#-team)

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running The Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Usage Guide](#-usage-guide)
- [Team](#-team)
- [License](#-license)

---

## 🎯 About The Project

**PSIEM (Personal Security Information and Event Management System)** is a comprehensive security management platform designed for on-the-go or at-home monitoring. This MVP prototype provides a clean, user-friendly interface for managing security events, monitoring system health, and analyzing potential threats.

### Why PSIEM?

- 🔒 **Centralized Security**: Monitor all security aspects from one dashboard
- 🎨 **Modern UI**: Beautiful dark theme with purple accents for reduced eye strain
- 📊 **Data Visualization**: Interactive charts and graphs for easy analysis
- 🤖 **AI Integration Ready**: Built with AI assistant capabilities in mind
- 🚀 **Scalable Architecture**: Modular design for easy feature additions

---

## ✨ Features

### Current MVP Features

#### 🏠 **Main Dashboard**
- Real-time security metrics display
- Threat activity timeline visualization
- Attack type distribution charts
- Recent security alerts feed
- System status overview

#### 🔐 **Password Manager**
- Secure password storage interface
- Search and filter capabilities
- Category-based organization
- Copy-to-clipboard functionality
- *Encryption integration coming soon*

#### 🛡️ **Intrusion Detection System (IDS)**
- **Signature-Based Detection**: Monitor known attack patterns
- **Anomaly-Based Detection**: ML-ready placeholder for unusual behavior detection
- Real-time alert feed with severity levels
- Source IP tracking and analysis

#### 📋 **Event Logs**
- Comprehensive log viewer
- Multi-criteria filtering (date, severity, type, source)
- Sortable and paginated log tables
- Export functionality (placeholder)
- *Elasticsearch integration ready*

#### 🤖 **AI Security Assistant**
- Interactive chat interface
- Security query assistance
- Threat analysis recommendations
- *LLM integration placeholder*

#### ❤️ **System Health Monitoring**
- Service status indicators
- Resource usage graphs (CPU, Memory, Network)
- Real-time health metrics
- *Prometheus/Grafana integration ready*

---

## 🛠️ Tech Stack

### Frontend Framework
- **React 18+** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling

### UI & Styling
- **shadcn/ui** - High-quality React components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### Data Visualization
- **Recharts** - Composable charting library

### Routing & State
- **React Router v6** - Client-side routing
- **TanStack Query** - Data fetching and caching

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type safety

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your computer:

### Required Software

1. **Node.js** (version 18.0.0 or higher)
   - Download from: https://nodejs.org/
   - We recommend the LTS (Long Term Support) version
   - Node.js includes npm (Node Package Manager)

2. **npm** (version 9.0.0 or higher) or **yarn**
   - Comes bundled with Node.js
   - Alternative: yarn (https://yarnpkg.com/)

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/downloads
   - Used to clone and manage the project

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB+ recommended)
- **Disk Space**: At least 500MB free space
- **Internet Connection**: Required for installation

---

## 🚀 Installation

### Step-by-Step Guide

#### Step 1: Verify Node.js and npm Installation

Open your terminal and check if Node.js and npm are installed:

```bash
node --version
# You should see: v18.17.0 or higher

npm --version
# You should see: 9.6.7 or higher
```

**If you don't see version numbers**, install Node.js from https://nodejs.org/

---

#### Step 2: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-team/psiem-dashboard.git

# Navigate into the project folder
cd psiem-dashboard
```

---

#### Step 3: Install Project Dependencies

```bash
npm install
```

**What's happening?**
- npm reads the `package.json` file
- Downloads all required packages from the npm registry
- Installs them in a folder called `node_modules`
- This may take 2-5 minutes depending on your internet speed

**Expected output:**
```
added 1234 packages, and audited 1235 packages in 2m
found 0 vulnerabilities
```

---

### Quick Start (For Experienced Developers)

```bash
# Clone the repository
git clone https://github.com/your-team/psiem-dashboard.git
cd psiem-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

---

## 🎮 Running The Application

### Development Mode

Start the development server with hot-reloading:

```bash
npm run dev
```

**What happens:**
1. Vite starts a local development server
2. Your browser should automatically open to http://localhost:5173
3. Any changes you make to the code will instantly appear in the browser

**Expected output:**
```
VITE v5.0.0  ready in 450 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

### Build for Production

Create an optimized production build:

```bash
npm run build
```

This creates a `dist` folder with optimized files ready for deployment.

### Preview Production Build

Test the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```
psiem-dashboard/
│
├── src/                        # Source code
│   ├── components/             # Reusable UI components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── dashboard/         # Dashboard-specific widgets
│   │   └── layout/            # Layout components
│   │
│   ├── pages/                 # Page components (routes)
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Login.tsx         # Login page
│   │   ├── PasswordManager.tsx
│   │   ├── IntrusionDetection.tsx
│   │   ├── EventLogs.tsx
│   │   ├── AIAssistant.tsx
│   │   └── SystemHealth.tsx
│   │
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   │
│   ├── lib/                   # Utilities and mock data
│   │   ├── utils.ts          # Helper functions
│   │   └── mockData.ts       # Mock data for prototype
│   │
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts          # Main types
│   │
│   ├── hooks/                 # Custom React hooks
│   │
│   ├── App.tsx               # Main App component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
│
├── public/                    # Static assets
├── index.html                # HTML entry point
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── README.md                 # This file!
```

### Key Directories Explained

#### 📂 `src/components/`
Contains all reusable React components. Organized by category for easy navigation.

#### 📂 `src/pages/`
Each file represents a route/page in the application. These are the main views users navigate between.

#### 📂 `src/lib/`
Mock data and utility functions used throughout the app.

#### 📂 `src/types/`
TypeScript type definitions that ensure type safety across the application.

---

## 🎯 Available Scripts

### `npm run dev`
**Starts the development server**
- Hot module replacement (instant updates)
- Runs on http://localhost:5173

```bash
npm run dev
```

### `npm run build`
**Creates production-ready build**
- Minifies and optimizes code
- Outputs to `/dist` folder

```bash
npm run build
```

### `npm run preview`
**Preview production build locally**

```bash
npm run preview
```

### `npm run lint`
**Check code for errors and style issues**

```bash
npm run lint
```

---

## 📚 Usage Guide

### First Time Setup

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Open your browser** to http://localhost:5173

3. **Login with demo credentials:**
   - Email: Any email (e.g., `admin@psiem.local`)
   - Password: Any password

   *(Mock authentication - accepts any credentials for prototype)*

### Navigation

The application has a sidebar with the following sections:

#### 🏠 Dashboard (Home)
- Overview of security metrics
- View recent alerts
- Check system status

#### 🔐 Password Manager
- Click "Add New Password" to create entries
- Use search bar to find passwords
- Click eye icon to reveal passwords
- Use copy button to copy to clipboard

#### 🛡️ Intrusion Detection
- Switch between signature-based and anomaly-based tabs
- View real-time security alerts
- Check severity levels (Critical, High, Medium, Low)

#### 📋 Event Logs
- Filter logs by date, severity, or source
- Click on log entries for details
- Use pagination to browse history

#### 🤖 AI Assistant
- Type security-related questions
- Get automated responses (mock for now)
- View conversation history

#### ❤️ System Health
- Monitor service status
- View resource usage graphs
- Check system metrics

---

## 👥 Team

This project is developed by:

- **Jocelyn** - User Login/Credentials, AI Assistance
- **Ebenezer** - UI Dashboard, User Login/Credentials
- **Abdulmuizz** - Password Manager, Intrusion Detection System, Event Logs
- **Farrukh** - AI Assistance, Event Logs
- **Muhammad** - UI Dashboard, AI Assistance
- **Kevin** - UI, Login/Authentication, Password Manager/Encryption, AI Assistant

---

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 PSIEM Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

### Made with ❤️ by the PSIEM Team

**[⬆ Back to Top](#️-psiem-security-dashboard)**

</div>
