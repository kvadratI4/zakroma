import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { useSystemTheme } from "../shared/theme/useSystemTheme";
import { createQueryClient } from "./queryClient";

function SystemTheme() {
  useSystemTheme();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <SystemTheme />
      {children}
    </QueryClientProvider>
  );
}
