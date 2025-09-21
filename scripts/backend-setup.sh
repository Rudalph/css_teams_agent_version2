#!/bin/bash

# Backend-only setup script for AWS EC2
set -e

echo "Setting up EC2 instance for backend-only deployment..."

# Update system
sudo dnf update -y

# Install Python 3.11
echo "Installing Python 3.11..."
sudo dnf install -y python3.11 python3.11-pip python3.11-devel

# Install build tools (required for ML libraries)
echo "Installing build tools..."
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y gcc gcc-c++ make

# Install Git
echo "Installing Git..."
sudo dnf install -y git

# Install Nginx
echo "Installing Nginx..."
sudo dnf install -y nginx

# Clone repository
echo "Cloning repository..."
cd /home/ec2-user
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git css_teams_agent_version2
cd css_teams_agent_version2

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
pip3.11 install -r requirements.txt
cd ..

# Create Flask systemd service
echo "Creating Flask systemd service..."
sudo tee /etc/systemd/system/flask-app.service > /dev/null <<EOF
[Unit]
Description=Flask Backend Application
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/css_teams_agent_version2/backend
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/local/bin/gunicorn --bind 0.0.0.0:5000 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx for backend only
echo "Configuring Nginx for backend..."
sudo tee /etc/nginx/conf.d/backend-api.conf > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # Backend API routes
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers for Vercel frontend
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF

# Start and enable services
echo "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable flask-app
sudo systemctl enable nginx
sudo systemctl start flask-app
sudo systemctl start nginx

# Check service status
echo "Checking service status..."
sudo systemctl status flask-app --no-pager
sudo systemctl status nginx --no-pager

echo "Backend setup completed successfully!"
echo "Your backend API should be accessible at http://3.7.138.224"
echo "API endpoints:"
echo "  - POST http://3.7.138.224/ask"
echo "  - GET http://3.7.138.224/keep_alive"
