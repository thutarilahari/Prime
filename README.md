# Delta Learning Platform

A local AI-powered video learning platform for the **Delta** web development course.

---

## 🚀 Quick Start

### Every Day Usage
Double-click **"Delta Learning Platform"** on your Desktop → Done!

The app automatically:
1. Starts the backend server (port **3001**)
2. Starts the frontend client (port **5173**)
3. Opens your browser to **http://localhost:5173**

---

## ⚙️ One-Time Setup (Run Once)

The launcher files have been added on top of the existing app. No existing functionality was changed.

### Step 1 – Create the Desktop Shortcut
Open PowerShell in the project folder and run:
```powershell
powershell -ExecutionPolicy Bypass -File create-shortcut.ps1
```
This creates the **"Delta Learning Platform"** shortcut on your Desktop with the custom icon.

### Step 2 – You're Done!
Double-click the Desktop icon anytime to launch the full app.

---

## 📁 Project Structure

```
LEARNER/
├── server/               ← Express backend (port 3001)
│   ├── index.js
│   ├── db.js
│   ├── scanner.js
│   └── aiService.js
├── src/                  ← React frontend (Vite, port 5173)
│   ├── components/
│   ├── context/
│   └── ...
├── package.json          ← npm scripts (dev, client, server)
├── vite.config.js        ← Frontend config (port 5173)
│
│ ── LAUNCHER FILES (added, no app changes) ──
├── Start-Learning-App.bat   ← One-click launcher
├── create-shortcut.ps1      ← Run once to create Desktop shortcut
├── create-icon.ps1          ← Run once to generate icon file
└── app-icon.ico             ← Desktop shortcut icon
```

---

## 🔧 Manual Launch (Fallback)

If the Desktop shortcut doesn't work, launch manually:

```bash
# In the LEARNER project folder:
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🐛 Troubleshooting

### "Site can't be reached" / ERR_CONNECTION_REFUSED
The servers aren't running. Double-click `Start-Learning-App.bat` and wait ~5 seconds.

### Port already in use
If another process is using port 5173 or 3001, stop it first:
```powershell
# Find what's using port 3001
netstat -ano | findstr :3001
# Kill it (replace PID with the number shown)
taskkill /PID <PID> /F
```

### Node.js not found
Install Node.js from [nodejs.org](https://nodejs.org/) and restart your computer.

### npm install fails
Make sure you have internet access. Run manually:
```bash
cd C:\Users\valla\OneDrive\Desktop\LEARNER
npm install
```

---

## 🎯 Features

- 🎬 **Local Video Player** – Stream and watch your Delta course videos
- 📚 **Course Structure** – Automatically scanned lesson tree with sections
- ✅ **Progress Tracking** – Checkmarks, watch positions saved locally
- 📝 **Notes** – Per-lesson notes editor
- 🤖 **AI Summaries & Quiz** – Lesson summaries and practice questions
- 🎭 **Theatre Mode** – Fullscreen-width player like YouTube
- ⏱️ **Resume Toast** – "Stopped at X:XX" notification on refresh
- 🌙 **Dark/Light Mode** – Theme toggle

---

## 🔑 Ports

| Service   | Port | URL                      |
|-----------|------|--------------------------|
| Frontend  | 5173 | http://localhost:5173    |
| Backend   | 3001 | http://localhost:3001    |

---

*Launcher layer added on top of existing project — no functional changes to app code.*
