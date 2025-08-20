# CI/CD Project (Website Deployment)
- Frontend - HTML, CSS, JS.
- Backend - Flask, RDS DB Instance


Automates Docker image build & push to DockerHub, pulling the image on EC2 machine on AWS.  
High Availability Features:

1. Multi-AZ Deployment: Resources spread across 2 availability zones
2. Auto Scaling: Automatically adjusts capacity based on CPU utilization
3. Load Balancing: Distributes traffic across healthy instances
4. Health Monitoring: Continuous health checks at multiple levels
5. Database Backup: RDS automated backups (currently disabled for cost-effectiveness and easier cleaning)

## Usage
No installation is required.
The GitHub Actions automates the process on Push to Main branch event and has two jobs:
1) Build & push the docker image to DockerHub
2) Setup the infrastructure on AWS using CloudFormation

Pre-configured on AWS:
1) IAM Roles and Policies, to enable actions such as:
- OIDC to pass securely AWS credentials from GitHub Actions to AWS
- IAM DB Authentication to secure the in-transit communication between the EC2 and RDS DB instances
- CloudFormation access to resources creation, deletion, modification and describe permissions
- Instance Profile for EC2 to access RDS, SSM Parameter Store and Secrets Manager


# CloudFormation Template

This template deploys a 3-tier architecture with Database Layer, Application Layer and Load Balancer Layer
## 1) Network Infrastructure
VPC: 10.0.0.0/16 with DNS support enabled
4 Subnets across 2 AZs:

- Public Subnets: 10.0.10.0/24 and 10.0.20.0/24 (for load balancer)
- Private Subnets: 10.0.30.0/24 and 10.0.40.0/24 (for EC2 instances and RDS)

## Internet Connectivity
- Internet Gateway for public internet access
- 2 NAT Gateways (one per AZ) for private subnets

## Security Groups - Three-Layer Security Model
- LoadBalancerSG: Allows HTTP (80) and HTTPS (443) from internet
- ServersSG: Allows port 5000 only from LoadBalancerSG
- DatabaseSG: Allows MySQL (3306) only from ServersSG

This creates a security-in-depth approach where each tier can only communicate with its adjacent tiers.

## 2) Database Layer - RDS MySQL Database
- Traditional username/password from Secrets Manager
- IAM database authentication enabled
- Security: Private subnets only, not publicly accessible
- SSL: Uses RDS CA certificate for encrypted connections

## 3) Application Layer
- EC2 with docker-based Flask application, docker and V2 metadata configuration is done with User Data
- Auto Scaling Group (ASG) to scale up/down according to the Target Tracking Policy, which is based on the Average CPU Utilization metric (50%)

## 4) Load Balancer Layer
- Internet-facing ALB (Application Load Balancer) with ACM certificate
- Route 53 Domain: "www" CNAME points to load balancer

# Project status
- Working Status - works
- Perfection Status - quite far from perfection

# Roadmap:
1) Correct the IAM DB Authentication use the token for the password (incorrect usage - need to be fixed)
2) Generate session secret key for the flask app
3) Get DB credentials from Secrets Manager (inside the flask app?) to write and get information from the database instead of using hard-coded credentials (+ IAM permissions)
4) Move the images and the video to S3 and get it inside the flask app using an S3 endpoint (+ IAM permissions)
5) Replace other static parameters to dynamic parameters (F.E. the region, switch it to us-east-1 by default)
6) Change the app.py to continue checking for a DB endpoint in case of failure
7) Re-write using Terraform and Make IAM roles instead of pre-configuring, based on the resources ARN created in the template.yml
8) Add more tests (check app.py is working after building the image phase?)
9) Add logs for better troubleshooting
10) Update to a modern frontend (React?)
11) Move to ECS, ECR and EKS (move to one or more of them)
12) Improve the website in general, adding features
