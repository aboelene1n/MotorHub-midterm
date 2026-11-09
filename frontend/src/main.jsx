import { installViewTransitionHandling } from "./services/viewTransitions";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hero-video.css";
import "./motion.css";

installViewTransitionHandling();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
