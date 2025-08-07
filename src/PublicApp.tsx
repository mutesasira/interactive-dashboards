import React from "react";
import * as ReactDOM from "react-dom";
import PublicLayout from "./components/public/PublicLayout";

/**
 * Public App Entry Point
 * 
 * This is a separate entry point for public dashboard views.
 * It doesn't include DHIS2 authentication or any private features.
 */

// Check if we're on a public route
const isPublicRoute = window.location.pathname.startsWith('/public/');

if (isPublicRoute) {
  ReactDOM.render(
    <React.StrictMode>
      <PublicLayout />
    </React.StrictMode>,
    document.getElementById("root")
  );
} else {
  // Load the main app
  import('./AppWrapper').then((AppWrapper) => {
    ReactDOM.render(
      <React.StrictMode>
        <AppWrapper.default />
      </React.StrictMode>,
      document.getElementById("root")
    );
  });
}