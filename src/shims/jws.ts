// Browser shim for jws - not used in browser context
export function sign() {
  throw new Error('jws is not available in browser context');
}

export function verify() {
  throw new Error('jws is not available in browser context');
}
