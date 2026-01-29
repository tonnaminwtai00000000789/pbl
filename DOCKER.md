# Docker Setup for PBL-MY

## Overview
This Docker setup uses **Bun** runtime for faster installation and execution compared to Node.js.

## Quick Start

### Build and Run with Docker Compose
```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Build and Run with Docker Commands
```bash
# Build the image
docker build -t pbl-my-app .

# Run the container
docker run -p 3000:3000 pbl-my-app
```

## Access the Application
Once running, access your application at:
- Local: http://localhost:2554

## Environment Variables
If you need environment variables:
1. Create a `.env` file in the project root
2. Uncomment the `env_file` section in `docker-compose.yml`
3. Add your variables (example):
   ```
   NEXT_PUBLIC_API_URL=https://api.example.com
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   ```

## Common Commands
```bash
# Rebuild after code changes
docker-compose up -d --build

# Stop and remove containers
docker-compose down

# View running containers
docker ps

# Access container shell
docker exec -it pbl-my-app sh

# Remove unused Docker resources
docker system prune -a
```

## Production Deployment
For production servers:
1. Set environment variables appropriately
2. Use a reverse proxy (nginx) for HTTPS
3. Consider using Docker Swarm or Kubernetes for scaling

## Troubleshooting
- If port 3000 is already in use, change the port mapping in `docker-compose.yml`
- Clear Docker cache: `docker builder prune`
- Check logs: `docker-compose logs -f app`
