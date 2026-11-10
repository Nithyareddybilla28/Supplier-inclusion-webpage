# Lenovo Supplier Diversity - System Architecture

## 🏗️ System Overview

```
                           ┌─────────────────────────┐
                           │   You (Admin Browser)   │
                           │   http://localhost:3000 │
                           └────────┬────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  Login Page  │ │ Admin Panel  │ │   Logout     │
            │ (Register)   │ │ (Dashboard)  │ │              │
            └──────┬───────┘ └──────┬───────┘ └──────────────┘
                   │                │
                   └────────┬────────┘
                            │
                   [JWT Token in LocalStorage]
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │   REACT FRONTEND (http://localhost:3000)
        │   ├─ Admin Dashboard
        │   ├─ Supplier Form
        │   ├─ Excel Upload/Download
        │   └─ Lenovo Color Scheme
        └────────┬─────────────────────────────┘
                 │
                 │ Axios HTTP Requests
                 │ Authorization: Bearer <JWT>
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │   FASTAPI BACKEND (http://localhost:8000)
        │   ├─ Authentication & JWT
        │   ├─ Admin Routes
        │   │  ├─ POST /admin/register
        │   │  ├─ POST /admin/login
        │   │  ├─ GET  /admin/suppliers
        │   │  ├─ POST /admin/suppliers/invite
        │   │  ├─ GET  /admin/submissions
        │   │  └─ POST /admin/export-excel
        │   ├─ Supplier Routes
        │   │  ├─ POST /supplier/verify
        │   │  ├─ POST /supplier/login
        │   │  ├─ POST /supplier/submit-form
        │   │  ├─ POST /supplier/upload-excel
        │   │  ├─ GET  /supplier/submissions
        │   │  └─ GET  /supplier/profile
        │   └─ Utilities
        │      ├─ Excel Import (pandas)
        │      ├─ Excel Export (openpyxl)
        │      └─ Email Tokens (JWT)
        └────────┬─────────────────────────────┘
                 │
                 │ SQLAlchemy ORM
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │   DATABASE (SQLite / PostgreSQL)
        │   ├─ AdminUser
        │   │  ├─ id, email, password_hash
        │   │  └─ created_at
        │   ├─ Supplier
        │   │  ├─ id, admin_id, name, email
        │   │  ├─ is_verified, sub_user_ids
        │   │  └─ created_at, last_updated
        │   ├─ SupplierSubmission
        │   │  ├─ id, supplier_id
        │   │  ├─ period, tier, customer_name
        │   │  ├─ suppliers_data (JSON)
        │   │  └─ submitted_at, last_modified
        │   └─ VerificationToken
        │      ├─ id, email, token
        │      ├─ supplier_id, admin_id
        │      └─ created_at, expires_at (7d)
        └────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Admin Workflow

```
Admin Registration
─────────────────
Email + Password
    │
    ▼
    ┌──────────────────────┐
    │ Hash Password (SHA256)│
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Save AdminUser       │
    │ Generate JWT Token   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Admin Dashboard      │
    │ (Token stored)       │
    └──────────────────────┘


Inviting Supplier
─────────────────
Admin Input: supplier@company.com
    │
    ▼
    ┌─────────────────────────────────┐
    │ Create Supplier Record          │
    │ Generate Verification Token     │
    │ Token Valid: 7 Days             │
    └──────────┬──────────────────────┘
               │
               ▼
    ┌─────────────────────────────────┐
    │ Verification Link Generated     │
    │ /verify?token=xyz               │
    │ Admin Shares: Email, Copy/Paste │
    └─────────────────────────────────┘


Exporting Data
──────────────
Admin Click: "Download Submissions"
    │
    ▼
    ┌──────────────────────────────────────┐
    │ Query All SupplierSubmissions        │
    │ Filter by admin_id                   │
    └──────────┬───────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ Convert JSON → Pandas DataFrame      │
    │ Flatten nested supplier data         │
    └──────────┬───────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ Generate Excel File                  │
    │ ├─ Headers: Supplier Name, Period... │
    │ ├─ Rows: One per supplier record     │
    │ └─ Format: .xlsx                     │
    └──────────┬───────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ Browser Download                     │
    │ File: supplier_submissions.xlsx      │
    └──────────────────────────────────────┘
