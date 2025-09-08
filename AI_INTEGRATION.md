# AI Insights Integration - Real LLM Implementation

## Overview

This implementation integrates real Large Language Models (LLMs) into the Interactive Dashboards application, specifically for the "Insights 2" visualization component. The integration follows enterprise-grade best practices with security, caching, validation, and observability.

## Architecture

### Backend AI Gateway (`setupProxy.js` + `server/services/aiInsightsService.js`)
- **Secured endpoint**: `POST /api/ai/insights`
- **Rate limiting**: 10 requests per minute per IP
- **Caching**: 15-minute TTL for identical requests
- **Validation**: Input size limits, output validation
- **Security**: API key authentication, payload size limits
- **Observability**: Comprehensive logging and metrics

### Frontend Service (`src/services/realLLMInsightsService.ts`)
- **Real API calls**: Replaces mock LLM service
- **Retry logic**: 2 retries with exponential backoff
- **Error handling**: Graceful fallback to rule-based responses
- **Type safety**: Full TypeScript integration

### Component Integration (`src/components/visualizations/Insights2Visualization.tsx`)
- **Cross-section analysis**: Analyzes data from OTHER sections in dashboard
- **Real-time generation**: Uses actual OpenAI GPT models
- **Enhanced UI**: Shows real vs mock indicators, token usage, model info

## Configuration

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenAI API Key (required for real LLM)
OPENAI_API_KEY=sk-your-openai-api-key-here

# API security key (generate random string)
AI_API_KEY=your-secure-random-api-key-here

# Frontend API key (should match AI_API_KEY in production)
REACT_APP_AI_API_KEY=your-secure-random-api-key-here

# Environment
NODE_ENV=development
```

### 2. API Key Setup

**Get OpenAI API Key:**
1. Visit https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env` as `OPENAI_API_KEY`

**Generate Security API Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Model Configuration

The service uses `gpt-4o-mini` by default for cost-effectiveness. To change:

Edit `server/services/aiInsightsService.js`:
```javascript
const AI_CONFIG = {
    model: 'gpt-4', // or 'gpt-3.5-turbo', 'gpt-4o', etc.
    temperature: 0.15,
    maxTokens: 150
};
```

## Features Implemented

### ✅ Backend AI Gateway
- [x] Secured POST endpoint at `/api/ai/insights`
- [x] Rate limiting (10 req/min per IP)
- [x] Input validation and size limits (100KB max)
- [x] API key authentication
- [x] Comprehensive error handling

### ✅ LLM Integration with Prompt Rules
- [x] Fixed instruction prompts (≤60 words, 1-2 sentences)
- [x] Low temperature (0.15) for consistency
- [x] Retry logic with fallback to rule-based responses
- [x] OpenAI GPT integration with configurable models

### ✅ Validation & Guardrails
- [x] Output validation (word count, sentence count, numeric content)
- [x] Rejection of outputs that don't echo provided numbers
- [x] Priority/confidence derived from numeric signals (not LLM prose)
- [x] Zero tolerance for invented numbers

### ✅ Security
- [x] API keys stored server-side only
- [x] Only aggregated data sent (no raw PII)
- [x] Authorization checks with org unit validation
- [x] Payload size and rate limiting

### ✅ Performance & Cost
- [x] 15-minute cache per dashboard/section
- [x] Rate limiting with backoff
- [x] Token usage tracking and logging
- [x] Latency monitoring

### ✅ Frontend Integration
- [x] Real API calls replace mock service
- [x] Current UI maintained (badges, export, auto-refresh)
- [x] Metadata display (model, timestamp, tokens)
- [x] Error handling with user feedback

### ✅ Observability & Logging
- [x] Input/output logging with hashes
- [x] Validation results tracking
- [x] Model usage metrics
- [x] Request ID tracking for debugging

## Usage

### 1. Start the Application
```bash
npm install --legacy-peer-deps
npm run dev  # Starts both frontend and proxy server
```

### 2. Add Insights2 Visualization
1. Open dashboard in edit mode
2. Add new section or edit existing section
3. Add "AI Insights 2" visualization
4. Configure properties as needed

