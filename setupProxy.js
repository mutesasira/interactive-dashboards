const express = require("express");
let cors = require("cors");
const path = require("path");

const { createProxyMiddleware } = require("http-proxy-middleware");
const { generateInsights, rateLimitMiddleware, initializeOpenAI, logger } = require("./server/services/aiInsightsService");

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
  target: "https://emis.dhis2nigeria.org.ng/dhis",
  // target: "https://sd.emis.ac.sz/emis",

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
app.use(express.json({ limit: '1mb' }));

// Initialize OpenAI service
initializeOpenAI();

// Security middleware for API routes
function validateApiAccess(req, res, next) {
  // Basic API key validation (should be enhanced with proper auth)
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  // For development, allow requests from localhost
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  
  if (isDevelopment && isLocalhost) {
    return next();
  }
  
  // In production, require proper API key
  if (!apiKey || apiKey !== process.env.AI_API_KEY) {
    logger.warn('Unauthorized API access attempt', { 
      ip: req.ip, 
      userAgent: req.headers['user-agent'],
      path: req.path 
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required'
    });
  }
  
  next();
}

// AI Insights API endpoint
app.post('/api/ai/insights', rateLimitMiddleware, validateApiAccess, async (req, res) => {
  try {
    const { dashboardData, userId, organizationUnit } = req.body;
    
    // Validate required fields
    if (!dashboardData) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'dashboardData is required'
      });
    }
    
    // Security: Validate data size (prevent large payloads)
    const dataSize = JSON.stringify(dashboardData).length;
    if (dataSize > 100000) { // 100KB limit
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'Dashboard data exceeds size limit'
      });
    }
    
    // Generate insights
    const requestMeta = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId,
      organizationUnit
    };
    
    const result = await generateInsights(dashboardData, requestMeta);
    
    // Log successful request
    logger.info('AI insights generated', {
      requestId: result.requestId,
      userId,
      organizationUnit,
      cached: result.cached || false,
      fallback: result.fallback || false
    });
    
    res.json({
      success: true,
      data: {
        insight: result.insight,
        confidence: result.confidence,
        priority: result.priority,
        generatedAt: result.generatedAt,
        cached: result.cached || false,
        metadata: {
          requestId: result.requestId,
          model: result.model,
          tokensUsed: result.tokensUsed,
          latency: result.latency,
          fallback: result.fallback || false,
          factsSummary: result.factsSummary
        }
      }
    });
    
  } catch (error) {
    logger.error('AI insights endpoint error', { 
      error: error.message,
      stack: error.stack,
      ip: req.ip 
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate insights'
    });
  }
});

// Health check endpoint
app.get('/api/ai/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    openai: !!process.env.OPENAI_API_KEY,
    version: '1.0.0'
  });
});

// Default proxy for DHIS2 (all other routes)
app.use("/", exampleProxy);

app.listen(3002);
