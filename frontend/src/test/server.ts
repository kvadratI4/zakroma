import { setupServer } from "msw/node";

/** MSW server for component tests; handlers are added per test with `server.use(...)`. */
export const server = setupServer();
