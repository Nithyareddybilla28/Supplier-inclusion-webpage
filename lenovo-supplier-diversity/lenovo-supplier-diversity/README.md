# Lenovo Supplier Diversity Platform

**Self-service supplier data entry system for Lenovo's supplier reporting and management.**

## Overview

Transform manual supplier data collection into an automated, easy-to-use platform where:
- **Suppliers** fill out forms or upload Excel files
- **Data** flows directly into your database
- **You** download submissions anytime as Excel

No more emails, no more manual transcription.

---

## Features

### For Suppliers
✅ Email-based verification (no pre-registration needed)  
✅ Simple form or Excel upload  
✅ Fill-in supplier data with auto-populated names  
✅ Support for status flags (Verified, Unverified, Denied, Confidential)  
✅ Allocation percentages and spend tracking  
✅ Report no customer spend or revenue activity for a quarter; exported sales and category spend are zero  

### For Admin (You)
✅ Invite suppliers via email  
✅ View all submissions in dashboard  
✅ Download all data as Excel anytime, with one total value per supplier-diversity category  
✅ Track supplier verification status  
✅ Manage sub-users per supplier  

### Design
🎨 **Lenovo-branded UI** with official colors:
- Red: #E81828
- Purple: #7030A0
- Grey: #444444, #CCCCCC, #F5F5F5

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI (Python) |
| **Frontend** | React (JavaScript) |
| **Database** | SQLite (local) / PostgreSQL (production) |
| **Auth** | JWT tokens + Email verification |
| **Files** | Excel import/export with openpyxl |

---

## Quick Start

### 1. Clone & Setup

```bash
git clone your-repo-url
cd lenovo-supplier-diversity

# Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
npm install
```

### 2. Run Locally

**Terminal 1 - Backend:**
```bash
source venv/bin/activate
python -m uvicorn backend:app --reload
# Backend: http://localhost:8000
# Docs: http://localhost:8000/docs
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend: http://localhost:3000
```

### 3. First Login

**Admin:**
- Go to http://localhost:3000
- Toggle to "Admin"
- Register email + password
- Dashboard opens

**Supplier:**
1. Admin invites supplier email
2. Supplier gets verification link
3. Click link to verify
4. Login with email + password
5. Fill form or upload Excel

---

## File Structure

```
lenovo-supplier-diversity/
├── backend.py              # FastAPI server (all endpoints)
├── frontend.jsx            # React app (all UI components)
├── main.jsx               # React entry point
├── index.html             # HTML template
├── index.css              # Styles
├── requirements.txt       # Python dependencies
├── package.json           # Node dependencies
├── vite.config.js         # React build config
├── DEPLOYMENT.md          # Deployment guide
└── lenovo_suppliers.db    # SQLite database (auto-created)
```

---

## API Endpoints

### Admin Routes
```
POST   /api/admin/register         Register new admin
POST   /api/admin/login            Admin login
GET    /api/admin/suppliers        List all suppliers
POST   /api/admin/suppliers/invite Invite supplier by email
GET    /api/admin/submissions      Get all submissions
POST   /api/admin/export-excel     Download submissions as Excel
```

### Supplier Routes
```
POST   /api/supplier/verify           Verify email with token
POST   /api/supplier/login            Supplier login
POST   /api/supplier/submit-form      Submit form data
POST   /api/supplier/upload-excel     Upload Excel file
GET    /api/supplier/submissions      Get supplier's submissions
GET    /api/supplier/profile          Get supplier profile
GET    /api/download-template         Download Excel template
```

---

## Database Schema

### AdminUser
```sql
id (PK), email, password_hash, created_at
```

### Supplier
```sql
id (PK), admin_id, name, email, is_verified, 
sub_user_ids (JSON), created_at, last_updated
```

### SupplierSubmission
```sql
id (PK), supplier_id, period, tier, customer_name,
suppliers_data (JSON array), file_upload_path, 
submitted_at, last_modified
```

### VerificationToken
```sql
id (PK), email, token, supplier_id, admin_id,
created_at, expires_at (7 days)
```

---

## Form Fields (From Screenshots)

Each supplier submission includes:

| Field | Type | Example |
|-------|------|---------|
| **Period** | Text | Jul 2026 Indirect Spend - T-Mobile |
| **Tier** | Text | Tier 2 |
| **Customer Name** | Text | Your Company Name |
| **Supplier Name** | Text | Supplier 1 |
| **Verified** | Checkbox | ✓ |
| **Unverified** | Checkbox | |
| **Denied** | Checkbox | |
| **Allocation %** | Number | 50.00 |
| **Allocated Spend $** | Number | 1,000,000.00 |
| **No reported spend or revenue activity** | Checkbox | Unchecked |
| **Confidential** | Checkbox | ✓ |

---

## Excel Template

Suppliers can download a template with these columns:

```
Period | Tier | Customer | Supplier | Verified | Unverified | Denied | Allocation % | Allocated Spend $ | Confidential
```

Upload to auto-populate form.

---

## Authentication Flow

### Supplier Email Verification
1. Admin invites: `supplier@company.com`
2. System generates 7-day verification token
3. Supplier gets link: `/verify?token=xyz`
4. Click → email verified
5. Login with email + password

### JWT Tokens
- Issued on login
- 24-hour expiration
- Includes user ID + role (admin/supplier)
- Required for all protected endpoints

---

## Deployment

### Easiest: Render.com
1. Push to GitHub
2. Connect repo to Render
3. Backend: Web Service (Python)
4. Frontend: Static Site (React build)
5. Free tier available

**See DEPLOYMENT.md for full options (Railway, AWS, Docker, etc.)**

---

## Environment Variables

Create `.env` or set in deployment platform:

```
SECRET_KEY=your-256-bit-random-string
DATABASE_URL=sqlite:///./lenovo_suppliers.db
ENVIRONMENT=development
```

---

## Excel Export Example

When admin clicks "Download All Submissions":

```
Supplier Name (Form) | Period | Tier | Customer | Supplier | Verified | ... | Submitted At
Acme Corp | Jul 2026 ... | Tier 2 | Tech Inc | Vendor A | ✓ | ... | 2026-09-17 ...
Acme Corp | Jul 2026 ... | Tier 2 | Tech Inc | Vendor B | | ✓ | ... | 2026-09-17 ...
```

---

## Common Issues

**Q: "Module not found" errors on startup?**
```bash
pip install -r requirements.txt
npm install
```

**Q: CORS errors when calling API?**
Update `backend.py` CORS origins to match your domain.

**Q: Supplier can't upload Excel?**
Ensure file is `.xlsx` or `.csv` with matching column names.

**Q: Lost data?**
Backup your `lenovo_suppliers.db` file regularly.

---

## Next Steps

1. ✅ Install and run locally
2. ✅ Create admin account
3. ✅ Invite test supplier
4. ✅ Test form submission
5. ✅ Test Excel upload
6. ✅ Test export
7. 🚀 Deploy to Render/Railway
8. 🚀 Invite real suppliers

---

## License

Internal Lenovo use only.

---

## Support

For issues or feature requests, contact your development team.
