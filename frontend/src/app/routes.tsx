import type { RouteObject } from "react-router";

import { AddScreen } from "../features/add/AddScreen";
import { ExpiryScreen } from "../features/expiry/ExpiryScreen";
import { FamilyScreen } from "../features/family/FamilyScreen";
import { ShoppingScreen } from "../features/shopping/ShoppingScreen";
import { StockScreen } from "../features/stock/StockScreen";
import { AppLayout } from "./AppLayout";
import { NotFoundScreen } from "./NotFoundScreen";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <StockScreen /> },
      { path: "expiry", element: <ExpiryScreen /> },
      { path: "add", element: <AddScreen /> },
      { path: "shopping", element: <ShoppingScreen /> },
      { path: "family", element: <FamilyScreen /> },
      { path: "*", element: <NotFoundScreen /> },
    ],
  },
  // The component showcase exists only in the dev build: the import is dropped from production
  // (T-008b, AC-5; checked by scripts/check-bundle-size.mjs and the prod smoke tests).
  ...(import.meta.env.DEV
    ? [
        {
          path: "/dev/ui",
          lazy: async () => ({ Component: (await import("../dev/ShowcaseScreen")).ShowcaseScreen }),
        },
      ]
    : []),
];
