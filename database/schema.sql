CREATE DATABASE IF NOT EXISTS hrms;
USE hrms;

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NULL,
    dept VARCHAR(150) NULL,
    email VARCHAR(190) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Present',
    avatar VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    project VARCHAR(150) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'todo',
    progress INT NOT NULL DEFAULT 0,
    due VARCHAR(50) NOT NULL,
    assignedTo INT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assignedTo (assignedTo),
    INDEX idx_project (project),
    INDEX idx_status (status),
    CONSTRAINT fk_task_employee
        FOREIGN KEY (assignedTo)
        REFERENCES employees(id)
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

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message VARCHAR(255),
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE users(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100),email VARCHAR(120) NOT NULL UNIQUE,password_hash VARCHAR(100) NOT NULL,role ENUM('Admin','HR','Manager','Employee') DEFAULT 'Employee',employee_id INT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(employee_id) REFERENCES employees(id));
CREATE TABLE leave_types(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(50) NOT NULL UNIQUE,days_per_year INT DEFAULT 12);
CREATE TABLE attendance(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT NOT NULL,date DATE NOT NULL,check_in TIME,check_out TIME,working_hours DECIMAL(4,2) DEFAULT 0,status ENUM('Present','Late','Absent','On Leave','WFH') DEFAULT 'Present',remarks VARCHAR(200),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE(employee_id,date),INDEX(date),FOREIGN KEY(employee_id) REFERENCES employees(id));

CREATE TABLE attendance(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT NOT NULL,date DATE NOT NULL,check_in TIME,check_out TIME,working_hours DECIMAL(4,2) DEFAULT 0,status ENUM('Present','Late','Absent','On Leave','WFH') DEFAULT 'Present',remarks VARCHAR(200),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE(employee_id,date),INDEX(date),FOREIGN KEY(employee_id) REFERENCES employees(id));

CREATE TABLE leave_requests(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT NOT NULL,leave_type_id INT NOT NULL,start_date DATE,end_date DATE,duration INT,reason VARCHAR(255),status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',approved_by INT NULL,remarks VARCHAR(200),INDEX(status),FOREIGN KEY(employee_id) REFERENCES employees(id),FOREIGN KEY(leave_type_id) REFERENCES leave_types(id),FOREIGN KEY(approved_by) REFERENCES users(id));

CREATE TABLE payroll(id INT AUTO_INCREMENT PRIMARY KEY,employee_id INT NOT NULL,month TINYINT,year SMALLINT,basic_salary DECIMAL(10,2),allowances DECIMAL(10,2) DEFAULT 0,bonus DECIMAL(10,2) DEFAULT 0,deductions DECIMAL(10,2) DEFAULT 0,tax DECIMAL(10,2) DEFAULT 0,gross_salary DECIMAL(10,2),net_salary DECIMAL(10,2),payment_status ENUM('Pending','Paid') DEFAULT 'Pending',payment_date DATE,UNIQUE(employee_id,month,year),FOREIGN KEY(employee_id) REFERENCES employees(id));