```

---

## 🔄 Data Flow: Supplier Workflow

```
Email Verification
──────────────────
Admin Shares: /verify?token=xyz
    │
    ▼
    ┌──────────────────────────────────┐
    │ Supplier Opens Verification Link │
    │ Browser extracts token from URL  │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ Backend Verifies Token           │
    │ ├─ Token exists?                 │
    │ ├─ Not expired? (7 days max)     │
    │ └─ Matches supplier email?       │
    └──────────┬───────────────────────┘
               │ Success
               ▼
    ┌──────────────────────────────────┐
    │ Mark Supplier: is_verified=True  │
    │ Delete Token (one-time use)      │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ Supplier Can Now Login           │
    │ Email + Password Auth            │
    └──────────────────────────────────┘


Form Submission
───────────────
Supplier Fills:
  ├─ Period: Jul 2026 Indirect Spend - T-Mobile
  ├─ Tier: Tier 2
  ├─ Customer Name: ABC Corporation
  └─ Suppliers Table:
     ├─ Row 1: Vendor A, 50%, $500k
     ├─ Row 2: Vendor B, 30%, $300k
     └─ Row 3: Vendor C, 20%, $200k
    │
    ▼
    ┌──────────────────────────────────────┐
    │ Form Validation                      │
    │ ├─ All fields filled?                │
    │ ├─ Percentages add up? (optional)    │
    │ └─ No negative numbers?              │
    └──────────┬───────────────────────────┘
               │ Valid
               ▼
    ┌──────────────────────────────────────┐
    │ Create/Update SubmissionSubmission   │
    │ ├─ supplier_id: 123                  │
    │ ├─ period: "Jul 2026..."             │
    │ ├─ suppliers_data: [rows as JSON]    │
    │ └─ submitted_at: now()               │
    └──────────┬───────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ Save to Database                     │
    │ ✓ Submission Confirmed               │
    └──────────────────────────────────────┘


Excel Upload
────────────
Supplier Downloads Template
    │ (Headers: Period, Tier, Customer, Supplier...)
    │
    ├─ Fills spreadsheet
    │
    └─ Clicks "Upload Excel"
    │
    ▼
    ┌─────────────────────────────────────┐
    │ File Sent to Backend                │
    │ FormData with multipart/form-data   │
    └──────────┬────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ Backend: pandas.read_excel()        │
    │ Auto-detect columns by header name  │
    └──────────┬────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ Map Columns to Fields               │
    │ "Supplier" → name                   │
    │ "Verified" → verified (bool)        │
    │ "Allocation %" → allocation_percent │
    │ etc.                                │
    └──────────┬────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ Validate Data Types                 │
    │ Percentages < 100? ✓                │
    │ Spend > 0? ✓                        │
    └──────────┬────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ Create SubmissionSubmission         │
    │ suppliers_data = [rows array]       │
    │ file_upload_path = filename         │
    └──────────┬────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ Save & Confirm                      │
    │ ✓ Excel Data Imported Successfully  │
    └─────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
JWT Token Lifecycle
───────────────────

1. Login
   ┌─────────────────────────────────────┐
   │ POST /admin/login                   │
   │ ├─ Email: admin@company.com         │
   │ └─ Password: secretpassword         │
   └──────────┬────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Hash Password (SHA256)              │
   │ Compare with stored hash            │
   └──────────┬────────────────────────┘
              │ Match ✓
              ▼
   ┌─────────────────────────────────────┐
   │ Create JWT Payload                  │
   │ {                                   │
   │   "sub": "1",                       │
   │   "role": "admin",                  │
   │   "exp": now() + 24 hours           │
   │ }                                   │
   └──────────┬────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Sign with SECRET_KEY (HS256)        │
   │ Encoded: eyJ0eXAi... (JWT String)   │
   └──────────┬────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Return Token to Frontend            │
   │ localStorage.setItem('token', jwt)  │
   └─────────────────────────────────────┘

2. Using Token
   ┌─────────────────────────────────────┐
   │ Every API Request                   │
   │ GET /api/admin/suppliers            │
   │ Authorization: Bearer eyJ0eXAi...   │
   └──────────┬────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Backend Middleware: verify_token()  │
   │ ├─ Extract token from Authorization│
   │ ├─ Decode using SECRET_KEY         │
   │ ├─ Check exp timestamp             │
   │ └─ Extract user_id & role          │
   └──────────┬────────────────────────┘
              │ Valid
              ▼
   ┌─────────────────────────────────────┐
   │ Route Handler Executes              │
   │ (has access to user_id, role)       │
   └─────────────────────────────────────┘

3. Token Expiration
   24 hours pass
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Token Invalid ("Token expired")     │
   │ Frontend Redirects to Login         │
   │ User Logs In Again                  │
   └─────────────────────────────────────┘
