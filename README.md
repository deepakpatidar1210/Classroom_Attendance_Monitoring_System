# AMS — CDGI (Attendance Monitoring System)

A comprehensive, automated attendance monitoring system utilizing mobile facial recognition and QR code validation. This system handles role-based dashboards, student registration approvals, timetable management, and automated visual attendance tracking.

## 🏗 System Architecture & Tech Stack

The project is divided into four main modules:

1. **`student-app` (Frontend Mobile)**: React Native + Expo
2. **`web-dashboard` (Frontend Web)**: React + Vite + React Router + Recharts/XLSX
3. **`backend` (API Server)**: Node.js + Express.js + JWT Authentication
4. **`face-server` (Machine Learning Server)**: Python + Flask + `face_recognition` + Pillow + NumPy
5. **Database**: Supabase (PostgreSQL Cloud Database)

---

## ✨ Key Features

- **Admin Dashboard**: Timetable management, faculty/student approvals, room management, and global statistics.
- **Teacher Dashboard**: One-click session creation tied to daily timetables, live QR code generation (refreshes every 7/10 seconds), and Excel attendance reports exporting.
- **Student App**: Pending registration approval flow, caching of face descriptors in `AsyncStorage` for rapid verification, and multi-factor attendance marking (QR + Face validation).
- **Advanced Face Verification**: The Python server utilizes multiple image variants (mirrored, brightness/contrast enhanced) to ensure faces are detected even in poor mobile camera lighting. Tolerance is strictly tuned to `0.65` for accurate matching.

---

## 📋 Prerequisites & Requirements

