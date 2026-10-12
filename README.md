 # Panda Infotech HRMS

🐼 **Panda HRMS: Human Resource Management Dashboard**

## 1. Project Overview

Panda HRMS is a responsive web dashboard for managing attendance, employees and tasks. It gives HR staff and managers a company-wide view, and gives employees a personal view where they punch in and out and track their tasks.

The platform has two views:

- Admin Mode for Admin, HR and Manager roles.
- Employee View for employees.

Admin can:
- See the live shift monitor (punched in, late punches, on leave)
- See key numbers (present today, active projects, pending leaves, monthly payroll)
- See the employee roster with punch times, logged hours, salary and status
- Search, and read notifications

Employees can:
- Punch in and punch out
- See their punch times and live logged hours
- See leaves taken
- See assigned tasks and a task progress chart
 
## 2. Objectives

Main goals of the system:

- Provide one dashboard for daily attendance and HR numbers
- Give employees a simple way to punch in and out
- Show tasks and progress in one place
- Support light and dark themes
- Work on desktop, tablet and mobile
- Keep the code ready for a separate backend developer to connect

## 3. Technology Stack

Frontend: React.js + Vite + Tailwind CSS 4
Routing: React Router DOM 
Icons: Lucide React
State Management: React hooks (useState, useEffect) and Router Outlet context
 
## 4. System Architecture

 
Client (React + Vite)
      ↓
REST API (Express server)      
      ↓
Database (MySQL)               
 
### 5.1 Admin / HR / Manager (Admin Mode)
Can:
- View the shift monitor and key numbers
- View the employee roster
- Use the search bar and notification bell

### 5.2 Employee (Employee View)
Can:
- Punch in and punch out
- View own punch times, logged hours and leaves taken
- View own tasks and task progress

> The Admin / Employee switch in the sidebar is manual for now. After login is added, the role from the login decides which view a person gets.

## 6. Functional Requirements

| # | Feature | Status |
| 6.1 | Dashboard overview (shift monitor and four number cards) 
| 6.2 | Punch In / Punch Out with live logged hours 
| 6.3 | Employee roster table with filter tabs 
| 6.4 | My Tasks and Task Progress chart 
| 6.5 | Notifications bell 
| 6.6 | Light / dark theme, saved between visits 
  
## 7. Frontend Pages

The app is one page with two views.

Dashboard 
- Admin Mode view
- Employee View

## 8. Dashboard Sections

### Admin Mode
- Company Shift Monitor (clock, Punched In, Late Punches, On Leave, Export Daily CSV)
- Present Today
- Active Projects
- Pending Leaves
- Monthly Payroll
- Employee table (tabs: All, Present, On Leave; View All button)

### Employee View
- Company Shift Monitor (clock, Punch In, Punch Out)
- Punch In time
- Punch Out time
- Logged Hours
- Leaves Taken
- My Tasks
- Task Progress (donut chart)

## 9. Folder Structure

frontend
|
|-- public
|
|-- src
|   |
|   |-- components
|   |   |-- Layout.jsx            (sidebar, top bar, theme toggle)
|   |   |-- EmployeeTable.jsx     (employee roster table)
|   |
|   |-- pages
|   |   |-- Dashboard.jsx         (Admin Mode and Employee View)
|   |
|   |-- App.jsx                   (routes)
|   |-- index.css                 (theme variables, shared classes)
|   |-- main.jsx                  (React + router start)
|
|-- index.html
|-- package.json
|-- vite.config.js

## 10. Dashboard counters
- present, total, pendingLeaves,   
- MonthlyPayroll, projects, departments, teams
 
## 11. Shift monitor counters 
- total, checkedIn, late, approvedLeaves, percentage, 

## 12. Employee row
- id, employee_code, name, designation, department, salary,
- check_in, check_out, working_hours, attendance_status, remarks

## 13. Notification
- id, message, is_read

## 15. Getting Started

Requirements: Node.js 

npm install & all dependancies install
npm run dev   

# Panda Infotech HRMS: Backend and Database



🐼 Panda HRMS API: Node.js + Express + MySQL

## 1. Project Overview

This is the backend and database side of the Panda HRMS dashboard. It is a REST API built with Node.js and Express that reads and writes a MySQL database. The React frontend (see the frontend `README.md`) talks to it through HTTP requests.

The system will serve two kinds of people:

- Admin / HR / Manager: company-wide attendance, employee roster, key numbers
- Employee: own punch in and out, own tasks,


 own leave count

**Current status**

| Part | Status |
|---|---|
| Express server (starts, CORS, JSON, error handler) | Done |
| MySQL connection (`config/db.js`) | Done |
| Database `hrms` with the `notifications` table | Done |
| Login and roles | Planned |
| Dashboard, employees, attendance, tasks, notifications APIs | Planned |

The server runs today with no routes. Everything marked "planned" in this document is a design for the next developer to build.

