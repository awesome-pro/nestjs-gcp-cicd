# CI/CD Pipeline for Nestjs Backend (Mock)

This directory contains the GitHub Actions workflows that implement the CI/CD pipeline for the Nestjs backend application.

## Workflow Overview

1. **Build and Push to Docker Hub** (`build.yml`)
   - Triggered on push to the `main` branch
   - Builds the Docker image
   - Pushes the image to Docker Hub with two tags:
     - `docker-username/nestjs-app:latest`
     - `docker-usernames/nestjs-app:<commit-sha>`

2. **Deploy to GCE** (`deploy.yml`)
   - Triggered after successful completion of the Build workflow
   - Connects to the GCE instance via SSH
   - Deploys the latest Docker image
   - Performs health checks and automatic rollback if needed

## Required Secrets

The following secrets must be configured in your GitHub repository:

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token
- `GCE_IP`: The IP address of your Google Cloud VM
- `GCE_USERNAME`: The username for SSH access to your VM
- `GCE_SSH_KEY`: The private SSH key for accessing your VM

## Deployment Process

1. The latest image is pulled from Docker Hub
2. The current running container (if any) is stopped and removed
3. A new container is started with the latest image
4. Health checks are performed to verify the deployment
5. If health checks fail, an automatic rollback to the previous version is performed

## Rollback Process

A rollback history is maintained on the server in `/home/user/rollback_history.txt`.

To manually trigger a rollback:

```bash
# SSH into your GCE instance
ssh username@your-gce-ip

# Run the rollback script
/home/user/rollback.sh
```

This will rollback to the previous version. You can also specify a specific version:

```bash
/home/user/rollback.sh specific-version-tag
```

## Verification

A verification script is available to check the status of your deployment:

```bash
# SSH into your GCE instance
ssh username@your-gce-ip

# Run the verification script
/home/user/verify-deployment.sh
```

This will check:
- If the container is running
- If the application is healthy
- If there are any errors in the logs
- Resource usage statistics
