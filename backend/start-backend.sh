#!/usr/bin/env bash
# Always start backend on Railway MySQL. Frees port 8080 first so Run does not exit instantly.
cd "$(dirname "$0")"
chmod +x stop-backend.sh 2>/dev/null || true
./stop-backend.sh

export SPRING_DATASOURCE_URL='jdbc:mysql://monorail.proxy.rlwy.net:29128/railway?useSSL=true&requireSSL=true&serverTimezone=Europe/Istanbul'
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD='BdnElCroOfUEQvHnRnBxDUIWVMWhVDLg'

export MAIL_USERNAME=pavia.noreply@gmail.com
export MAIL_FROM=pavia.noreply@gmail.com
export MAIL_PASSWORD=yxvbxgxsvlwronid

echo "Starting backend on http://localhost:8080 (Railway DB)..."
exec ./mvnw spring-boot:run
