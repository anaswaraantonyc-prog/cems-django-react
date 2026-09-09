# College Event Management System (CEMS) — Backend

Django REST Framework backend implementing SRS v2.1: Admin Ledger & Refunds,
Rebooking Authorization, Auditorium/Hostel/Canteen Booking, Medical Emergency
QR Access, and the Principal's Complaint Box portal.

## Setup
```bash
python -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env            # edit DB creds, or point DB_* at your Postgres
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py shell < seed_data.py   # optional demo data
python manage.py runserver
```

## Key API groups
- `/api/auth/` — register, login (JWT), profile, Admin user validation, college ID/QR issuance
- `/api/bookings/` — Auditorium/Hostel/Canteen bookings, cancellation, rebooking requests
- `/api/payments/` — payments, refunds, Admin's Master Financial Ledger
- `/api/campus-issues/` — Complaint Box
- `/api/emergency/` — QR login bypass, on-duty doctor directory
- `/api/lostfound/` — lost & found items + matching
- `/api/notifications/` — notification feed
- `/api/gallery/` — event photo gallery
- `/api/dashboard/` — role-specific dashboards (admin/principal/faculty/student/canteen/warden)
