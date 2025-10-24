// Provide a minimal safe-buffer shim that throws a clear error when used in the browser
export const Buffer = {
  from() {
    throw new Error('Buffer.from is not available in the browser in this app. JWT signing should run on the server.');
  }
};

export default { Buffer };
