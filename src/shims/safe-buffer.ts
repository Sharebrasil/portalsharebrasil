// Browser shim for safe-buffer - use Buffer from Node.js API polyfill or throw
export const Buffer = globalThis.Buffer || {
  from: () => {
    throw new Error('Buffer is not available in browser context');
  },
  alloc: () => {
    throw new Error('Buffer is not available in browser context');
  },
  allocUnsafe: () => {
    throw new Error('Buffer is not available in browser context');
  },
};
