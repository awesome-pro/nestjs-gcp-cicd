NestJS CI/CD Pipeline with Google Cloud, Docker, and GitHub Actions
Welcome to the repository for my NestJS application with a fully automated CI/CD pipeline! This project demonstrates how to deploy a NestJS app to Google Cloud Compute Engine using Docker, Docker Hub, and GitHub Actions. Every push to the main branch triggers a pipeline that builds, tests, and deploys the app to production with minimal downtime. Below, I’ll walk you through the setup, how it works, and how you can replicate it.
📖 Overview
The goal of this project was to create a seamless deployment workflow where code changes are automatically built, packaged into a Docker image, pushed to Docker Hub, and deployed to a Google Cloud Compute Engine VM. This eliminates manual deployment steps, reduces errors, and ensures the app is always running the latest version.
Tools Used

NestJS: A progressive Node.js framework for building scalable server-side applications.
Docker: For containerizing the app to ensure consistency across environments.
Docker Hub: The registry for storing and distributing Docker images.
GitHub Actions: For automating the CI/CD pipeline.
Google Cloud Compute Engine: The hosting environment for the production app.

🛠️ How It Works
The CI/CD pipeline follows these steps:

Code Push: A commit or push to the main branch triggers the pipeline.
Build Docker Image: GitHub Actions builds a Docker image from the app’s code.
Push to Docker Hub: The image is tagged and pushed to Docker Hub.
Deploy to Compute Engine: The latest image is pulled to the Compute Engine VM, the old container is stopped, and a new container is started.
Cleanup: Unused Docker images are removed to save disk space.

📂 Project Structure
Key files in this repository:

Dockerfile: Defines how the NestJS app is containerized.
.github/workflows/cicd.yml: The GitHub Actions workflow for building, pushing, and deploying the app.
[src/]: Contains the NestJS application code.

🚀 Setup Instructions
Follow these steps to set up your own CI/CD pipeline like this one.
Prerequisites

A NestJS app (or any Node.js app).
A Docker Hub account.
A Google Cloud Platform account with a Compute Engine VM set up.
A GitHub repository for your project.
Basic knowledge of Docker, GitHub Actions, and Google Cloud.

Step 1: Containerize the App

Create a Dockerfile in the root of your project to define the app’s container. Here’s what mine looks like:FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]


Test the Docker image locally:docker build -t my-nestjs-app .
docker run -p 3000:3000 my-nestjs-app


Push your code to the GitHub repository.

Step 2: Set Up Docker Hub

Create a repository on Docker Hub (e.g., myusername/my-nestjs-app).
Note down your Docker Hub username and create an access token for authentication.

Step 3: Configure GitHub Actions

Create a file at .github/workflows/cicd.yml in your repository. The workflow builds the Docker image, pushes it to Docker Hub, and deploys it to the Compute Engine VM. See the workflow file for details.
Add the following GitHub Secrets in your repository settings:
DOCKER_USERNAME: Your Docker Hub username.
DOCKER_PASSWORD: Your Docker Hub access token.
GCE_HOST: The public IP address of your Compute Engine VM.
GCE_USERNAME: The SSH username for the VM.
GCE_SSH_KEY: The private SSH key for accessing the VM.To add secrets, go to Settings > Secrets and variables > Actions > New repository secret.



Step 4: Configure Google Cloud Compute Engine

Create a Compute Engine VM on Google Cloud (e.g., an e2-micro instance with Ubuntu 20.04).
Install Docker on the VM:sudo apt-get update
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER


Configure the VM’s firewall to allow:
SSH (port 22) for GitHub Actions to connect.
HTTP (port 80) for accessing the app.


Set up SSH access:
Generate an SSH key pair locally: ssh-keygen -t rsa -b 4096.
Copy the public key to the VM’s ~/.ssh/authorized_keys.
Store the private key as GCE_SSH_KEY in GitHub Secrets.



Step 5: Test the Pipeline

Push a change to the main branch.
Go to the Actions tab in your GitHub repository to monitor the workflow.
Verify the app is updated by visiting the VM’s public IP in a browser.
Check the container logs on the VM:docker logs my-nestjs-app



🔍 Key Details of the CI/CD Pipeline

Dockerfile: Uses a lightweight node:18-alpine image and multi-stage builds to optimize size. See Dockerfile.
GitHub Actions Workflow: Triggers on push to main, builds the Docker image, pushes to Docker Hub, and deploys via SSH. See cicd.yml.
Deployment Script: Pulls the latest image, stops/ removes the old container, starts a new one, and prunes unused images to save space.
Security: Credentials are stored in GitHub Secrets, and SSH access is restricted to the VM’s firewall.

🛑 Challenges and Solutions

SSH Issues: The VM rejected SSH connections due to firewall misconfiguration. Fixed by allowing port 22 in Google Cloud’s firewall rules.
Large Images: Initial Docker images were slow to build. Switched to multi-stage builds to reduce size.
Downtime: Container restarts caused brief downtime. Optimized the deployment script and planning to explore blue-green deployments.
Secret Management: Ensured no credentials were exposed in logs by using GitHub Secrets and disabling debug output.

🌟 Why This Setup Is Awesome
This CI/CD pipeline automates the entire deployment process, from code push to production, in minutes. It’s reliable, scalable, and frees me up to focus on coding rather than managing servers. The use of Docker, GitHub Actions, and Google Cloud makes it a modern, cloud-native solution that can be adapted for other projects.
🔮 Future Improvements

Add automated unit and integration tests to the pipeline.
Explore Google Cloud Build for advanced CI/CD features.
Migrate to Kubernetes for orchestration and scalability.
Implement health checks to ensure the app is ready before switching containers.

🤝 Contributing
Feel free to fork this repository, experiment with the setup, or suggest improvements via pull requests. If you have questions or run into issues, open an issue, and I’ll do my best to help!
📬 Contact
Want to chat about CI/CD, NestJS, or cloud deployments? Connect with me on LinkedIn or reach out via GitHub Issues.
🙌 Acknowledgments

NestJS for an awesome framework.
Docker for making containerization simple.
GitHub Actions for powerful automation.
Google Cloud for reliable infrastructure.

Happy coding, and I hope this helps you build your own CI/CD pipeline! 🚀
