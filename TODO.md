# TODO - Payroll & Attendance Web App (Admin Enhancements)

## v1 (Already done)
- [x] Full-stack app: admin + employee portals
- [x] Admin overtime approve/reject
- [x] Travel orders admin approve/reject
- [x] Modern UI with side menu
- [x] Enhanced Payslip CSV with cooperative header and full deduction breakdown

## v2 (Requested: implement ALL admin suggestion features)
### Database + server foundations (automatic migrations)
- [ ] Add/extend tables:
  - [ ] audit_log (who did what + when)
  - [ ] payroll status fields: Draft / Approved / Paid
  - [ ] payroll approval timestamps (optional)
  - [ ] attendance_corrections (employee request corrections)
  - [ ] settings: standard_hours_per_day / holiday calendar
  - [ ] notifications (admin ↔ employee)

### Server/API
- [ ] Add audit logging middleware/helpers to:
  - [ ] attendance upsert
  - [ ] overtime decision
  - [ ] travel decision
  - [ ] payroll generate/approve/pay
- [ ] Add payroll workflow APIs:
  - [ ] Generate as Draft
  - [ ] Admin can approve Draft → Approved
  - [ ] Admin can mark Approved → Paid
- [ ] Add attendance validation endpoints or validation logic:
  - [ ] check-out before check-in
  - [ ] missing times when status=Present
  - [ ] duplicate detection
- [ ] Add employee attendance correction request APIs:
  - [ ] submit correction request
  - [ ] admin approve/reject correction
- [ ] Add settings endpoints for standard hours/day + holiday calendar
- [ ] Add dashboard aggregates endpoints
- [ ] Enhanced CSV export endpoints:
  - [ ] attendance by range with totals
  - [ ] payroll by range with totals
- [ ] Notifications APIs (read + mark seen)

### Client/UI
- [ ] Admin Audit Log page
- [ ] Payroll workflow UI (Draft/Approved/Paid)
- [ ] Attendance validation warnings in AdminAttendance UI
- [ ] Employee attendance correction UI + Admin correction approval UI
- [ ] Dashboards with charts
- [ ] Export enhancements with filters + totals row
- [ ] Notifications badge/toasts

### QA
- [ ] End-to-end tests for: approve/reject flows + payroll statuses + notification creation
