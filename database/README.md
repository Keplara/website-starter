# Mongo (database) — README

This folder contains Docker configuration and helper commands for running MongoDB locally and building images for deployment. The container can optionally retrieve TLS certificates from AWS ACM/Secrets Manager when required.

## Requirements

- Docker and Docker Compose
- (For TLS/certs) AWS account with permissions to read ACM and/or Secrets Manager
- AWS CLI and jq (for scripts that parse JSON)

## Install the AWS CLI (optional)
See https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

Windows (MSI):

```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
aws --version
```

Linux / macOS: follow the AWS docs linked above.

## Getting started — local development

1. Create an env file (or export the variables in your shell). Example `.env` or script:

```bash
export MONGO_USER=Supervisor
export MONGO_PASSWORD=Supervisor
```

2. Start services with Docker Compose (example: only Mongo):

```bash
docker compose up -d mongo --build
```

3. To build the MongoDB image (example tag uses ECR style placeholder):

```bash
docker build --rm -f ./Dockerfile.dev -t <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/mysite/mongodb:dev .
```

4. Run the built image locally:

```bash
docker run -p 27018:27018 <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/mysite/mongodb:dev
```

5. Push to ECR (replace `<ACCOUNT>` and ensure you are authenticated):

```bash
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/mysite/mongodb:dev
```

Note: the original file referenced pushing `mysite/redis:staging`; ensure you push the correct repository/image name.

## AWS: assume a role and export temporary credentials

Use this snippet to assume an IAM role and set temporary environment variables in bash:

```bash
creds=$(aws sts assume-role \
  --role-arn arn:aws:iam::<ACCOUNT>:role/Developer_Role \
  --role-session-name DevSession)

export AWS_ACCESS_KEY_ID=$(echo "$creds" | jq -r .Credentials.AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$(echo "$creds" | jq -r .Credentials.SecretAccessKey)
export AWS_SESSION_TOKEN=$(echo "$creds" | jq -r .Credentials.SessionToken)
```

Replace `<ACCOUNT>` with your AWS account ID. Keep these temporary credentials secure and do not commit them.

## Retrieve TLS certificate (Secrets Manager) — example

Only for authorized users (do not run unless you have permission):

```bash
export MONGOPEM=$(aws secretsmanager get-secret-value --secret-id mongodbpem --query SecretString --output text)
```

This assumes the secret contains the PEM bundle required by MongoDB and that your container/mounts will make it available at `/etc/ssl/mongodb/mongodb.pem`.

## Creating a MongoDB user (optional)

Connect to the database and run (example using the mongo shell):

```js
db.createUser({
  user: "Supervisor",
  pwd: passwordPrompt(),
  roles: [ { role: "readWrite", db: "development" } ]
});
```

## TLS configuration notes

Example MongoDB TLS options (in `mongod.conf` or equivalent):

```yaml
net:
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/ssl/mongodb/mongodb.pem
    allowConnectionsWithoutCertificates: true
    # Note: AllowInvalidCertificates is not a standard mongod option; avoid it in production.
```

Security note: enabling `allowConnectionsWithoutCertificates` or accepting invalid certificates weakens TLS security. Only use these options for development or when you fully understand the implications.

## Checksums and encryption examples

Create a SHA-256 checksum and encrypt a secret file with OpenSSL (example):

```bash
openssl sha256 -binary secretfile.txt | openssl base64 > checksum.sha256
openssl aes-256-cbc -in secretfile.txt -out secretfile.enc -pass pass:YOUR_PASSPHRASE
```

Replace `YOUR_PASSPHRASE` with a secure passphrase and manage it appropriately.

## Docker Compose — staging

Bring up the staging Mongo service (example):

```bash
docker compose up -d --build mongo-staging
```

## Troubleshooting & tips

- Make sure Docker has enough disk space for the `mongo-data/` directory.
- Do not commit environment files or secrets to version control.
- If you need to extract an ACM certificate you generally must use AWS CLI + ACM Private CA or export a certificate from Secrets Manager; ACM public certificates cannot be exported.

## Credits / License

This repository contains helper scripts and configuration for running MongoDB in Docker. Adapt as needed for your environment.

---
If you want, I can also: add a sample `.env.example`, validate `docker-compose.yml`, or add a short troubleshooting section tailored to errors you see. Tell me which you'd like next.

## Create TLS Cert
#### Certs on windows will need to be LF not CRLF

### Create key
mkdir certs \
openssl genrsa -out certs/ca.key 4096

# Create CA certificate (self-signed) Note: use powershell if on windows
openssl req -x509 -new -nodes -key certs/ca.key -sha256 -days 365 -out certs/ca.pem -subj "/C=US/ST=AZ/L=Phoenix/O=LocalTest/OU=Dev/CN=LocalTestCA"

# Generate server private key
openssl genrsa -out certs/mongodb.key 4096

# Generate a Certificate Signing Request (CSR) Note: use powershell if on windows
openssl req -new -key certs/mongodb.key -out certs/mongodb.csr -subj "/C=US/ST=AZ/L=Phoenix/O=LocalTest/OU=Dev/CN=localhost"

# Sign the server CSR with your CA Note: use powershell if on windows
openssl x509 -req -in certs/mongodb.csr -CA certs/ca.pem -CAkey certs/ca.key -CAcreateserial -out certs/mongodb.crt -days 365 -sha256

# Combine the private key and signed certificate
cat certs/mongodb.key certs/mongodb.crt > certs/mongodb.pem