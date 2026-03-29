#!/bin/bash
# =============================================================================
# Violet ERP - Production Deployment Script
# Para Linux/Ubuntu Server
# =============================================================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      VIOLET ERP - DEPLOYMENT SCRIPT                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (sudo ./deploy.sh)"
    exit 1
fi

# Update system
log_info "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x
log_info "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
log_info "Installing pnpm..."
npm install -g pnpm

# Install PM2
log_info "Installing PM2..."
npm install -g pm2

# Install Nginx
log_info "Installing Nginx..."
apt install -y nginx

# Install Firebird
log_info "Installing Firebird..."
apt install -y firebird3.0

# Install Redis (optional)
log_warn "Installing Redis (optional)..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Create application directory
log_info "Creating application directory..."
mkdir -p /var/www/violet-erp
cd /var/www/violet-erp

# Clone or copy application
log_info "Copying application files..."
# git clone <repository-url> .
# Or copy from local directory

# Install dependencies
log_info "Installing dependencies..."
pnpm install --prod

# Build application
log_info "Building application..."
pnpm run build

# Create logs directory
mkdir -p logs

# Create uploads directory
mkdir -p uploads
chown -R www-data:www-data uploads

# Copy Nginx configuration
log_info "Configuring Nginx..."
cp /var/www/violet-erp/backend/api/nginx.conf /etc/nginx/sites-available/violet-erp
ln -sf /etc/nginx/sites-available/violet-erp /etc/nginx/sites-enabled/violet-erp

# Test Nginx configuration
nginx -t

# Copy PM2 configuration
log_info "Configuring PM2..."
cp /var/www/violet-erp/backend/api/ecosystem.config.cjs /var/www/violet-erp/

# Create .env.production
log_info "Creating production environment..."
cp .env.example .env.production
# Edit .env.production with production values

# Start application with PM2
log_info "Starting application with PM2..."
cd /var/www/violet-erp/backend/api
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

# Enable and start Nginx
log_info "Starting Nginx..."
systemctl enable nginx
systemctl restart nginx

# Setup SSL with Let's Encrypt
log_warn "Setting up SSL with Let's Encrypt..."
apt install -y certbot python3-certbot-nginx
# certbot --nginx -d violet-erp.com -d www.violet-erp.com

# Setup firewall
log_info "Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow 'Node.js'
ufw allow 'Firebird'
ufw --force enable

# Create backup script
log_info "Creating backup script..."
cat > /usr/local/bin/violet-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/violet-erp"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
gbak -b -v -user SYSDBA -password masterkey /var/lib/firebird/data/valery3.fdb $BACKUP_DIR/database_$DATE.fbk

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/violet-erp/uploads

# Keep only last 30 backups
find $BACKUP_DIR -name "*.fbk" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/violet-backup

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/violet-backup") | crontab -

# Final checks
log_info "Running final checks..."
systemctl status nginx --no-pager
pm2 status

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          DEPLOYMENT COMPLETED                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Application URLs:"
echo "  Frontend: https://violet-erp.com"
echo "  Backend:  https://violet-erp.com/api"
echo "  Health:   https://violet-erp.com/health"
echo ""
echo "PM2 Commands:"
echo "  pm2 status              - Check status"
echo "  pm2 logs violet-erp-api - View logs"
echo "  pm2 restart violet-erp-api - Restart"
echo "  pm2 monit               - Monitor"
echo ""
echo "Backup Command:"
echo "  sudo violet-backup"
echo ""
