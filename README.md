# 🚀 Korvil TaskFlow

**Smart Task Management for Teams** — Built for Korvil internship team to track, assign, and manage tasks with role-based access control and real-time analytics.

![Korvil TaskFlow](public/korvil-logo.png)

## ✨ Features

### For Admin (Founder)
- ✅ **Assign tasks** to employees with title, description, and assignee
- ✅ **Track all tasks** across the entire team
- ✅ **Edit & delete any task** regardless of who created it
- ✅ **View analytics** — daily, weekly, monthly with charts
- ✅ **Manage team** — add/remove employees by email
- ✅ **Admin management** — primary admin can add/remove other admins
- ✅ **View personal to-dos** of any employee

### For Employees
- ✅ **View assigned tasks** — see tasks assigned by founder
- ✅ **Mark tasks complete** — checkbox with strikethrough animation
- ✅ **Create personal to-dos** — private task list (visible to admin)
- ✅ **Edit own tasks** — edit tasks you created (not founder-assigned)
- ✅ **Delete own tasks** — delete tasks you created (not founder-assigned)
- ✅ **Personal analytics** — track your own performance

### Authentication
- 📧 Email/Password sign-in
- 🔑 Google Sign-In
- 🔒 Only pre-registered employees can access the system

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (Custom Design System) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore (Real-time) |
| Charts | Recharts |
| Icons | React Icons (Feather) |
| Dates | date-fns |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Firebase project with Auth and Firestore enabled

### 1. Clone & Install
```bash
cd Korvil-TaskFlow
npm install
```

### 2. Configure Firebase
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Firebase Setup
In your Firebase Console:
1. **Enable Authentication** → Sign-in methods:
   - Email/Password ✅
   - Google ✅
2. **Create Firestore Database** → Start in production mode
3. **Set Firestore Rules** (see below)

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (isAdmin() || resource.data.createdBy == request.auth.uid);
      allow delete: if request.auth != null && 
        (isAdmin() || resource.data.createdBy == request.auth.uid);
    }
    
    // Registered employees
    match /registered_employees/{email} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 5. Run the App
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 6. First Login
The following admin emails are pre-configured:
- `janaganmeenambikai@gmail.com` (Primary Admin — can manage other admins)
- `mithunsabari.rms@gmail.com` (Admin — for testing)

Sign in with one of these emails (via Google or email/password sign-up).

## 📁 Project Structure
```
src/
├── components/
│   ├── Auth/          → Login, ProtectedRoute
│   ├── Dashboard/     → Main dashboard with stats
│   ├── Tasks/         → TaskList, TaskCard, TaskForm, PersonalTodos
│   ├── Analytics/     → Charts and performance metrics
│   ├── Users/         → UserManagement, AdminSettings
│   ├── Common/        → ConfirmDialog
│   └── Layout/        → Sidebar, Layout shell
├── contexts/          → AuthContext, ToastContext
├── firebase/          → Firebase configuration
├── hooks/             → useTasks, useUsers, useAnalytics
├── utils/             → Permission helpers
└── styles/            → Design system CSS
```

## 🔐 Permission Matrix

| Action | Admin | Employee |
|--------|:-----:|:--------:|
| View own tasks | ✅ | ✅ |
| View all tasks | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Assign to others | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ |
| Edit admin tasks | ✅ | ❌ |
| Delete own tasks | ✅ | ✅ |
| Delete admin tasks | ✅ | ❌ |
| Mark complete | ✅ | ✅ |
| View analytics | ✅ (all) | ✅ (own) |
| Manage users | ✅ | ❌ |
| Manage admins | 👑 Primary only | ❌ |

## 📄 License
Built with ❤️ for Korvil