## 2. Objectives

- Store HRMS data safely in MySQL
- Provide a REST API that the existing frontend can use without changes
- Record daily attendance (punch in, punch out, logged hours)
- Provide counters for the dashboard
- Protect data with login and role checks
- Keep the code simple to extend, one module at a time

## 3. Technology Stack

**Runtime:** Node.js 20 or newer (ES modules)
**Framework:** Express.js 4
**Database:** MySQL or MariaDB, using the `mysql2` driver
**Config:** `dotenv`
**Cross-origin:** `cors`
**Async error handling:** `express-async-errors`
**Authentication (planned):** `jsonwebtoken` (JWT) and `bcrypt`
**Local database tool:** XAMPP (MariaDB 10.4) with phpMyAdmin
**API testing:** Postman

## 4. System Architecture

**Architecture type:** three-layer architecture

```
Client (React frontend)
      ↓  HTTP + JSON
REST API (Express server)
      ↓  mysql2 connection pool
Database (MySQL / MariaDB)
```

**Flow**
1. The frontend sends a request, for example `GET /api/employees`
2. Express checks the login token and the user's role (planned)
3. The route runs a SQL query with `mysql2`
4. MySQL returns rows
5. Express sends JSON back to the frontend

**Layers in the code (planned structure):** routes receive requests, controllers hold the logic, models or services run the SQL, middleware handles login and roles.

## 5. User Roles (planned)

| Role | Can do |
|---|---|
| Admin | Everything |
| HR | Employees, attendance, leave, payroll |
| Manager | Team attendance, tasks, leave approval |
| Employee | Own punch in and out, own tasks, own leave count |

Roles are stored in `users.role`. The server must check the role on every protected route. Hiding a screen in the frontend is not security.

## 6. Functional Requirements

| # | Feature | Status |
|---|---|---|
| 6.1 | Server starts and answers requests | Done |
| 6.2 | Database connection pool | Done |
| 6.3 | Login with email and password (JWT) | Planned |
| 6.4 | Role-based route protection | Planned |
| 6.5 | Dashboard counters | Planned |
| 6.6 | Employee roster with filters | Planned |
| 6.7 | Punch in and punch out for the signed-in employee | Planned |
| 6.8 | Daily attendance log for CSV export | Planned |
| 6.9 | Tasks for the signed-in employee | Planned |
| 6.10 | Notifications list and mark as read | Planned (table exists) |

## 7. Backend Folder Structure

**Current**

```
backend
|
|-- config
|   |-- db.js            (MySQL connection pool)
|
|-- node_modules
|-- .env                 (secrets, never commit)
|-- package.json
|-- server.js            (Express app)
```

**Planned**

```
backend
|
|-- config
|   |-- db.js
|
|-- controllers
|   |-- authController.js
|   |-- dashboardController.js
|   |-- employeeController.js
|   |-- attendanceController.js
|   |-- taskController.js
|   |-- notificationController.js
|
|-- middleware
|   |-- authMiddleware.js        (check the JWT)
|   |-- roleMiddleware.js        (check the role)
|
|-- routes
|   |-- authRoutes.js
|   |-- dashboardRoutes.js
|   |-- employeeRoutes.js
|   |-- attendanceRoutes.js
|   |-- taskRoutes.js
|   |-- notificationRoutes.js
|
|-- .env
|-- package.json
|-- server.js
```

 
## 8. Database Design (MySQL)

**Database name:** `hrms`

 
 
 

###  How the tables feed the dashboard

| Frontend value | Source |
|---|---|
| `total` staff | `COUNT(*)` of `employees` where `status = 'Active'` |
| `present` / `checkedIn` | `attendance` rows for today with `check_in` filled |
| `late` | `attendance` rows for today with `status = 'Late'` |
| `approvedLeaves` | `leave_requests` approved, where today is between `start_date` and `end_date` |
| `pendingLeaves` | `leave_requests` with `status = 'Pending'` |
| `monthlyPayroll` | Sum of `payroll.net_salary` for the current month and year |
| `projects` | `projects` with `status = 'Active'` |
| `departments` | `departments` with `status = 'Active'` |
| `teams` | `COUNT(*)` of `teams` |
| `leaves_taken` | Sum of `leave_requests.duration` for the employee, approved only |

 
## 10. API Endpoints (planned)

All routes start with `/api`. Every route except login needs the header `Authorization: Bearer <token>`.

 
### Dashboard (Admin, HR, Manager)

GET /api/dashboard/summary
GET /api/dashboard/attendance-summary

`summary` returns `{ present, total, pendingLeaves, monthlyPayroll, projects, departments, teams }`
`attendance-summary` returns `{ total, checkedIn, late, approvedLeaves, percentage, delta }`



### Notifications

GET /api/notifications
PUT /api/notifications/:id/read


 
 