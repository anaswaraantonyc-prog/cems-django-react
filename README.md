# CEMS - College Event Management System

A comprehensive web-based platform designed to integrate emergency medical access, physical identity card verification, college event and resource reservations, dynamic refund engines, direct complaint dispatching, and role-based administrative management. Built as an MCA Mini Project.

---

## Table of Contents

1. Project Abstract
2. Core Features and Modules
3. Technical Architecture
4. System Role Hierarchy
5. Emergency Matching Algorithm
6. Database Schema and Models
7. Installation and Setup Guide
   - Prerequisites
   - Backend Setup (Django REST Framework)
   - Frontend Setup (React + Vite)
8. Project Directory Structure
9. End-to-End Workflow Demonstration
10. License and Acknowledgments

---

## 1. Project Abstract

Higher educational institutions require streamlined administration for resource allocation (auditoriums, hostel facilities, canteen orders) alongside immediate, frictionless emergency response mechanisms. Traditional campus portals operate in silos, requiring passwords or static QR codes that fail during medical emergencies or when credentials are lost.

The **College Event Management System (CEMS)** addresses these challenges by offering a unified full-stack solution:
- **Emergency Medical Access**: Enables passwordless, camera-driven identity verification using physical college ID card matching via Computer Vision (OpenCV ORB feature detection) and facial matching against registered profile records.
- **Integrated College Services**: Provides centralized booking for college facilities and events, cancellation handling with an automated dynamic refund engine, rebooking authorization, direct-to-principal complaint logging, and role-specific dashboards.

---

## 2. Core Features and Modules

### Module 1: Emergency Access and Medical Rapid Response
- **Camera-Based Physical ID Verification**: Captures a live image of the user's physical college ID card via camera and compares it against stored card images using deterministic OpenCV feature matching (no cloud AI required).
- **Facial Matching Verification**: Compares live camera images against registered user profile photos using OpenCV Haar Cascades and histogram correlation.
- **Instant Doctor Dispatch**: Displays on-duty medical staff details immediately upon successful emergency verification, complete with one-click direct phone calling (`tel:` protocol).
- **Audit Logging**: Maintains complete logs of every emergency login attempt, timestamp, scanned ID, and dispatched responder for accountability.

### Module 2: User Authentication and Role-Based Access Control (RBAC)
- **Granular Roles**: Supports Student, Class Representative, Faculty, Principal, Admin, Canteen Staff, Hostel Warden, and Medical Staff.
- **Registration and Administrative Validation**: Public registration creates pending accounts requiring explicit Admin validation before granting full portal clearance.
- **Secure Token-Based Auth**: Utilizes Django REST Framework SimpleJWT for stateless access control with embedded role claims.

### Module 3: College Event & Resource Booking System
- **Multi-Facility Reservations**: Unified booking pipeline for Auditoriums, Hostel Rooms (AC and Non-AC), and Canteen pre-orders.
- **Capacity and Slot Tracking**: Manages date, time, duration, unit/seat counts, and associated booking fees.

### Module 4: Dynamic Refund and Rebooking Engine
- **Time-Scaled Refunds**: Dynamically calculates refund eligibility based on cancellation timing prior to the event (100% for cancellations 72+ hours prior, 50% for 24-72 hours, and 0% for under 24 hours).
- **Mandatory Refund Description Box**: Captures comprehensive cancellation reasons permanently attached to the transaction ledger.
- **Rebooking Approval Flow**: Allows cancelled bookings to request date/time relocation via a dedicated Rebooking Description Box, submitted directly to the Principal for authorization.
- **Admin Settlement Queue**: Holds physical refund execution authority, enabling administrators to review logs and sign off on disbursements.

### Module 5: Integrated Direct-to-Principal Complaint Portal
- **Bypassing Bureaucracy**: Direct communication channel from students/staff to the Principal's executive dashboard.
- **Anonymity Options**: Supports both signed and anonymous complaint submissions.
- **Priority Categorization and Resolution**: Categorizes complaints by priority (High, Medium, Low) and tracks status (Open, In Progress, Resolved) with confidential responses from the Principal.

### Module 6: Operational Dashboards
- **Student / Faculty View**: Event booking management, cancellation history, refund tracking, and emergency access.
- **Principal Executive Dashboard**: Real-time complaint feed, rebooking authorization queue, and campus activity overview.
- **Admin Financial and Audit Ledger**: System-wide user approvals, payment records, refund sign-offs, and emergency log auditing.
- **Canteen & Warden Interfaces**: Specialized task-focused views for order fulfillment and hostel occupancy management.

---

## 3. Technical Architecture

### Backend Stack
- **Framework**: Django 5.x with Django REST Framework (DRF)
- **Authentication**: JWT (SimpleJWT)
- **Computer Vision / Image Processing**: OpenCV (`opencv-python`), NumPy, Pillow
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **Environment Management**: `python-decouple`

### Frontend Stack
- **Library / Runtime**: React 18 (Vite)
- **Styling System**: Vanilla CSS with custom design tokens (Warm Luxury Floral & Glassmorphism Theme)
- **Camera Integration**: HTML5 Canvas & MediaDevices Web API
- **HTTP Proxying**: Vite Proxy targeting Django API at `http://localhost:8000`

---

## 4. System Role Hierarchy

