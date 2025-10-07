import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";
import AppShell from "./app/AppShell";
import { ThemeProvider } from "./app/providers/ThemeContext"; // 👈 your provider

import "semantic-ui-css/semantic.min.css";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
      useErrorBoundary: true,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* Put ThemeProvider ABOVE AppShell so the skeleton + errors get themed too */}
        <ThemeProvider>
          <AppShell>
            <App />
          </AppShell>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
