# Lenovo Supplier Diversity Platform - Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 16+
- pip, npm

### 1. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn backend:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## Cost-Effective Deployment Options

### Option 1: Render (Recommended - Free tier available)

**Backend on Render:**

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repo
5. Settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend:app --host 0.0.0.0 --port $PORT`
   - Environment: Add `SECRET_KEY=your-random-secret-key`
6. Deploy

**Frontend on Render:**

1. Same GitHub connection
2. Create new "Static Site"
3. Settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. Deploy

**Estimated Cost:** Free tier (limited) or $7/month per service

---

### Option 2: Railway (Simple & Cost-Effective)

**Backend:**

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add `PORT` environment variable
4. Deploy

**Frontend:**

1. Same project
2. Add second service for frontend
3. Set build & start commands
4. Deploy

**Estimated Cost:** $5/month

---

### Option 3: AWS (Lightsail) - Full Control

**Setup:**

```bash
# SSH into Lightsail instance
ssh -i key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip nodejs npm nginx

# Clone repo
git clone your-repo-url
cd lenovo-supplier-diversity

# Backend setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service for backend
sudo nano /etc/systemd/system/lenovo-backend.service
```

Add this content:
```ini
[Unit]
Description=Lenovo Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/lenovo-supplier-diversity
Environment="PATH=/home/ubuntu/lenovo-supplier-diversity/venv/bin"
ExecStart=/home/ubuntu/lenovo-supplier-diversity/venv/bin/python -m uvicorn backend:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl enable lenovo-backend
sudo systemctl start lenovo-backend

# Frontend build
npm run build

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/default
```

Nginx config:
```nginx
server {
    listen 80 default_server;
    server_name _;

    root /home/ubuntu/lenovo-supplier-diversity/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
    }
}
```

```bash
sudo systemctl restart nginx
```

**Estimated Cost:** $3.50-5/month (Lightsail micro)

---

### Option 4: Docker + Self-Hosted (Ultimate Control)

**Create Dockerfile:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Backend
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend.py .
COPY *.py .

EXPOSE 8000

CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SECRET_KEY=your-secret-key
    volumes:
      - ./lenovo_suppliers.db:/app/lenovo_suppliers.db

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:3000"
    depends_on:
      - backend
```

---

## Production Checklist

- [ ] Change `SECRET_KEY` to random value
- [ ] Set `ENVIRONMENT=production`
- [ ] Enable HTTPS (use Let's Encrypt with Certbot)
- [ ] Add database backup strategy
- [ ] Set up monitoring/logging
- [ ] Enable CORS only for your domain
- [ ] Add rate limiting
- [ ] Use environment variables for sensitive data
- [ ] Regular security updates

---

## Environment Variables

Create `.env` file:

```
SECRET_KEY=your-random-256-bit-key
ENVIRONMENT=production
DATABASE_URL=sqlite:///lenovo_suppliers.db
ADMIN_EMAIL=admin@yourcompany.com
```

---

## Database Backups

Automated backup script:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp lenovo_suppliers.db "backups/lenovo_suppliers_${DATE}.db"
```

Schedule with cron:
```bash
0 2 * * * /home/ubuntu/lenovo-supplier-diversity/backup.sh
```

---

## Email Verification Flow (Currently Manual)

To enable automatic emails, add:

```python
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

conf = ConnectionConfig(
    mail_from="noreply@lenovosupplierdiversity.com",
    mail_password="your-app-password",
    mail_from_name="Lenovo Supplier Diversity"
)

# Send verification email
message = MessageSchema(
    subject="Verify Your Email - Lenovo Supplier Diversity",
    recipients=[email],
    body=f"Click here to verify: https://yoururl.com/verify?token={token}"
)
```

---

## Scaling Tips

- **Database:** Switch to PostgreSQL for concurrent users
- **Caching:** Add Redis for session management
- **CDN:** Use Cloudflare for static asset caching
- **Load Balancing:** Use AWS ALB/NLB if traffic grows

---

## Support & Troubleshooting

**Port already in use:**
```bash
lsof -i :8000  # Find process
kill -9 <PID>
```

**Database locked:**
```bash
rm lenovo_suppliers.db
# Restart - new DB will be created
```

**CORS errors:**
Update `backend.py` origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
)
```

---

## Next Steps

1. Deploy backend to Render/Railway
2. Deploy frontend to same service
3. Test email verification flow
4. Set up admin account
5. Invite first suppliers
6. Monitor logs
