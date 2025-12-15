import express from 'express';

declare global {
  namespace Express {
    interface Request {
      roles?: string[];
      scopes?: string[];
      authorities?: string[];
      userId?: string;
      usernameOrEmail?: string;
    }
  }
}
