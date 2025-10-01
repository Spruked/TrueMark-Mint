#!/bin/bash

# =============================================================================
# TrueMark Mint - Deployment Script
# Automates the setup and deployment process
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main deployment function
main() {
    echo "======================================================================"
    echo "🏛️  TrueMark Mint - Deployment Script"
    echo "======================================================================"
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    echo ""
    
    # Environment setup
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_warning "Created .env file from template. Please edit it with your configuration."
        print_warning "Especially important: SECRET_KEY, JWT_SECRET, WEB3_PROVIDER_URL"
        echo ""
        read -p "Press Enter to continue after editing .env file..."
    fi
    
    # Choose deployment type
    echo "Select deployment type:"
    echo "1) Development (local testing)"
    echo "2) Production (with SSL and optimizations)"
    echo ""
    read -p "Enter your choice (1 or 2): " deploy_type
    
    case $deploy_type in
        1)
            deploy_development
            ;;
        2)
            deploy_production
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
}

# Development deployment
deploy_development() {
    print_status "Starting development deployment..."
    
    # Build and start services
    docker-compose build
    docker-compose up -d
    
    print_success "Development environment started!"
    print_status "Frontend: http://localhost:8080"
    print_status "Backend API: http://localhost:5000"
    print_status "Demo credentials: admin/truemark2025, demo/demo123"
    
    # Show logs
    echo ""
    print_status "Showing logs (Ctrl+C to exit):"
    docker-compose logs -f
}

# Production deployment
deploy_production() {
    print_status "Starting production deployment..."
    
    # Additional production checks
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        print_warning "SSL certificates not found. HTTPS will not be available."
        print_status "To enable HTTPS, place cert.pem and key.pem in the ssl/ directory"
    fi
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Production environment started!"
    print_status "Application: http://localhost"
    print_status "API: http://localhost/api"
    
    # Health check
    print_status "Performing health check..."
    sleep 10
    
    if curl -f http://localhost/health >/dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed. Check logs for details."
    fi
    
    # Show logs
    echo ""
    print_status "Showing logs (Ctrl+C to exit):"
    docker-compose -f docker-compose.prod.yml logs -f
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    docker-compose down
    print_status "Cleanup completed"
}

# Handle interrupts
trap cleanup EXIT

# Run main function
main "$@"