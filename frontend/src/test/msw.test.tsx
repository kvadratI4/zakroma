import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { api, problemCode } from "../api/client";
import type { components } from "../api/schema";
import { AppProviders } from "../app/AppProviders";
import { server } from "./server";

function HealthProbe() {
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/health");
      if (error !== undefined) throw new Error(problemCode(error) ?? "unknown_error");
      return data;
    },
  });
  return <output>{data ? `${data.status}/${data.db}` : "…"}</output>;
}

describe("test infrastructure (AC-2)", () => {
  it("serves API responses from MSW handlers through TanStack Query", async () => {
    server.use(
      http.get("*/api/v1/health", () =>
        HttpResponse.json<components["schemas"]["HealthOut"]>({ status: "ok", db: "ok" }),
      ),
    );

    render(
      <AppProviders>
        <HealthProbe />
      </AppProviders>,
    );

    expect(await screen.findByText("ok/ok")).toBeInTheDocument();
  });
});
