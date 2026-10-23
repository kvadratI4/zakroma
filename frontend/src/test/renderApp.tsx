import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { AppProviders } from "../app/AppProviders";
import { routes } from "../app/routes";

/** Renders the whole app at a path, as a user would open it. */
export function renderApp(path = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    router,
    user: userEvent.setup(),
    ...render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  };
}
