import express from 'express';
import mongoose, { mongo } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'fs';
import apiRouter from './api/router';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
async function connectMongoDB() {
  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = process.env.MONGO_PORT || '27020';
  const mongoUser = process.env.MONGO_USER || 'Supervisor';
  const mongoPass = process.env.MONGO_PASS || 'Supervisor';
  const dbName = process.env.MONGO_DB || 'mysite';
  const mongoCaFile = process.env.MONGO_CA_FILE || resolve(__dirname, 'certs/mongo-ca.pem');
  console.log('MongoDB CA file path:', mongoCaFile);
  const caFileExists = existsSync(mongoCaFile);
  console.log('MongoDB CA file exists:', caFileExists);
  let authPart = '';
  if (mongoUser && mongoPass) {
    authPart = `${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPass)}@`;
  }
  const mongoUri = `mongodb://${authPart}${mongoHost}:${mongoPort}`;

  const mongoOptions: any = {
    dbName: dbName,
  };

  if (caFileExists) {
    mongoOptions.tls = true;
    mongoOptions.tlsCAFile = mongoCaFile;
    mongoOptions.dbName = dbName;
    mongoOptions.user = mongoUser;
    mongoOptions.pass = mongoPass;
    console.log('✓ MongoDB: TLS enabled');
  } else {
    console.warn('⚠ MongoDB: CA file not found, connecting without TLS');
  }

  try {
    await mongoose.connect(mongoUri, mongoOptions);
    console.log('✓ MongoDB connected successfully');
  } catch (err: any) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'resource-api' });
});

// Start server
async function start() {
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`✓ Resource API listening on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
