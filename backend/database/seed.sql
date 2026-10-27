USE hrms;

INSERT INTO employees (id, name, role, dept, email, status, avatar) VALUES
(1, 'Sarah Jenkins', 'Lead Developer', 'Engineering', 'sarah@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=47'),
(2, 'Sophia Rodriguez', 'Senior Developer', 'Engineering', 'sophia@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=45'),
(3, 'Marcus Lee', 'Backend Developer', 'Engineering', 'marcus@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=12'),
(4, 'Diego Alvarez', 'Full-stack Developer', 'Engineering', 'diego@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=15'),
(5, 'Priya Nair', 'UI/UX Designer', 'Design', 'priya@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=32'),
(6, 'Liam Carter', 'DevOps Engineer', 'Infrastructure', 'liam@panda-infotech.io', 'Absent', 'https://i.pravatar.cc/96?img=33'),
(7, 'Aisha Khan', 'QA Engineer', 'Quality', 'aisha@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=44'),
(8, 'Noah Kim', 'Mobile Developer', 'Engineering', 'noah@panda-infotech.io', 'On Leave', 'https://i.pravatar.cc/96?img=52'),
(9, 'Mei Chen', 'Product Manager', 'Product', 'mei@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=5'),
(10, 'Elena Vance', 'HR Super Admin', 'People Ops', 'elena@panda-infotech.io', 'Present', 'https://i.pravatar.cc/96?img=49');

INSERT INTO teams (id, name) VALUES
(1, 'Platform'),
(2, 'Design'),
(3, 'Quality & Ops');

INSERT INTO team_members (team_id, employee_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (2, 5), (2, 9), (3, 6), (3, 7);

INSERT INTO tasks (id, title, description, project, priority, status, progress, due, assignedTo) VALUES
(1, 'Semantic Color Tokens & Dark/Light Variable System', 'Define HSL CSS token matrix for Charcoal/Mint and White/Orange themes across all web modules.', 'Design System 2.0', 'high', 'todo', 15, '18h', 1),
(2, 'Accessible Data Grid & High-Density Table Layout', 'Construct WCAG 2.1 AA compliant enterprise table components with sorting, column resizing & pagination.', 'Design System 2.0', 'medium', 'todo', 10, '14h', 2),
(3, 'Reusable Component Library & Storybook Docs', 'Publish buttons, inputs, modals and badges as documented components with usage guidelines.', 'Design System 2.0', 'medium', 'todo', 0, '12h', 3),
(4, 'Resumable File Upload Module', 'Chunked uploads with retry, drag-and-drop zone and per-file progress for large attachments.', 'Dropper', 'critical', 'in-progress', 62, '24h', 4),
(5, 'Dashboard Integration & Activity Feed', 'Surface recent uploads, shares and storage usage inside the main workspace dashboard.', 'Dropper', 'high', 'in-progress', 38, '30h', 3),
(6, 'Employee Profile Management', 'Create, edit and archive employee records with documents and emergency contacts.', 'EMS', 'medium', 'finished', 100, '16h', 2),
(7, 'Attendance & Punch Status Module', 'Real-time punch in/out, late marks and monthly attendance summaries per employee.', 'HRMS', 'high', 'in-progress', 55, '20h', 1),
(8, 'Payroll Processing & Payslip Generator', 'Salary structure engine with deductions, tax slabs and downloadable payslip PDFs.', 'HRMS', 'medium', 'in-progress', 25, '40h', 2),
(9, 'Role Based Access Control', 'Permissions for administrator, manager and employee roles across every module.', 'EMS', 'high', 'finished', 100, '15h', 3);