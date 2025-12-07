
# Redis Server Setup

This project provides a Dockerized Redis server with SSL certificates managed via AWS ACM. Follow the steps below to set up and deploy Redis securely.

## Requirements

- IAM Account with permission to use AWS services
- AWS Access Key (contact your admin to generate)
- Docker
- AWS CLI ([Install instructions](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions))

## AWS CLI Installation (Windows)

Download and install:

- [AWS CLI MSI Installer](https://awscli.amazonaws.com/AWSCLIV2.msi)
- Run: `msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi`
- Verify: `aws --version`

## Obtain ACM Certificate

Run the following command to get your certificate:

```
aws acm get-certificate --region <region> --certificate-arn <certificate-arn>
```

## Getting Started

### 1. Create Environment File

Create a `.env` file in the root directory with your Redis credentials:

```
REDIS_USER=Supervisor
REDIS_PASSWORD=Supervisor
```

### 2. Build and Run Redis (Development)

Run the following command to start Redis:

```
docker compose up -d redis-development --build
```

### 3. Assume AWS Role (for certificate access)

Run this command to assume your AWS role:

```
aws sts assume-role --role-arn arn:aws:iam::<id>:role/Developer_Role --role-session-name DevSession
```

### 4. Build Docker Image

```
docker build --rm -f ./Dockerfile.development -t <your_ecr_repo>/mysite/redis:dev .
```

### 5. Run Image Locally
```
docker run ^
  -e AWS_SESSION_TOKEN=<token> ^
  -e AWS_ACCESS_KEY_ID=<your-access-key> ^
  -e AWS_SECRET_ACCESS_KEY=<your-secret-key> ^
  -e AWS_DEFAULT_REGION=us-east-1 ^
  <your_ecr_repo>/mysite/redis:dev
```

### 6. ECR Login & Push Image

Login to ECR:

```
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your_ecr_repo>
```

Push image:

```
docker push <your_ecr_repo>/mysite/redis:staging
```

### 7. Export Temporary AWS Credentials (Linux/macOS)

If using bash, after assuming the role:

```
creds=$(aws sts assume-role --role-arn arn:aws:iam::<id>:role/Developer_Role --role-session-name DevSession)
export AWS_ACCESS_KEY_ID=$(echo $creds | jq -r .Credentials.AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$(echo $creds | jq -r .Credentials.SecretAccessKey)
export AWS_SESSION_TOKEN=$(echo $creds | jq -r .Credentials.SessionToken)
```

On Windows PowerShell, use:

```
$creds = aws sts assume-role --role-arn arn:aws:iam::<id>:role/Developer_Role --role-session-name DevSession
$env:AWS_ACCESS_KEY_ID = ($creds | ConvertFrom-Json).Credentials.AccessKeyId
$env:AWS_SECRET_ACCESS_KEY = ($creds | ConvertFrom-Json).Credentials.SecretAccessKey
$env:AWS_SESSION_TOKEN = ($creds | ConvertFrom-Json).Credentials.SessionToken
```


### Connect to redis: 

```
redis-cli -u redis://Supervisor:Supervisor@localhost:6379
```
