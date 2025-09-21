#!/bin/bash

# Backend-only deployment script
set -e

echo "Starting backend deployment..."

# Navigate to project directory
cd /home/ec2-user/css_teams_agent_version2

# Pull latest changes
echo "Pulling latest changes from GitHub..."
git pull origin main

# Install/update Python dependencies
echo "Installing/updating Python dependencies..."
cd backend
pip3.11 install -r requirements.txt
cd ..

# Restart Flask service
echo "Restarting Flask service..."
sudo systemctl restart flask-app

# Check service status
echo "Checking Flask service status..."
sudo systemctl status flask-app --no-pager

# Test API endpoint
echo "Testing API endpoint..."
sleep 5
curl -X GET http://localhost:5000/keep_alive || echo "API test failed"

echo "Backend deployment completed successfully!"
echo "API is available at: http://3.7.138.224"