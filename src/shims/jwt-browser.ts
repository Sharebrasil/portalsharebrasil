// Browser shim for jsonwebtoken - not used in browser context
export function sign() {
  throw new Error('jsonwebtoken.sign is not available in browser context');
}

export function verify() {
  throw new Error('jsonwebtoken.verify is not available in browser context');
}

export function decode() {
  throw new Error('jsonwebtoken.decode is not available in browser context');
}
