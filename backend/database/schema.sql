CREATE DATABASE IF NOT EXISTS hrms;
USE hrms;

CREATE TABLE IF NOT EXISTS employees (
    id INT NOT NULL AUTO_INCREMENT,
    employeeId VARCHAR(191) NOT NULL UNIQUE,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(191) NULL,
    department VARCHAR(191) NOT NULL,
    dept VARCHAR(150) NULL,
    designation VARCHAR(191) NOT NULL,
    workType VARCHAR(191) NOT NULL,
    status VARCHAR(191) NOT NULL,
    role VARCHAR(191) NOT NULL,
    passwordHash VARCHAR(255) NULL,
    avatar VARCHAR(255) NULL,
    leaveBalance INT NOT NULL,

    createdAt DATETIME(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    updatedAt DATETIME(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    status VARCHAR(191) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    project VARCHAR(150) NOT NULL,
    projectId INT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'todo',
    progress INT NOT NULL DEFAULT 0,
    due VARCHAR(50) NOT NULL,
    assignedTo INT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_assignedTo (assignedTo),
    INDEX idx_project (project),
    INDEX idx_projectId (projectId),
    INDEX idx_status (status),
    CONSTRAINT fk_task_employee
        FOREIGN KEY (assignedTo)
        REFERENCES employees(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_task_project
        FOREIGN KEY (projectId)
        REFERENCES projects(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id INT NOT NULL,
    employee_id INT NOT NULL,
    PRIMARY KEY (team_id, employee_id),
    CONSTRAINT fk_team_member_team
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_team_member_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role ENUM('Admin', 'HR', 'Manager', 'Employee') DEFAULT 'Employee',
    employee_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    message VARCHAR(255) NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    days_per_year INT DEFAULT 12
);

-- Legacy attendance records used by the SQL-backed HRMS features.
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIME NULL,
    check_out TIME NULL,
    working_hours DECIMAL(4, 2) DEFAULT 0,
    status ENUM('Present', 'Late', 'Absent', 'On Leave', 'WFH') DEFAULT 'Present',
    remarks VARCHAR(200) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance_employee_date (employee_id, date),
    INDEX idx_attendance_date (date),
    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
);

-- Attendance records used by the employee attendance API.
CREATE TABLE IF NOT EXISTS attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employeeId INT NOT NULL,
    date DATE NOT NULL,
    punchIn DATETIME(3) NULL,
    punchOut DATETIME(3) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_attendances_employee_date (employeeId, date),
    INDEX idx_attendances_date (date),
    CONSTRAINT fk_attendances_employee
        FOREIGN KEY (employeeId)
        REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    duration INT NULL,
    reason VARCHAR(255) NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT NULL,
    remarks VARCHAR(200) NULL,
    INDEX idx_leave_requests_status (status),
    CONSTRAINT fk_leave_request_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id),
    CONSTRAINT fk_leave_request_type
        FOREIGN KEY (leave_type_id)
        REFERENCES leave_types(id),
    CONSTRAINT fk_leave_request_approver
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employeeId INT NOT NULL,
    leaveType VARCHAR(191) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    reason TEXT NULL,
    status VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_leaves_employeeId (employeeId),
    CONSTRAINT fk_leaves_employee
        FOREIGN KEY (employeeId)
        REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month TINYINT NULL,
    year SMALLINT NULL,
    basic_salary DECIMAL(10, 2) NULL,
    allowances DECIMAL(10, 2) DEFAULT 0,
    bonus DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    gross_salary DECIMAL(10, 2) NULL,
    net_salary DECIMAL(10, 2) NULL,
    payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    payment_date DATE NULL,
    UNIQUE KEY uq_payroll_employee_month_year (employee_id, month, year),
    CONSTRAINT fk_payroll_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
);
