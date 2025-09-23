// Global type declarations for external libraries and window objects

declare global {
  interface Window {
    EasyAIChat: {
      init: (config: { handle: string }) => void;
    };
  }
}

export {};
