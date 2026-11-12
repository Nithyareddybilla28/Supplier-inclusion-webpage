from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, JSON, Text, inspect, text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import hashlib
import os
import pandas as pd
import secrets
from io import BytesIO
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ============ CONFIG ============
DATABASE_URL = "sqlite:///./lenovo_suppliers.db"
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

EXCEL_CATEGORY_COLUMNS = {
    "MBE": ("MBE - Total Category Spend ($ USD)", "MBE - Allocation %", "MBE - Total"),
    "WBE": ("WBE - Total Category Spend ($ USD)", "WBE - Allocation %", "WBE - Total"),
    "LGBT": ("LGBT - Total Category Spend ($ USD)", "LGBT - Allocation %", "LGBT - Total"),
    "VET": ("VET - Total Category Spend ($ USD)", "VET - Allocation %", "VET - Total"),
    "Disabled": ("Disabled - Total Category Spend ($ USD)", "Disabled - Allocation %", "Disabled - Total"),
    "DBE": ("DBE - Total Category Spend ($ USD)", "DBE - Allocation %", "DBE - Total"),
    "SDV": ("Service Disabled Veteran - Total Category Spend ($ USD)", "Service Disabled Veteran - Allocation %", "Service Disabled Veteran - Total"),
    "SmallBusiness": ("Small Business - Total Category Spend ($ USD)", "Small Business - Allocation %", "Small Business - Total")
}
EXCEL_BASE_COLUMNS = [
    "Quarter", "Region", "Business Email", "Tax ID", "Company Name",
    "Total Sales This Period ($)", "Sales to Lenovo ($)", "Allocation %"
]
EXCEL_COLUMNS = [
    *EXCEL_BASE_COLUMNS,
    *(column for columns in EXCEL_CATEGORY_COLUMNS.values() for column in columns),
    "Comments"
]
EXCEL_EXPORT_COLUMNS = [
    *EXCEL_BASE_COLUMNS,
    *(columns[2] for columns in EXCEL_CATEGORY_COLUMNS.values()),
    "Comments"
]

# ============ DATABASE SETUP ============
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============ MODELS ============
class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True)
    admin_id = Column(Integer)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    is_verified = Column(Boolean, default=False)
    sub_user_ids = Column(JSON, default=list)  # List of sub-user emails allowed access
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)

class SupplierSubmission(Base):
    __tablename__ = "supplier_submissions"

    id = Column(Integer, primary_key=True)
    supplier_id = Column(Integer)
    period = Column(String)  # e.g., "Jan - Mar 2026"
    region = Column(String, nullable=True)
    tier = Column(String)  # e.g., "Tier 2"
    business_email = Column(String)
    tax_id = Column(String)
    customer_name = Column(String)  # Customer name
    total_sales = Column(Float, default=0)
    sales_to_customer = Column(Float, default=0)
    suppliers_data = Column(JSON)  # Array of supplier records (now includes efforts per category)
    comments = Column(Text, nullable=True)  # Comments field
    file_upload_path = Column(String, nullable=True)  # Path if uploaded via Excel
    submitted_at = Column(DateTime, default=datetime.utcnow)
    last_modified = Column(DateTime, default=datetime.utcnow)

class VerificationToken(Base):
    __tablename__ = "verification_tokens"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, index=True)
    token = Column(String, unique=True, index=True)
    supplier_id = Column(Integer, nullable=True)
    admin_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

# Create tables
Base.metadata.create_all(bind=engine)

