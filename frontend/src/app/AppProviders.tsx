import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { useThemeChoice } from "../shared/theme/themeChoice";
import { createQueryClient } from "./queryClient";

/** Keeps `<html data-theme>` on the chosen or the system theme (T-009). */
function AppliedTheme() {
  useThemeChoice();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AppliedTheme />
      {children}
    </QueryClientProvider>
  );
}
