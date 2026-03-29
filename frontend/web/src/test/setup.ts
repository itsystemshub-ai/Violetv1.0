import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

global.localStorage = localStorageMock;

// Mock fetch
global.fetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
