#!/bin/bash

echo "🔴 Lenovo Supplier Diversity - Setup"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check Python
echo -e "${PURPLE}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.9+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version)${NC}"

# Check Node
echo ""
echo -e "${PURPLE}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 16+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Setup Backend
echo ""
echo -e "${PURPLE}Setting up Backend...${NC}"
python3 -m venv venv
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
pip install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Setup Frontend
echo ""
echo -e "${PURPLE}Setting up Frontend...${NC}"
npm install > /dev/null 2>&1
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Create .env if needed
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${PURPLE}Creating .env file...${NC}"
    cat > .env << EOF
SECRET_KEY=$(openssl rand -hex 32)
ENVIRONMENT=development
DATABASE_URL=sqlite:///./lenovo_suppliers.db
EOF
    echo -e "${GREEN}✓ .env created with random SECRET_KEY${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}===================================="
echo "Setup Complete! 🎉${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "${RED}Backend:${NC}"
echo "  source venv/bin/activate  # or: venv\\Scripts\\activate (Windows)"
echo "  python -m uvicorn backend:app --reload"
echo "  → http://localhost:8000"
echo ""
echo -e "${PURPLE}Frontend (new terminal):${NC}"
echo "  npm run dev"
echo "  → http://localhost:3000"
echo ""
echo -e "${GREEN}Then:${NC}"
echo "  1. Go to http://localhost:3000"
echo "  2. Register as Admin"
echo "  3. Invite a supplier"
echo "  4. Test the form!"
echo ""
