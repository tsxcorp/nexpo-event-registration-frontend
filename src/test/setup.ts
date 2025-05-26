import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
  [Symbol.iterator]: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
}); 