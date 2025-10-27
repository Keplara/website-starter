# Certificates Directory

This directory contains the SSL/TLS certificates required for secure communication between different components of the authorization server.

## Purpose

This directory stores the following certificates:
- Redis TLS certificates
- MongoDB TLS certificates
- Web CA certificates

## Environment Support

Certificates are managed for the following environments:
- Staging
- Production

## Certificate Usage

The certificates in this directory are used to ensure secure communication:
- Redis: For secure connection to the Redis cache server
- MongoDB: For encrypted communication with the MongoDB database
- Web CA: For HTTPS communication and SSL termination

## Security Notice

⚠️ Important:
1. Never commit actual certificates to version control
2. Keep certificates secure and restrict access
3. Regularly rotate certificates according to security policies
4. Use environment-specific configuration for different certificate paths

## Certificate Management

To add new certificates:
1. Place the certificate files in the appropriate environment subfolder
2. Update the corresponding environment configuration in `application-{env}.yml`
3. Ensure proper file permissions are set
4. Restart the application to load new certificates