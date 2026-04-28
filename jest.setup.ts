import "@testing-library/jest-dom";
import React from "react";

// Mock Request for API route testing
global.Request = class Request {
  url: string;
  method: string;
  body: any;

  constructor(url: string, options: any = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.body = options.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Mock Response for API route testing
global.Response = class Response {
  status: number;
  headers: Map<string, string>;
  body: any;

  constructor(body: any, options: any = {}) {
    this.status = options.status || 200;
    this.headers = new Map();
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        this.headers.set(key, value as string);
      });
    }
    this.body = body;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }

  get status() {
    return this.status;
  }

  get headers() {
    return {
      get: (key: string) => this.headers.get(key),
    };
  }
};

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { id: "1", email: "test@example.com", name: "Test User" },
      expires: "2026-12-31T00:00:00.000Z",
    },
    status: "authenticated",
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "/",
}));
