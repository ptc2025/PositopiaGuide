import { Request, Response, NextFunction } from "express";

// Extend Express Request to include session data
declare module "express-session" {
  interface SessionData {
    familyId?: string;
    parentId?: string;
    childId?: string;
    userType?: "family" | "parent" | "child";
    familyCode?: string;
  }
}

// Rate limiting map to track failed attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Clean up old entries periodically
setInterval(() => {
  const now = new Date();
  failedAttempts.forEach((value, key) => {
    if (now.getTime() - value.lastAttempt.getTime() > LOCKOUT_TIME) {
      failedAttempts.delete(key);
    }
  });
}, 60 * 1000); // Clean up every minute

// Rate limiting middleware
export function rateLimitPIN(identifier: string): boolean {
  const attempt = failedAttempts.get(identifier);
  
  if (attempt) {
    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime();
    
    if (timeSinceLastAttempt > LOCKOUT_TIME) {
      // Reset after lockout period
      failedAttempts.delete(identifier);
      return true;
    }
    
    if (attempt.count >= MAX_ATTEMPTS) {
      // Still locked out
      return false;
    }
  }
  
  return true;
}

// Track failed attempt
export function trackFailedAttempt(identifier: string) {
  const attempt = failedAttempts.get(identifier);
  
  if (attempt) {
    attempt.count++;
    attempt.lastAttempt = new Date();
  } else {
    failedAttempts.set(identifier, { count: 1, lastAttempt: new Date() });
  }
}

// Clear failed attempts on successful login
export function clearFailedAttempts(identifier: string) {
  failedAttempts.delete(identifier);
}

// Middleware to check if user is authenticated as family or parent
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.familyId && !req.session.parentId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Middleware to check if user is authenticated as parent only
export function requireParentAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.parentId) {
    return res.status(401).json({ error: "Parent authentication required" });
  }
  next();
}

// Middleware to check if user is authenticated as family (including children)
export function requireFamilyAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.familyId) {
    return res.status(401).json({ error: "Family authentication required" });
  }
  next();
}

// Get session info for debugging (never expose in production)
export function getSessionInfo(req: Request) {
  if (process.env.NODE_ENV === 'development') {
    return {
      familyId: req.session.familyId,
      parentId: req.session.parentId,
      childId: req.session.childId,
      userType: req.session.userType,
      familyCode: req.session.familyCode
    };
  }
  return { authenticated: !!req.session.familyId || !!req.session.parentId };
}