# Add columns when starting against a database created by an earlier version.
submission_columns = {column["name"] for column in inspect(engine).get_columns("supplier_submissions")}
with engine.begin() as connection:
    if "total_sales" not in submission_columns:
        connection.execute(text("ALTER TABLE supplier_submissions ADD COLUMN total_sales FLOAT DEFAULT 0"))
    if "sales_to_customer" not in submission_columns:
        connection.execute(text("ALTER TABLE supplier_submissions ADD COLUMN sales_to_customer FLOAT DEFAULT 0"))
    if "comments" not in submission_columns:
        connection.execute(text("ALTER TABLE supplier_submissions ADD COLUMN comments TEXT"))
    if "business_email" not in submission_columns:
        connection.execute(text("ALTER TABLE supplier_submissions ADD COLUMN business_email VARCHAR"))
    if "tax_id" not in submission_columns:
        connection.execute(text("ALTER TABLE supplier_submissions ADD COLUMN tax_id VARCHAR"))
    if "region" not in submission_columns:
        connection.execute(text("ALTER TABLE supplier_submissions ADD COLUMN region VARCHAR"))

# ============ SCHEMAS ============
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str  # "admin" or "supplier"
    user_id: int

class AdminRegisterRequest(BaseModel):
    email: str
    password: str

class SupplierRecord(BaseModel):
    name: str
    allocation_percent: float
    allocated_spend: float
    confidential: bool = False
    efforts: str = ""

class SubmissionRequest(BaseModel):
    period: str
    region: str = ""
    tier: str
    business_email: str
    tax_id: str = ""
    is_edit: bool = False
    no_activity: bool = False
    customer_name: str
    total_sales: float = 0
    sales_to_customer: float = 0
    comments: str = ""
    suppliers: list[SupplierRecord]

class AllocationCalculationRequest(BaseModel):
    total_sales: float
    sales_to_customer: float

class AllocationCalculationResponse(BaseModel):
    allocation_percent: float
    total_sales: float
    sales_to_customer: float

class SubmissionResponse(BaseModel):
    id: int
    supplier_id: int
    period: str
    region: Optional[str] = None
    tier: str
    customer_name: str
    suppliers_data: list
    submitted_at: datetime

    class Config:
        from_attributes = True

class SupplierListItem(BaseModel):
    id: int
    name: str
    email: str
    is_verified: bool
    created_at: datetime
    last_updated: datetime

    class Config:
        from_attributes = True

# ============ AUTHENTICATION ============
security = HTTPBearer()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hash: str) -> bool:
    return hash_password(password) == hash

def create_access_token(user_id: int, role: str, expires_delta: timedelta = None):
    if expires_delta is None:
        expires_delta = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": str(user_id), "role": role, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials, db: Session):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id, role
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============ ROUTES ============
app = FastAPI(title="Lenovo Supplier Diversity")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- CALCULATION ROUTE ----
@app.post("/api/calculate-allocation", response_model=AllocationCalculationResponse)
def calculate_allocation(req: AllocationCalculationRequest):
    """Calculate customer allocation percentage"""
    if req.total_sales == 0:
        raise HTTPException(status_code=400, detail="Total sales must be greater than 0")
    
    allocation_percent = (req.sales_to_customer / req.total_sales) * 100
    
    return AllocationCalculationResponse(
        allocation_percent=round(allocation_percent, 2),
        total_sales=req.total_sales,
        sales_to_customer=req.sales_to_customer
    )

