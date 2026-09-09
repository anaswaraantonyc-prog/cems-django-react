# CEMS frontend

React frontend for the College Event Management System, based on the SRS
(Admin ledger, Booking/Refund/Rebooking, Medical rapid access, Complaint box).

## Run

npm install
npm run dev

Then open the printed localhost URL. Use the sidebar to switch role
(Student / Faculty / Principal / Admin) and module.

## Structure

src/
  theme.js              shared colors, style helpers
  main.jsx              entry point
  App.jsx                sidebar shell + role/module router
  components/Shared.jsx  Stamp, Card, Label, Field
  modules/                one file per SRS module
