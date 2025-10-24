export function sign() {
  throw new Error('jsonwebtoken cannot be used in the browser. Use the application server endpoints instead.');
}

export function verify() {
  throw new Error('jsonwebtoken cannot be used in the browser. Use the application server endpoints instead.');
}

export function decode() {
  throw new Error('jsonwebtoken cannot be used in the browser. Use the application server endpoints instead.');
}

export default { sign, verify, decode };