# ---- ADMIN ROUTES ----
@app.post("/api/admin/register", response_model=TokenResponse)
def admin_register(req: AdminRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(AdminUser).filter(AdminUser.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin already registered")
    
    admin = AdminUser(
        email=req.email,
        password_hash=hash_password(req.password)
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    token = create_access_token(admin.id, "admin")
    return TokenResponse(access_token=token, token_type="bearer", role="admin", user_id=admin.id)

@app.post("/api/admin/login", response_model=TokenResponse)
def admin_login(req: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == req.email).first()
    if not admin or not verify_password(req.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(admin.id, "admin")
    return TokenResponse(access_token=token, token_type="bearer", role="admin", user_id=admin.id)

@app.get("/api/admin/suppliers")
def get_suppliers(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user_id, role = verify_token(credentials, db)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    suppliers = db.query(Supplier).filter(Supplier.admin_id == user_id).all()
    return [SupplierListItem.from_orm(s) for s in suppliers]

@app.post("/api/admin/suppliers/invite")
def invite_supplier(email: str, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user_id, role = verify_token(credentials, db)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = db.query(Supplier).filter(Supplier.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier already exists")
    
    token = secrets.token_urlsafe(32)
    supplier = Supplier(
        admin_id=user_id,
        email=email,
        name=""  # Will be filled on first login
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    
    verification = VerificationToken(
        email=email,
        token=token,
        supplier_id=supplier.id,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(verification)
    db.commit()
    
    return {"message": "Invitation sent", "verification_link": f"/verify?token={token}"}

@app.get("/api/admin/submissions")
def get_all_submissions(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user_id, role = verify_token(credentials, db)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    submissions = db.query(SupplierSubmission).join(
        Supplier, SupplierSubmission.supplier_id == Supplier.id
    ).filter(Supplier.admin_id == user_id).all()
    
    return submissions

@app.post("/api/admin/export-excel")
def export_excel(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user_id, role = verify_token(credentials, db)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    submissions = db.query(SupplierSubmission).join(
        Supplier, SupplierSubmission.supplier_id == Supplier.id
    ).filter(Supplier.admin_id == user_id).all()
    
    rows = []
    for sub in submissions:
        row = {
            "Quarter": sub.period,
            "Region": sub.region or "",
            "Business Email": sub.business_email or "",
            "Tax ID": sub.tax_id or "",
            "Company Name": sub.customer_name,
            "Total Sales This Period ($)": sub.total_sales or 0,
            "Sales to Lenovo ($)": sub.sales_to_customer or 0,
            "Allocation %": (sub.suppliers_data[0].get("allocation_percent", 0)
                             if sub.suppliers_data else 0),
            "Comments": sub.comments or ""
        }
        for category_data in sub.suppliers_data or []:
            category_columns = EXCEL_CATEGORY_COLUMNS.get(category_data.get("name", ""))
            if not category_columns:
                continue
            allocation_percent = category_data.get("allocation_percent") or 0
            row[category_columns[2]] = round(
                (category_data.get("allocated_spend") or 0) * allocation_percent / 100,
                2
            )
        rows.append(row)
    
    df = pd.DataFrame(rows, columns=EXCEL_EXPORT_COLUMNS)
    output = BytesIO()
    df.to_excel(output, index=False, engine='openpyxl')
    output.seek(0)
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=supplier_submissions.xlsx"}
    )

# ---- SUPPLIER ROUTES ----
@app.post("/api/supplier/verify")
def verify_supplier(token: str, db: Session = Depends(get_db)):
    verification = db.query(VerificationToken).filter(
        VerificationToken.token == token,
        VerificationToken.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    supplier = db.query(Supplier).filter(Supplier.id == verification.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier.is_verified = True
    db.delete(verification)
    db.commit()
    
    return {"message": "Email verified. You can now log in."}

@app.post("/api/supplier/login", response_model=TokenResponse)
def supplier_login(req: LoginRequest, db: Session = Depends(get_db)):
    # Universal supplier login - anyone can login with supplier@lenovo.com / Lenovo123
    if req.email == "supplier@lenovo.com" and req.password == "Lenovo123":
        # Create or get universal supplier account
        supplier = db.query(Supplier).filter(Supplier.email == "supplier@lenovo.com").first()
        if not supplier:
            # Get first admin or use admin_id=1
            first_admin = db.query(AdminUser).first()
            admin_id = first_admin.id if first_admin else 1
            
            supplier = Supplier(
                admin_id=admin_id,
                email="supplier@lenovo.com",
                name="Supplier Portal",
                is_verified=True
            )
            db.add(supplier)
            db.commit()  # Commit immediately
            db.refresh(supplier)  # Refresh to get the ID
        
        token = create_access_token(supplier.id, "supplier")
        return TokenResponse(access_token=token, token_type="bearer", role="supplier", user_id=supplier.id)
    
    # Also allow individual supplier logins if they were invited
    supplier = db.query(Supplier).filter(Supplier.email == req.email).first()
    if not supplier or not supplier.is_verified:
        raise HTTPException(status_code=401, detail="Invalid credentials. Try: supplier@lenovo.com / Lenovo123")
    
    # For suppliers, we use email as password (simplified for MVP)
    if req.password != supplier.email:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    token = create_access_token(supplier.id, "supplier")
    return TokenResponse(access_token=token, token_type="bearer", role="supplier", user_id=supplier.id)

@app.post("/api/supplier/submit-form")
def submit_form(sub: SubmissionRequest, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    supplier_id, role = verify_token(credentials, db)
    if role != "supplier":
        raise HTTPException(status_code=403, detail="Supplier access required")

    period = sub.period.strip()
    region = sub.region.strip()
    normalized_email = str(sub.business_email).strip().lower()
    tax_id = sub.tax_id.strip()

    if region and region not in {"NA", "EMEA"}:
        raise HTTPException(status_code=400, detail="Region must be NA or EMEA")
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail=f"Supplier not found (ID: {supplier_id})")

    # Update supplier name if not set
    if not supplier.name or supplier.name == "Supplier Portal":
        supplier.name = sub.customer_name

    suppliers_data = [s.dict() for s in sub.suppliers]
    total_sales = 0 if sub.no_activity else sub.total_sales
    sales_to_customer = 0 if sub.no_activity else sub.sales_to_customer
    if sub.no_activity:
        for supplier_data in suppliers_data:
            supplier_data["allocation_percent"] = 0
            supplier_data["allocated_spend"] = 0

    if sub.is_edit:
        matches = db.query(SupplierSubmission).filter(
            SupplierSubmission.supplier_id == supplier_id,
            SupplierSubmission.period == period,
            func.coalesce(SupplierSubmission.region, "") == region,
            func.lower(SupplierSubmission.business_email) == normalized_email,
            func.coalesce(SupplierSubmission.tax_id, "") == tax_id
        ).all()
        if not matches:
            raise HTTPException(
                status_code=404,
                detail="No previous submission was found for this period, region, business email, and tax ID."
            )
        if len(matches) > 1:
            raise HTTPException(
                status_code=409,
                detail="More than one previous submission matches these details. Contact an administrator."
            )

        submission = matches[0]
        submission.period = period
        submission.region = region
        submission.tier = "Tier 2"
        submission.business_email = normalized_email
        submission.tax_id = tax_id
        submission.customer_name = sub.customer_name
        submission.total_sales = total_sales
        submission.sales_to_customer = sales_to_customer
        submission.suppliers_data = suppliers_data
        submission.comments = sub.comments
        submission.last_modified = datetime.utcnow()
    else:
        duplicate = db.query(SupplierSubmission).filter(
            SupplierSubmission.period == period,
            func.lower(SupplierSubmission.business_email) == normalized_email
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="A submission already exists for this business email and quarter")

        submission = SupplierSubmission(
            supplier_id=supplier_id,
            period=period,
            region=region,
            tier="Tier 2",
            business_email=normalized_email,
            tax_id=tax_id,
            customer_name=sub.customer_name,
            total_sales=total_sales,
            sales_to_customer=sales_to_customer,
            suppliers_data=suppliers_data,
            comments=sub.comments
        )
        db.add(submission)

    db.commit()
    db.refresh(submission)
    return {
        "id": submission.id,
        "supplier_id": submission.supplier_id,
        "period": submission.period,
        "region": submission.region,
        "tier": submission.tier,
        "customer_name": submission.customer_name,
        "total_sales": submission.total_sales,
        "sales_to_customer": submission.sales_to_customer,
        "suppliers_data": submission.suppliers_data,
        "comments": submission.comments,
        "submitted_at": submission.submitted_at
    }

@app.post("/api/supplier/upload-excel")
async def upload_excel(file: UploadFile = File(...), credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    supplier_id, role = verify_token(credentials, db)
    if role != "supplier":
        raise HTTPException(status_code=403, detail="Supplier access required")
    
    try:
        df = pd.read_excel(file.file)
        category_allocation_columns = {
            columns[1] for columns in EXCEL_CATEGORY_COLUMNS.values()
        }
        missing_columns = [
            column for column in EXCEL_COLUMNS
            if column != "Region"
            and column not in category_allocation_columns
            and column not in df.columns
        ]
        if missing_columns:
            raise ValueError(f"Missing template columns: {', '.join(missing_columns)}")
        if len(df) != 1:
            raise ValueError("The template must contain exactly one submission row.")

        row = df.iloc[0]
        def text_value(value):
            return "" if pd.isna(value) else str(value).strip()

        def number_value(value):
            return 0 if pd.isna(value) or value == "" else float(value)

        period = text_value(row["Quarter"])
        region = text_value(row["Region"]) if "Region" in df.columns else ""
        if region and region not in {"NA", "EMEA"}:
            raise ValueError("Region must be NA or EMEA.")
        business_email = text_value(row["Business Email"]).lower()
        tax_id = text_value(row["Tax ID"])
        customer_name = text_value(row["Company Name"])
        total_sales = number_value(row["Total Sales This Period ($)"])
        sales_to_customer = number_value(row["Sales to Lenovo ($)"])
        allocation_percent = number_value(row["Allocation %"])
        suppliers_data = [
            {
                "name": category,
                "allocation_percent": (
                    number_value(row[allocation_column])
                    if allocation_column in df.columns
                    else allocation_percent
                ),
                "allocated_spend": number_value(row[spend_column]),
                "confidential": False,
            }
            for category, (spend_column, allocation_column, _) in EXCEL_CATEGORY_COLUMNS.items()
        ]
        if not period or not business_email or not customer_name:
            raise ValueError("Quarter, Business Email, and Company Name are required.")
        duplicate = db.query(SupplierSubmission).filter(
            SupplierSubmission.period == period,
            func.lower(SupplierSubmission.business_email) == business_email
        ).first()
        if duplicate:
            raise ValueError("A submission already exists for this business email and quarter.")
        
        submission = SupplierSubmission(
            supplier_id=supplier_id,
            period=period,
            region=region,
            tier="Tier 2",
            business_email=business_email,
            tax_id=tax_id,
            customer_name=customer_name,
            total_sales=total_sales,
            sales_to_customer=sales_to_customer,
            suppliers_data=suppliers_data,
            comments=text_value(row["Comments"]),
            file_upload_path=file.filename
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        return {
            "id": submission.id,
            "supplier_id": submission.supplier_id,
            "period": submission.period,
            "region": submission.region,
            "tier": submission.tier,
            "customer_name": submission.customer_name,
            "suppliers_data": submission.suppliers_data,
            "submitted_at": submission.submitted_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel processing failed: {str(e)}")

@app.get("/api/supplier/submissions")
def get_supplier_submissions(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    supplier_id, role = verify_token(credentials, db)
    if role != "supplier":
        raise HTTPException(status_code=403, detail="Supplier access required")
    
    submissions = db.query(SupplierSubmission).filter(SupplierSubmission.supplier_id == supplier_id).all()
    return submissions

@app.get("/api/supplier/profile")
def get_supplier_profile(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    supplier_id, role = verify_token(credentials, db)
    if role != "supplier":
        raise HTTPException(status_code=403, detail="Supplier access required")
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    return SupplierListItem.from_orm(supplier)

# ---- DOWNLOAD TEMPLATE ----
@app.get("/api/download-template")
def download_template():
    """Download Excel template for suppliers"""
    df = pd.DataFrame(columns=EXCEL_COLUMNS)
    
    output = BytesIO()
    df.to_excel(output, index=False, engine='openpyxl')
    output.seek(0)
    return output

if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/")
    async def serve_react():
        return FileResponse("dist/index.html")

    @app.get("/{full_path:path}")
    async def react_router(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        return FileResponse("dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
