import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../app/AppProviders";
import { server } from "./server";

interface Health {
  status: string;
  db: string;
}

function HealthProbe() {
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<Health> => {
      const response = await fetch(new URL("/api/v1/health", window.location.origin));
      return (await response.json()) as Health;
    },
  });
  return <output>{data ? `${data.status}/${data.db}` : "…"}</output>;
}

describe("test infrastructure (AC-2)", () => {
  it("serves API responses from MSW handlers through TanStack Query", async () => {
    server.use(http.get("*/api/v1/health", () => HttpResponse.json({ status: "ok", db: "ok" })));

    render(
      <AppProviders>
        <HealthProbe />
      </AppProviders>,
    );

    expect(await screen.findByText("ok/ok")).toBeInTheDocument();
  });
});
