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
