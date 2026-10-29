# StaffSync — HR Management System (MERN)

A student capstone starter implementing a responsive HR dashboard with employee management, attendance, leave requests, announcements, training, and role-aware navigation.

## Stack
- React + Vite + Bootstrap + Axios + React Router
- Node.js + Express + Mongoose
- MongoDB, JWT, bcryptjs

## 1. Requirements
Install Node.js LTS and create a free MongoDB Atlas database (or use local MongoDB).

## 2. Configure backend
In a terminal:
```bash
cd server
copy .env.example .env
npm install
```
Open `server/.env` and set `MONGO_URI` to your MongoDB connection string and change `JWT_SECRET` to a long random value.

Run backend:
```bash
npm run dev
```
API runs on http://localhost:5000.

## 3. Configure frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## Demo accounts
Register a user through the Register screen. The first registered user is an employee. To test HR/Manager navigation, set the user's `role` to `hr` or `manager` in MongoDB for this student demo. In a real deployment, role assignment must be restricted to an authorized administrator.

## Included
- Register/login with bcrypt password hashing and JWT
- Role-aware dashboard navigation
- Employee CRUD (HR role)
- Mark attendance
- Apply for leave; HR/manager can approve/reject
- Announcements (HR can post)
- Training list and add training (manager/HR)
- Demo data fallback for a quick UI preview if API is unreachable

## Important
This is a capstone starter, not a production HR platform. Before real use, add stronger validation, audit logs, password reset, rate limiting, pagination, tests, and production secret management. Never publish `.env` or credentials.

## GitHub and Demo links
Create a GitHub repository and push this folder. For deployment, deploy the backend to Render (set environment variables) and frontend to Vercel (set `VITE_API_URL` to the backend URL + `/api`). A local URL is not a public Demo Link.
