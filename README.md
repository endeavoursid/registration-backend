---

# 📄 README.md — **Backend Repository**

```md
# Registration Backend

This repository contains the **backend API** for the Registration System.
It is a **Node.js (Express)** application running inside **Docker**.

The backend exposes REST APIs consumed by the frontend service.

---

## 🧠 Architecture Overview

Frontend (Browser / Nginx)
↓ /api/*
Backend API (Node.js)


- Backend runs on **port 5000**
- Frontend connects via environment variables

---

## 📦 Repository

Backend Repository:
https://github.com/endeavoursid/registration-backend

Frontend Repository:
https://github.com/endeavoursid/registration-frontend

---

## ✅ Prerequisites

Ensure the following are installed:

### 1. Git
```bash
git --version
2. Docker & Docker Compose
```bash
docker --version
docker compose version

**📥 Step 1 — Clone the repository**

git clone https://github.com/endeavoursid/registration-backend.git
cd registration-backend
**⚙️ Step 2 — Configure environment variables**
Create a local environment file:

```bash
cp backend/.env.example backend/.env
Edit backend/.env:

env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=StrongPasswordHere
DB_NAME=registration

FRONTEND_URL=http://localhost
.env is local only and must never be committed.

**▶️ Step 3 — Run backend using Docker**
bash
Copy code
docker compose -f root/docker-compose.backend.yml up --build -d
**🔍 Step 4 — Verify backend**
Check running containers:

```bash
docker ps
Test health endpoint:

```bash
curl http://localhost:5000/health
Expected response:

```json
{
  "status": "ok"
}
🛑 Stop the backend
```bash
docker compose -f root/docker-compose.backend.yml down
🚨 Common Issues
Port already in use
Change PORT in .env

Update docker-compose.backend.yml if needed

CORS errors
Ensure .env contains:

env
FRONTEND_URL=http://localhost
Restart backend after changes.

📁 Project Structure (Simplified)
```bash
Copy code
backend/
├── Dockerfile
├── src/
├── .env           (local only)
└── .env.example
**🔐 Security Notes**
.env files are ignored by Git

node_modules is not committed

Secrets are injected at runtime

Docker ensures environment consistency

🏁 Summary
✔ Dockerized Node.js backend
✔ Clean API separation
✔ Secure environment handling
✔ Ready for frontend integration

markdown
Copy code
