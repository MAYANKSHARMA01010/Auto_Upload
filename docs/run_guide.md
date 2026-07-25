# How to Run ClipScheduler (Local & Global ngrok Setup)

This guide explains how to start and run the entire ClipScheduler suite (Backend + Frontend) and expose it globally using your permanent ngrok domain.

---

## 🏗️ Architecture Overview

```text
               Global Users / Social Media OAuth Callbacks
                                   │
                                   ▼
          https://playgroup-pesticide-passport.ngrok-free.dev (ngrok Tunnel)
                                   │
                                   ▼
                 Local Next.js Frontend (Port 3000)
                                   │
                       (Next.js Proxy Rewrites)
                                   │ /api/*
                                   ▼
                 Local FastAPI Backend (Port 8000)
```

- **Frontend & Backend**: Both managed by a single launcher script (`scripts/dev.sh`).
- **Path-Based Routing**: Next.js automatically proxies all `/api/*` requests to port 8000, allowing a single domain (`https://playgroup-pesticide-passport.ngrok-free.dev`) to serve both the web UI and OAuth callbacks seamlessly.

---

## ⚡ Daily Development Workflow (2 Terminals)

To run the project, open **2 separate Terminal windows** on your Mac:

### 1. Terminal 1 — Start App Suite (Backend + Frontend)

Run the master launcher command in the project root:

```bash
pnpm run dev
```

#### What `pnpm run dev` does automatically:
1. 🧹 **Port Cleaner**: Checks and frees occupied ports (`3000` and `8000`).
2. 🐍 **Python Environment**: Activates virtualenv (`.venv`), installs missing pip packages.
3. 📦 **Frontend Check**: Verifies Node.js & Next.js dependencies.
4. 🚀 **Concurrently Launcher**: Starts **FastAPI (8000)** and **Next.js (3000)** simultaneously with live reloading.

---

### 2. Terminal 2 — Start Global Tunnel (ngrok)

Run the ngrok command with your permanent static domain:

```bash
ngrok http --url=playgroup-pesticide-passport.ngrok-free.dev 3000
```

#### What this command does:
- Exposes your local port `3000` to the internet.
- Connects your permanent URL: `https://playgroup-pesticide-passport.ngrok-free.dev`.
- Routes incoming OAuth login callbacks directly to your Mac.

---

## 🌐 How to Access Your App

Once both terminals are running, you can access ClipScheduler from anywhere:

| Access Mode | URL | Purpose |
| :--- | :--- | :--- |
| **Local Mac Access** | `http://localhost:3000` | Fast local frontend editing & testing |
| **Global / Any Device** | `https://playgroup-pesticide-passport.ngrok-free.dev` | Test from mobile, share with users, OAuth logins |

---

## 🔑 One-Time Prerequisites Setup

If setting up on a new Mac or reset machine:

1. **Install ngrok**:
   ```bash
   brew install ngrok
   ```

2. **Add Your ngrok Authtoken**:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```
   *(Retrieve token from [ngrok Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken))*

3. **Meta App Role Note (Instagram / Facebook / Threads)**:
   - When Meta App is in **Development Mode**, only added **Instagram Testers** or **Developers** can log in.
   - Go to [Meta Developers Portal](https://developers.facebook.com) -> App -> **App roles** -> **Roles** -> Add Instagram Testers.
   - Or toggle App Mode to **Live** to allow any Instagram account to log in!

---

## 🛠️ Useful Commands

```bash
# Check if ports 3000 or 8000 are occupied
lsof -i :3000
lsof -i :8000

# Stop all running processes
Ctrl + C (in both Terminal 1 and Terminal 2)
```