```

---

## 📊 Database Schema Relationships

```
                  AdminUser (1)
                      │
                      │ owns
                      │
                  (1 to Many)
                      │
                      ▼
                  Supplier (Many)
                      │
                      │ creates
                      │
                  (1 to Many)
                      │
                      ▼
            SupplierSubmission (Many)
                      │
                      │
                      └─────┬─────────┐
                            │         │
                    (JSON Array)      │
                            │         │
                    [Supplier Data]  │
                    ├─ name          │
                    ├─ verified      │
                    ├─ allocation %  │
                    └─ spend $       │
                                    │
                    VerificationToken
                            │
                            └─ Expires after 7 days
```

---

## 🔄 Request/Response Cycle Example

```
Scenario: Supplier Submits Form

1. Frontend State
   ┌─────────────────────────────────────┐
   │ formData = {                        │
   │   period: "Jul 2026...",            │
   │   tier: "Tier 2",                   │
   │   customer_name: "ABC Corp",        │
   │   suppliers: [                      │
   │     {name: "V1", allocation: 50},   │
   │     {name: "V2", allocation: 30}    │
   │   ]                                 │
   │ }                                   │
   └──────────┬────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────┐
   │ axios.post('/api/supplier/submit-  │
   │ form', formData, {                  │
   │   headers: {                        │
   │     Authorization: "Bearer <jwt>"   │
   │   }                                 │
   │ })                                  │
   └──────────┬────────────────────────┘
              │
    [HTTP POST Request]
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Backend receive_form()              │
   │                                     │
   │ 1. verify_token() ✓                 │
   │ 2. Get supplier by ID               │
   │ 3. Validate data                    │
   │ 4. Create/Update SupplierSubmission │
   │ 5. db.commit()                      │
   └──────────┬────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Response:                           │
   │ {                                   │
   │   "id": 42,                         │
   │   "supplier_id": 7,                 │
   │   "period": "Jul 2026...",          │
   │   "submitted_at": "2026-09-17T..."  │
   │ }                                   │
   └──────────┬────────────────────────┘
              │
    [HTTP 200 OK]
              │
              ▼
   ┌─────────────────────────────────────┐
   │ Frontend Success Handler            │
   │ alert("Form submitted!")            │
   │ Clear form, show confirmation       │
   └─────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture (Example: Render)

```
Your Local Development
└─ Push to GitHub
   │
   ▼
GitHub Repository
   │
   ├─ main branch
   │
   └─ Connected to Render
      │
      ├─────────────────────┐
      │                     │
      ▼                     ▼
   Backend Service      Frontend Service
   (Web Service)        (Static Site)
   │                    │
   ├─ Python Runtime   ├─ Build: npm run build
   ├─ pip install      ├─ Output: dist/
   ├─ uvicorn          ├─ Serve: /dist/index.html
   ├─ Port: 8000       ├─ Port: 3000
   │                   │
   ├─ lenovo_suppliers.db (persistent)
   │
   └─ https://backend-xyz.onrender.com/api
                            │
                            └─ Proxy to Frontend
                               https://frontend-abc.onrender.com/

User → https://frontend-abc.onrender.com
       ├─ Load React App
       └─ Axios calls → https://backend-xyz.onrender.com/api
```

---

## 📈 Scalability Path

```
Development (Now)
├─ SQLite database
├─ Single-instance backend
├─ Local or Render free tier
└─ Works for: 1-50 suppliers

Growth Phase
├─ Switch to PostgreSQL
├─ Render paid tier ($7/month)
├─ Add Redis for caching
└─ Works for: 50-500 suppliers

Production at Scale
├─ PostgreSQL + Read Replicas
├─ Load Balancer (AWS ALB)
├─ CDN for Static Assets (Cloudflare)
├─ Auto-scaling servers
├─ Database backups + monitoring
└─ Works for: 1000+ suppliers
```

---

## 🔄 Error Handling Flow

```
Network Error
    │
    ▼
Axios Interceptor
    │
    ├─ 401 Unauthorized
    │  └─ Token expired → Redirect to login
    │
    ├─ 403 Forbidden
    │  └─ Invalid role → Redirect to login
    │
    ├─ 400 Bad Request
    │  └─ Display error message from API
    │
    └─ 500 Server Error
       └─ Log error, show "Please try again"
```

---

## Summary

**This architecture is:**
- ✅ Secure (JWT + password hashing)
- ✅ Scalable (SQLite → PostgreSQL upgrade path)
- ✅ Maintainable (clean separation of concerns)
- ✅ Deployable (works on Render, Railway, AWS, etc.)
- ✅ User-friendly (intuitive UI, clear workflows)
- ✅ Data-safe (database backups recommended)

Ready for production! 🚀
