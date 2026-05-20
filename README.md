# SJMPc Payroll & Attendance (Full Stack)

A full-stack web app with:
- Admin portal: manage employees, enter attendance (check-in/check-out), generate payroll for 15-day periods, export CSV
- Employee portal: view own attendance and payroll history

## Tech
- Server: Node.js + Express + SQLite (JWT auth)
- Client: React (modern UI with side menu)

## Seed Admin Account
- Email: `admin@example.com`
- Password: `admin123`

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Run dev
```bash
npm run dev
```

This should run:
- Server API
- Client UI

## Notes
- Attendance/payroll MVP uses a simple overtime calculation.

