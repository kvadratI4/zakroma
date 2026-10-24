import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../test/server";
import { api, problemCode } from "./client";
import type { components } from "./schema";

type HealthOut = components["schemas"]["HealthOut"];
type Problem = components["schemas"]["Problem"];

describe("generated API client (T-005, AC-4)", () => {
  it("returns typed data for a successful response", async () => {
    server.use(
      http.get("*/api/v1/health", () => HttpResponse.json<HealthOut>({ status: "ok", db: "ok" })),
    );

    const { data, error } = await api.GET("/api/v1/health");

    expect(error).toBeUndefined();
    expect(data?.db).toBe("ok");
  });

  it("exposes the code of a problem+json error", async () => {
    server.use(
      http.get("*/api/v1/health", () =>
        HttpResponse.json<Problem>(
          {
            type: "https://zakroma/errors/db-unavailable",
            title: "База данных недоступна",
            status: 503,
            code: "db_unavailable",
          },
          { status: 503, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );

    const { data, error, response } = await api.GET("/api/v1/health");

    expect(response.status).toBe(503);
    expect(data).toBeUndefined();
    expect(problemCode(error)).toBe("db_unavailable");
  });

  it.each([undefined, null, "Bad Gateway", {}, { code: 503 }])(
    "has no problem code for a body that is not a problem: %j",
    (body) => {
      expect(problemCode(body)).toBeNull();
    },
  );

  it("rejects unknown paths and response fields at compile time", () => {
    // Checked by `pnpm typecheck`: an @ts-expect-error that is not needed is itself an error.
    async function misuse(): Promise<unknown> {
      // @ts-expect-error not a path of the API
      await api.GET("/api/v1/nope");
      const { data } = await api.GET("/api/v1/health");
      // @ts-expect-error HealthOut has no such field
      return data?.version;
    }

    expect(misuse).toBeTypeOf("function");
  });
});
