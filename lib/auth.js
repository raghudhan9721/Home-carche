import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'carche_secret_key_2025';

// Simple token generation without external JWT library
export function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  const data = { ...payload, exp, iat: Date.now() };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = Buffer.from(`${base64Header}.${base64Payload}.${JWT_SECRET}`).toString('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    if (payload.exp < Date.now()) return null;
    
    return payload;
  } catch (e) {
    return null;
  }
}

export function hashPassword(password) {
  // Simple hash for MVP - in production use bcrypt
  const salt = 'carche_salt_2025';
  return Buffer.from(`${password}${salt}`).toString('base64');
}

export function comparePassword(password, hash) {
  return hashPassword(password) === hash;
}
