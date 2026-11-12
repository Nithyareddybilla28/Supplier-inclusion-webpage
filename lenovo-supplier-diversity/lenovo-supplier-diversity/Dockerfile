
FROM node:22-bookworm

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Install Python dependencies
COPY requirements.txt ./
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Build frontend
RUN npm run build

# Start application
CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port $PORT"]
