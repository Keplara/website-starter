Local S3 Service with MinIO

This project sets up a local S3-compatible object storage service using MinIO in Docker. It includes instructions to run the service, create a bucket called certs, and upload certificates.

Table of Contents

Requirements

Setup & Run

Accessing the MinIO Web UI

Creating the certs Bucket

Uploading Certificates

Using AWS CLI

# Local S3 (MinIO) for development

This folder documents a small, local S3-compatible object storage setup using MinIO and Docker Compose. It's intended for local development and testing (for example, storing TLS certificates in a `certs` bucket).

## Table of contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Docker Compose example](#docker-compose-example)
- [Endpoints & credentials](#endpoints--credentials)
- [Create a bucket (certs)](#create-a-bucket-certs)
- [Upload certificates](#upload-certificates)
- [List objects](#list-objects)
- [Persistence & data location](#persistence--data-location)
- [Using SDKs / CLI](#using-sdks--cli)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Requirements

- Docker
- Docker Compose
- Optional: AWS CLI or MinIO Client (`mc`) for command-line operations

## Quick start

1. Copy the example `docker-compose.yml` below into this folder (or into a new folder for a standalone project).
2. Start the service:

```bash
docker-compose up -d
```

3. Open the MinIO console in your browser (see endpoints below) and create a `certs` bucket, or create it via the CLI.

## Docker Compose example

Create a file named `docker-compose.yml` with the content below (this is a minimal example):

```yaml
version: "3.8"

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"     # S3 API
      - "9001:9001"     # Web UI / console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data

volumes:
  minio-data:
```

Start it in the same directory as the `docker-compose.yml`:

```bash
docker-compose up -d
```

## Endpoints & credentials

- S3 API endpoint: http://localhost:9000
- Web UI / Console: http://localhost:9001
- Default root credentials (development only):
  - User: `Supervisor`
  - Password: `Supervisor`

Change these values for any non-local or shared environment — do not use these defaults in production.

## Create a bucket (certs)

Using the Web UI
- Open the Console at http://localhost:9001, click "Create bucket", name it `certs` and press Create.

Using AWS CLI

```bash
aws --endpoint-url=http://localhost:9000 s3 mb s3://certs
```

Using MinIO Client (`mc`)

```bash
# Add a local alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create the bucket
mc mb local/certs
```

## Upload certificates

Using the Web UI: open the `certs` bucket and use Upload to add your files.

Using AWS CLI

```bash
aws --endpoint-url=http://localhost:9000 s3 cp my-cert.crt s3://certs/
aws --endpoint-url=http://localhost:9000 s3 cp my-key.key s3://certs/
```

Using `mc`

```bash
mc cp my-cert.crt local/certs/
mc cp my-key.key local/certs/
```

## List objects

AWS CLI

```bash
aws --endpoint-url=http://localhost:9000 s3 ls s3://certs/
```

`mc`

```bash
mc ls local/certs/
```

## Persistence & data location

Data is stored in the Docker volume named `minio-data` (declared in the Compose file). That volume persists across container restarts. To inspect or remove the data, use standard Docker volume commands (be careful: removing the volume deletes stored objects).

## Using SDKs / CLI

MinIO is S3-compatible. You can use any S3-compatible SDK (for example, Python `boto3` or the AWS SDK for JavaScript) by pointing the SDK's endpoint to `http://localhost:9000` and supplying the root credentials.

Example (boto3) — configure the client with endpoint_url and credentials.

## Security notes

- The `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` defaults above are for local development only. Rotate them for shared or production environments.
- If you expose MinIO beyond localhost, enable TLS and restrict access.

## Troubleshooting

- If the console is not reachable, verify the container is running: `docker ps | grep minio`.
- If ports conflict, change the host port mappings in `docker-compose.yml`.
- If objects disappear, confirm the Docker volume `minio-data` exists and is not being removed by other scripts.

## License

This project follows the repository license. See the top-level `LICENSE` file for details.

---

If you'd like, I can also add a small `docker-compose.override.yml` that uses environment variables for credentials, or add an example `mc` script to automate bucket creation and uploads. 


In the `certs` bucket, create the following folder structure to organize public and internal certificates:

```shell
certs/
├─ public/
│  ├─ admin/      ← admin.mysite.com
│  └─ user/       ← mysite.com
└─ internal/
   ├─ mongo/      ← mongo.mysite.com
   ├─ redis/      ← redis.mysite.com
   └─ webserver/  ← internal.mysite.com
```


For example, in the mongo folder under internal, place the files below:
```shell
├─ca.pem
├─fullchain.pem
├─keystore.jks
├─keystore.p12
├─truststore.jks
```
- it is possible that you may need less or more of these files, it depends on your setup with certs.


Place the certificate files (for example, `fullchain.pem` and `privkey.pem`) inside the appropriate subfolder for each host.