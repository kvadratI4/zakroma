import { describe, expect, it } from "vitest";

import config from "./vite.config";

describe("Vite servers (T-005, AC-6)", () => {
  it.each([
    ["dev", config.server],
    ["preview", config.preview],
  ])("%s proxies /api to the local backend and listens on loopback only", (_name, server) => {
    expect(server?.host).toBe("127.0.0.1");
    expect(server?.proxy).toEqual({ "/api": "http://127.0.0.1:8000" });
  });
});
