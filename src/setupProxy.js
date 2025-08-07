const express = require("express");
const path = require("path");
const publicDashboardRoutes = require("./api/publicDashboardRoutes");

module.exports = function(app) {
  // Parse JSON bodies for API routes
  app.use(express.json());
  
  // Add public dashboard API routes to the development server
  app.use("/api", publicDashboardRoutes);
  
  // Handle public dashboard routes in development
  app.get("/public/*", (req, res) => {
    // In development, just serve the main HTML file
    // The React app will handle routing client-side
    res.sendFile(path.join(__dirname, "../public", "index.html"));
  });
};