- **Node.js**: v18+ (for Backend and Web Dashboard)
- **Python**: 3.10+ (for Face Server)
- **C++ Build Tools**: Required to compile `dlib` during `face_recognition` installation on Windows. (Select "Desktop development with C++" in Visual Studio Installer).
- **Supabase Account**: A free cloud database project at [supabase.com](https://supabase.com).
- **Expo Go App**: For testing the React Native student app on a physical device.

---

## 🗄 Database Setup (Supabase)

Run the following complete SQL script in your Supabase SQL Editor to generate the exact database schema, constraints, and mock seed data required by the application.

```sql
-- 1. USERS
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. DEPARTMENTS
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL
);

-- 3. STUDENTS
CREATE TABLE students (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enrollment_no text UNIQUE NOT NULL,
  department_id uuid REFERENCES departments(id),
  semester int NOT NULL,
  face_descriptors jsonb,
  status VARCHAR DEFAULT 'pending',
  face_image text,
  created_at timestamptz DEFAULT now()
);

-- 4. TEACHERS
CREATE TABLE teachers (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  department_id uuid REFERENCES departments(id),
  designation VARCHAR DEFAULT 'Assistant Professor',
  created_at timestamptz DEFAULT now()
);

-- 5. SUBJECTS
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  department_id uuid REFERENCES departments(id),
  semester int NOT NULL
);

-- 6. ROOMS
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'Classroom',
  latitude float NOT NULL,
  longitude float NOT NULL,
  radius_meters int DEFAULT 60
);

-- 7. SESSIONS
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id),
  subject_id uuid REFERENCES subjects(id),
  room_id uuid REFERENCES rooms(id),
  date date NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time text,
  section VARCHAR,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8. QR TOKENS
CREATE TABLE qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- 9. ATTENDANCE
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id),
  student_id uuid REFERENCES students(id),
  status text CHECK (status IN ('present', 'absent')) DEFAULT 'absent',
  qr_verified boolean DEFAULT false,
  gps_verified boolean DEFAULT false,
  face_verified boolean DEFAULT false,
  marked_at timestamptz DEFAULT now(),
  manually_overridden boolean DEFAULT false,
  overridden_by uuid REFERENCES teachers(id),
  UNIQUE(session_id, student_id)
);

-- 10. PERIOD TIMINGS
CREATE TABLE period_timings (
  period_no INT PRIMARY KEY,
  label VARCHAR,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_break BOOLEAN DEFAULT false
);

-- 11. TIMETABLE
CREATE TABLE timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR NOT NULL,
  day_of_week INT NOT NULL,
  period_no INT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  room_id UUID REFERENCES rooms(id),
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section, day_of_week, period_no)
);

-- ==========================================
-- SEED DATA
-- ==========================================

INSERT INTO departments (name, code) VALUES
('Computer Science & Engineering', 'CSE'),
('Electronics & Communication', 'ECE'),
('Mechanical Engineering', 'ME'),
('Information Technology', 'IT'),
('Artificial Intelligence & Data Science', 'AIDS'),
('Computer Science & Information Technology', 'CSIT'),
('Cyber Security', 'CY');

INSERT INTO period_timings VALUES
(1,  'Lecture 1',   '09:00', '09:50', false),
(2,  'Lecture 2',   '09:50', '10:40', false),
(3,  'Lecture 3',   '10:40', '11:30', false),
(4,  'Lecture 4',   '11:30', '12:20', false),
(5,  'Lunch Break', '12:20', '13:00', true),
(6,  'Lecture 5',   '13:00', '13:45', false),
(7,  'Lecture 6',   '13:45', '14:30', false),
(8,  'Tea Break',   '14:30', '14:40', true),
(9,  'Lecture 7',   '14:40', '15:20', false),
(10, 'Lecture 8',   '15:20', '16:00', false);

-- ==========================================
-- INDEXES (Optimization Setup)
-- ==========================================

CREATE INDEX idx_attendance_session  ON attendance(session_id);
CREATE INDEX idx_attendance_student  ON attendance(student_id);
CREATE INDEX idx_sessions_teacher    ON sessions(teacher_id);
CREATE INDEX idx_sessions_date       ON sessions(date);
CREATE INDEX idx_timetable_teacher   ON timetable(teacher_id);
CREATE INDEX idx_timetable_section   ON timetable(section);
CREATE INDEX idx_students_enrollment ON students(enrollment_no);
```

### Initial Admin Credentials Creation
To create your first admin account to access the Web Dashboard, generate a hashed password in Node.js first:
```bash
node -e "const b=require('bcrypt');b.hash('Admin@123',10).then(console.log)"
```
Copy the hash, then execute this SQL in Supabase:
```sql
INSERT INTO users (name, email, password_hash, role)
VALUES ('System Admin', 'admin@cdgi.ac.in', 'YOUR_HASHED_PASSWORD_HERE', 'admin');
```

---

## 🚀 Installation & Network Setup

Since all services run locally but communicate cross-network, you **must coordinate your local IP Address**.
Run `ipconfig` (Windows) or `ifconfig` (Mac) to find your IPv4 Address (e.g. `192.168.1.10`).

### 1. Backend (`backend/`)
```bash
cd backend
npm install
```
Create a `.env` file referencing your Supabase data and Face server IP:
```env
PORT=5000
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-anon-public-key>
JWT_SECRET=cdgi_attendx_2025_secure_key
FACE_SERVER_URL=http://<YOUR_IPV4_ADDRESS>:5001
DASHBOARD_URL=http://localhost:5173
```
Run it:
```bash
npm run dev
```

### 2. Face Recognition Server (`face-server/`)
If `dlib` fails to install on Windows, ensure C++ Build Tools are installed, or install a pre-compiled `.whl` file matched to your Python version.
```bash
cd face-server
pip install cmake
pip install dlib
pip install face_recognition flask flask-cors pillow numpy
python face-server-app.py
```

### 3. Web Dashboard (`web-dashboard/`)
```bash
cd web-dashboard
npm install
```
Inside `web-dashboard/src/api/axios.js`, ensure the `baseURL` points to your backend IP:
```javascript
baseURL: 'http://<YOUR_IPV4_ADDRESS>:5000/api'
```
Run it:
```bash
npm run dev
```

### 4. Student App (`student-app/`)
```bash
cd student-app
npm install
```
Inside `student-app/config.js`, update `BASE_IP`:
```javascript
export const BASE_IP = '<YOUR_IPV4_ADDRESS>';
```
Run the bundler:
```bash
npm start
```
Use Expo Go on your mobile device to scan the QR and run the application.

---

## 🔒 Security & Workflow Mechanics

- **Liveness & Expiration**: QR Codes generated by the Teacher Dashboard strictly expire within 7-10 seconds to prevent them from being sent to external absent students.
- **Async Caching**: Face descriptors are locally cached via `AsyncStorage` on the student's mobile device during login. This cuts the 8-10 second verification time down to 3 seconds by bypassing a redundant call to Supabase on every scan.
- **Administrative Guardrails**: Students creating a new account are locked in a `pending` status until manually verified and approved visually by an Admin in the Dashboard "Requests" tab.
