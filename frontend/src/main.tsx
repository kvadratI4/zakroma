import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/600.css";
import "@fontsource/triodion/400.css";
import "./index.css";
import "./i18n";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import { themeCss } from "./shared/theme/cssVariables";

const tokens = document.createElement("style");
tokens.textContent = themeCss();
document.head.append(tokens);

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing in index.html");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
