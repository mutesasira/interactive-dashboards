const express = require("express");
let cors = require("cors");
const path = require("path");

const { createProxyMiddleware } = require("http-proxy-middleware");
const publicDashboardRoutes = require("./src/api/publicDashboardRoutes");

let sessionCookie = "";
const onProxyReq = (proxyReq) => {
  if (sessionCookie) {
    proxyReq.setHeader("cookie", sessionCookie);
  }
};
const onProxyRes = (proxyRes) => {
  const proxyCookie = proxyRes.headers["set-cookie"];
  if (proxyCookie) {
    sessionCookie = proxyCookie;
  }
};
// proxy middleware options
const options = {
  //target: "https://eidsr.health.go.ug",
  // target: "https://dev.ndpme.go.ug/ndpdb",
  // target: "ndpme.go.ug/ndpdb",
  // target: "http://localhost:8080",
  // target: "https://tests.dhis2.hispuganda.org/hmis/",
  // target: "https://hmis.health.go.ug",
  // target: "https://hmis-tests.health.go.ug",
  // target: "https://tests.dhis2.stephocay.com/sia",
  // target: "https://etracker.moh.gov.rw/individualrecords",
  // target: "https://epivac.health.go.ug",
  // target: "https://train.ndpme.go.ug/ndpdb",
  // target: "https://play.im.dhis2.org/dev",
  // target: "https://emisuganda.org/emis",
  // target: "https://dev.emisuganda.org/emisdev",
  // target: "https://play.dhis2.org/40.3.0",
  // target: "https://emis.dhis2nigeria.org.ng/dhis",
  target: "https://sd.emis.ac.sz/emis",

  onProxyReq,
  onProxyRes,
  changeOrigin: true, // needed for virtual hosted sites
  auth: undefined,
  logLevel: "debug",
};

// create the proxy (without context)
const exampleProxy = createProxyMiddleware(options);

const app = express();

// Apply CORS middleware
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000"],
  })
);

// Parse JSON bodies for API routes
app.use(express.json());

// Public dashboard API routes (no authentication required for /api/public-dashboard/* routes)
app.use("/api", publicDashboardRoutes);

// Serve static files for public routes
app.use("/public", express.static(path.join(__dirname, "build")));

// Handle public dashboard routes - serve the main HTML file
app.get("/public/*", (_, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Default proxy for DHIS2 (all other routes)
app.use("/", exampleProxy);

app.listen(3002);
