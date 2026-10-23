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
];