### 3. Cross-Section Analysis
The Insights2 visualization will automatically:
- Collect data from ALL OTHER sections (excluding itself)
- Send aggregated facts to the AI service
- Generate real insights using OpenAI's models
- Display results with confidence scores and metadata

## API Endpoints

### POST `/api/ai/insights`

**Request:**
```json
{
  "dashboardData": {
    "otherSections": [
      {
        "sectionId": "section1",
        "sectionTitle": "Performance Metrics",
        "sectionType": "normal",
        "visualizations": [...],
        "allData": [...]
      }
    ],
    "analysisType": "cross-section",
    "metadata": {...}
  },
  "userId": "user123",
  "organizationUnit": "org456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insight": "Performance shows 15.2% improvement with stable trends across sections.",
    "confidence": 0.85,
    "priority": "medium",
    "generatedAt": "2025-09-08T10:30:00Z",
    "cached": false,
    "metadata": {
      "requestId": "req123",
      "model": "gpt-4o-mini",
      "tokensUsed": 45,
      "latency": 1250,
      "fallback": false,
      "factsSummary": {
        "sectionsAnalyzed": 3,
        "totalDataPoints": 127,
        "sectionsWithData": 2
      }
    }
  }
}
```

### GET `/api/ai/health`

Health check endpoint:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-08T10:30:00Z",
  "openai": true,
  "version": "1.0.0"
}
```

## Monitoring & Debugging

### Console Logs
The service provides detailed logging:
- `[AI-Insights]` - Backend service logs
- `[RealLLM]` - Frontend service logs

### Request Tracking
Each request gets a unique ID for tracing through the system.

### Performance Metrics
- Response latency
- Token usage
- Cache hit rates
- Fallback rates

## Cost Management

### Token Optimization
- Maximum 150 tokens per response
- Concise prompts with only essential facts
- Short caching period (15 minutes)

### Rate Limiting
- 10 requests per minute per IP
- Prevents API cost spikes
- Graceful degradation under load

### Model Selection
- Default: `gpt-4o-mini` (cost-effective)
- Configurable for different models
- Token usage tracking

## Troubleshooting

### No AI Responses
1. Check `.env` file has valid `OPENAI_API_KEY`
2. Verify API key has sufficient credits
3. Check console for error logs
4. Test health endpoint: `/api/ai/health`

### Rate Limited
- Wait 1 minute before retry
- Check if multiple users hitting limits
- Consider increasing rate limits in production

### Fallback Mode
If LLM unavailable, service provides rule-based insights:
- Uses statistical analysis of dashboard data
- Maintains user experience
- Logged for monitoring

## Production Deployment

### Environment Variables
```bash
# Production environment
NODE_ENV=production

# Required API keys
OPENAI_API_KEY=sk-prod-key-here
AI_API_KEY=your-production-api-key-here
REACT_APP_AI_API_KEY=your-production-api-key-here
```

### Security Considerations
- Use strong API keys (32+ characters)
- Enable HTTPS in production
- Monitor API usage and costs
- Regular security audits

### Scaling
- Consider Redis for distributed caching
- Monitor rate limits and adjust as needed
- Database logging for audit trails
- Load balancer considerations

## Development

### Adding New Insight Types
Edit `src/services/realLLMInsightsService.ts`:
```typescript
private determineInsightType(content: string): LLMInsight['type'] {
  // Add new logic for insight classification
}
```

### Customizing Prompts
Edit `server/services/aiInsightsService.js`:
```javascript
const AI_CONFIG = {
    systemPrompt: "Your custom system prompt here..."
};
```

### Testing
```bash
# Test API endpoint
curl -X POST http://localhost:3002/api/ai/insights \
  -H "Content-Type: application/json" \
  -d '{"dashboardData": {...}}'

# Health check
curl http://localhost:3002/api/ai/health
```

## License

This AI integration follows the same license as the main project (BSD-3-Clause).

---

**Questions or Issues?**
Check the main project README or create an issue in the repository.