| Role | Access Privileges | Key Capabilities |
| --- | --- | --- |
| Student / Faculty | Standard Access | Book facilities, request cancellations, view refund status, submit complaints, trigger emergency login |
| Class Representative | Extended Standard Access | Event coordination, facility booking, complaint tracking |
| Principal | Executive Clearance | Review complaints, authorize rebooking requests, override policies, view executive logs |
| Admin | System Administrator | User validation/clearance, master financial ledger, refund sign-offs, emergency audit logs |
| Canteen Staff | Operational Access | View and manage meal orders and canteen inventory queues |
| Hostel Warden | Operational Access | Monitor hostel room allocations and occupancy requests |
| Medical Staff | Operational Access | Receive emergency dispatch logs, manage on-duty status |

---

## 5. Emergency Matching Algorithm

CEMS replaces conventional biometric APIs and QR codes with lightweight, deterministic local OpenCV image processing:

1. **Card Image Capture**: The user holds their physical college ID card up to the browser camera frame.
2. **Preprocessing**: The captured image is converted to grayscale and normalized.
3. **ORB Feature Extraction**: The Orientated FAST and Rotated BRIEF (ORB) algorithm detects keypoints and computes feature descriptors for both the live photo and stored candidate card images.
4. **Feature Matching**: Brute-Force Matcher with Hamming distance evaluates descriptor similarity.
5. **Threshold Verification**: If the number of matching keypoints meets the minimum confidence threshold, authentication is granted.
6. **Fallback Face Match**: Option to match live facial capture against registered user profile photos using Haar Cascade face detection and histogram correlation.

---

## 6. Database Schema and Models

- **User**: Custom user model extending `AbstractUser` containing `role`, `phone_number`, `department`, `is_validated`, `validated_by`, and `profile_image`.
- **CollegeID**: One-to-one relation with `User`, storing `id_number`, `id_card_image`, `issued_at`, and status.
- **Booking**: Stores reservation details including `booking_type`, `room_type`, `event_datetime`, `amount`, `status`, and `cancellation_reason`.
- **RebookingRequest**: Links to `Booking`, containing proposed datetime, rescheduling justification, Principal remarks, and review status.
- **Payment & Refund**: Stores monetary transactions, payment reference, time-scaled calculated percentage, refund amount, and settlement sign-off by Admin.
- **Complaint**: Stores subject, anonymized or signed description, priority, status, and confidential principal replies.
- **MedicalStaff & EmergencyAccessLog**: Tracks medical staff duty status and logs every emergency authentication event.

---

## 7. Installation and Setup Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18.x or higher and npm
- Git

### Backend Setup (Django REST Framework)

1. Open PowerShell or Terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv env
   .\env\Scripts\Activate.ps1
   ```

3. Upgrade pip and install dependencies:
   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

5. Create an administrative account:
   ```powershell
   python manage.py createsuperuser
   ```

6. Start the Django development server:
   ```powershell
   python manage.py runserver
   ```
   The backend API will run on `http://127.0.0.1:8000/`.

### Frontend Setup (React + Vite)

1. Open a second PowerShell or Terminal window and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Install Node modules:
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Access the application in your browser at:
   ```text
   http://localhost:5173
   ```

---

## 8. Project Directory Structure

```text
cems-django-react/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # Custom User, CollegeID, RBAC, Validation
│   │   ├── bookings/          # Auditorium, Hostel, Canteen reservations & Rebooking
│   │   ├── campus_issue/      # Direct-to-Principal Complaint Box
│   │   ├── dashboard/         # Role-based dashboard aggregations
│   │   ├── emergency/         # OpenCV ID card & Face matching, Doctor dispatch
│   │   ├── gallery/           # Media & campus asset gallery
│   │   ├── lostfound/         # Lost and found item management
│   │   ├── notifications/     # In-app alert notifications
│   │   └── payments/          # Master Ledger, dynamic refund engine
│   ├── config/                # Django project settings and root URLs
│   ├── media/                 # Uploaded ID cards, profile photos, and receipts
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, LoginPage, RegisterPage, Modals
│   │   ├── modules/           # Booking, Refund, Rebook, Medical, Complaint, Canteen, Warden
│   │   ├── App.jsx            # Main app router and role switcher
│   │   ├── main.jsx           # Application entry point
│   │   └── theme.js           # Visual design tokens & role configurations
│   ├── package.json
│   └── vite.config.js         # API and media reverse proxy settings
├── requirements.txt           # Environment level requirements
└── README.md                  # Project documentation
```

---

## 9. End-to-End Workflow Demonstration

1. **User Registration**:
   - Register a student or faculty user with full name, contact details, profile photo, and physical ID card photo.
   - Account enters pending validation state.

2. **Admin Validation**:
   - Log in as Admin to review pending user registrations and grant clearance.

3. **Facility Booking and Dynamic Refund**:
   - Log in as Student, select an Auditorium or Hostel room, and confirm booking.
   - To cancel, navigate to the Refunds module, enter mandatory cancellation reasons in the Refund Description Box.
   - The engine automatically calculates the refund percentage based on time remaining before the event.

4. **Rebooking Request**:
   - Select a cancelled booking, specify a new proposed event datetime, fill in rescheduling details, and submit for Principal approval.
   - Log in as Principal to review and approve/reject the rebooking request.

5. **Direct Complaint Submission**:
   - Submit a complaint marked as High Priority.
   - Log in as Principal to view the complaint in the direct feed and submit a confidential resolution.

6. **Emergency ID Scan & Medical Rapid Response**:
   - From the public login screen, click the red Emergency Phone icon.
   - Position the physical college ID card inside the camera viewport and click "Scan ID Card".
   - The backend runs OpenCV ORB matching against registered cards, authenticates the user upon match, logs emergency access, and provides immediate contact details for the on-duty medical officer.

---

## 10. License and Acknowledgments

- Built as an MCA Mini Project.
- Developed using Django REST Framework, OpenCV, React, and Vite.
