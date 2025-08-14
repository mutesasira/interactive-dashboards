const express = require("express");

module.exports = function(app) {
  // Parse JSON bodies for API routes
  app.use(express.json());
  
};