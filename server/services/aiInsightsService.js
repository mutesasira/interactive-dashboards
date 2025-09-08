const OpenAI = require('openai');
const NodeCache = require('node-cache');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const crypto = require('crypto');

// Configuration
const AI_CONFIG = {
    temperature: 0.15, // Low temperature for consistency
    maxTokens: 150, // Keep responses concise
    model: 'gpt-4o-mini', // Cost-effective model
    systemPrompt: `You are a data insights analyst. Write 1-2 sentences, ≤60 words, using ONLY the numbers provided. Never invent or assume data not given. Focus on: last value + period, comparisons, targets/anomalies if provided.`,
    cacheTimeMinutes: 15,
    maxRetries: 1
};

// Initialize OpenAI client (will be configured with API key from environment)
let openaiClient = null;

// Initialize cache (15 minute TTL)
const cache = new NodeCache({ stdTTL: AI_CONFIG.cacheTimeMinutes * 60 });

// Rate limiter: 10 requests per minute per IP
const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
    points: 10,
    duration: 60,
});

// Logging utility
const logger = {
    info: (message, meta = {}) => {
        console.log(`[AI-Insights] ${new Date().toISOString()} INFO: ${message}`, meta);
    },
    warn: (message, meta = {}) => {
        console.warn(`[AI-Insights] ${new Date().toISOString()} WARN: ${message}`, meta);
    },
    error: (message, meta = {}) => {
        console.error(`[AI-Insights] ${new Date().toISOString()} ERROR: ${message}`, meta);
    }
};

// Initialize OpenAI client
function initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        logger.warn('OpenAI API key not found. AI insights will use fallback mode.');
        return false;
    }
    
    try {
        openaiClient = new OpenAI({ apiKey });
        logger.info('OpenAI client initialized successfully');
        return true;
    } catch (error) {
        logger.error('Failed to initialize OpenAI client', { error: error.message });
        return false;
    }
}

// Generate cache key from input data
function generateCacheKey(factsBundle) {
    const dataString = JSON.stringify(factsBundle, Object.keys(factsBundle).sort());
    return crypto.createHash('md5').update(dataString).digest('hex');
}

// Extract numeric facts from dashboard data
function extractFactsBundle(dashboardData) {
    const facts = {
        sections: [],
        totalDataPoints: 0,
        timestamp: new Date().toISOString()
    };
    
    // Process each section
    if (dashboardData.otherSections && Array.isArray(dashboardData.otherSections)) {
        dashboardData.otherSections.forEach(section => {
            const sectionFacts = {
                sectionTitle: section.sectionTitle || 'Untitled',
                sectionType: section.sectionType || 'normal',
                visualizationCount: section.visualizations?.length || 0,
                dataPointCount: section.allData?.length || 0
            };
            
            // Extract numeric values with statistical analysis
            if (section.allData && section.allData.length > 0) {
                const numericValues = section.allData
                    .flatMap(item => {
                        if (typeof item === 'number' && !isNaN(item)) return [item];
                        if (typeof item === 'object' && item !== null) {
                            return Object.values(item).filter(val => typeof val === 'number' && !isNaN(val));
                        }
                        return [];
                    })
                    .filter(val => val !== null && val !== undefined);
                
                if (numericValues.length > 0) {
                    const sum = numericValues.reduce((a, b) => a + b, 0);
                    const avg = sum / numericValues.length;
                    const max = Math.max(...numericValues);
                    const min = Math.min(...numericValues);
                    const lastValue = numericValues[numericValues.length - 1];
                    
                    // Calculate trend (simple slope)
                    const trend = numericValues.length > 1 
                        ? (lastValue - numericValues[0]) / (numericValues.length - 1)
                        : 0;
                    
                    sectionFacts.statistics = {
                        lastValue: Math.round(lastValue * 100) / 100,
                        average: Math.round(avg * 100) / 100,
                        maximum: Math.round(max * 100) / 100,
                        minimum: Math.round(min * 100) / 100,
                        count: numericValues.length,
                        trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
                        trendValue: Math.round(trend * 100) / 100
                    };
                }
            }
            
            facts.sections.push(sectionFacts);
            facts.totalDataPoints += sectionFacts.dataPointCount;
        });
    }
    
    return facts;
}

// Validate AI output
function validateOutput(output, factsBundle) {
    if (!output || typeof output !== 'string') {
        return { valid: false, reason: 'Empty or invalid output' };
    }
    
    // Check word count (≤60 words)
    const wordCount = output.trim().split(/\s+/).length;
    if (wordCount > 60) {
        return { valid: false, reason: `Output too long: ${wordCount} words` };
    }
    
    // Check for sentence count (1-2 sentences)
    const sentenceCount = output.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    if (sentenceCount > 2) {
        return { valid: false, reason: `Too many sentences: ${sentenceCount}` };
    }
    
    // Basic validation: ensure it contains some numbers if facts contain numbers
    const hasNumbers = /\d+/.test(output);
    const factsHaveNumbers = factsBundle.sections.some(s => s.statistics);
    
    if (factsHaveNumbers && !hasNumbers) {
        return { valid: false, reason: 'Output lacks expected numeric content' };
    }
    
    return { valid: true };
}

// Generate rule-based fallback text
function generateFallback(factsBundle) {
    const { sections, totalDataPoints } = factsBundle;
    
    if (sections.length === 0) {
        return {
            insight: "No dashboard sections available for analysis. Add data visualizations to enable insights.",
            confidence: 0.9,
            priority: "low",
            fallback: true
        };
    }
    
    const sectionsWithData = sections.filter(s => s.statistics);
    
    if (sectionsWithData.length === 0) {
        return {
            insight: `Dashboard contains ${sections.length} section${sections.length > 1 ? 's' : ''} with ${totalDataPoints} data points but no numeric data for analysis.`,
            confidence: 0.9,
            priority: "low",
            fallback: true
        };
    }
    
    // Generate basic statistical summary
    const section = sectionsWithData[0]; // Focus on first section with data
    const stats = section.statistics;
    
    let insight = `${section.sectionTitle} shows last value of ${stats.lastValue}`;
    
    if (stats.trend !== 'stable') {
        insight += ` with ${stats.trend} trend`;
    }
    
    if (sectionsWithData.length > 1) {
        insight += `. Analysis covers ${sectionsWithData.length} sections with ${totalDataPoints} total data points.`;
    } else {
        insight += ` from ${stats.count} data points.`;
    }
    
    return {
        insight,
        confidence: 0.7,
        priority: stats.trend === 'decreasing' ? "medium" : "low",
        fallback: true
    };
}

// Call OpenAI API
async function callOpenAI(factsBundle) {
    if (!openaiClient) {
        logger.warn('OpenAI client not available, using fallback');
        return generateFallback(factsBundle);
    }
    
    // Construct prompt with facts
    const factsText = factsBundle.sections
        .filter(s => s.statistics)
        .map(s => {
            const stats = s.statistics;
            return `${s.sectionTitle}: last=${stats.lastValue}, avg=${stats.average}, min=${stats.minimum}, max=${stats.maximum}, trend=${stats.trend}, count=${stats.count}`;
        })
        .join('. ');
    
    if (!factsText) {
        return generateFallback(factsBundle);
    }
    
    const prompt = `Dashboard facts: ${factsText}. Total sections: ${factsBundle.sections.length}, data points: ${factsBundle.totalDataPoints}.`;
    
    try {
        const completion = await openaiClient.chat.completions.create({
            model: AI_CONFIG.model,
            temperature: AI_CONFIG.temperature,
            max_tokens: AI_CONFIG.maxTokens,
            messages: [
                { role: 'system', content: AI_CONFIG.systemPrompt },
                { role: 'user', content: prompt }
            ]
        });
        
        const output = completion.choices[0]?.message?.content?.trim();
        const tokensUsed = completion.usage?.total_tokens || 0;
        
        // Validate output
        const validation = validateOutput(output, factsBundle);
        if (!validation.valid) {
            logger.warn('AI output validation failed', { reason: validation.reason, output });
            return generateFallback(factsBundle);
        }
        
        // Derive confidence and priority from data signals
        const sectionsWithData = factsBundle.sections.filter(s => s.statistics);
        const hasDecreasingTrend = sectionsWithData.some(s => s.statistics.trend === 'decreasing');
        
        return {
            insight: output,
            confidence: sectionsWithData.length > 1 ? 0.85 : 0.75,
            priority: hasDecreasingTrend ? "high" : "medium",
            tokensUsed,
            model: AI_CONFIG.model,
            fallback: false
        };
        
    } catch (error) {
        logger.error('OpenAI API call failed', { error: error.message });
        return generateFallback(factsBundle);
    }
}

// Main insight generation function
async function generateInsights(dashboardData, requestMeta = {}) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);
    
    logger.info('Starting insight generation', { 
        requestId, 
        sectionsCount: dashboardData.otherSections?.length || 0,
        ip: requestMeta.ip 
    });
    
    try {
        // Extract facts bundle
        const factsBundle = extractFactsBundle(dashboardData);
        
        // Generate cache key
        const cacheKey = generateCacheKey(factsBundle);
        
        // Check cache first
        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info('Returning cached result', { requestId, cacheKey });
            return {
                ...cached,
                cached: true,
                requestId
            };
        }
        
        // Generate insight (with retry logic)
        let result;
        let attempt = 1;
        
        while (attempt <= AI_CONFIG.maxRetries + 1) {
            try {
                result = await callOpenAI(factsBundle);
                
                // If validation passed or it's a fallback, break
                if (result.fallback || validateOutput(result.insight, factsBundle).valid) {
                    break;
                }
                
                logger.warn(`Attempt ${attempt} failed validation, retrying`, { requestId });
                attempt++;
                
            } catch (error) {
                logger.error(`Attempt ${attempt} failed`, { requestId, error: error.message });
                if (attempt > AI_CONFIG.maxRetries) {
                    result = generateFallback(factsBundle);
                    break;
                }
                attempt++;
            }
        }
        
        // Add metadata
        result.generatedAt = new Date().toISOString();
        result.latency = Date.now() - startTime;
        result.requestId = requestId;
        result.factsSummary = {
            sectionsAnalyzed: factsBundle.sections.length,
            totalDataPoints: factsBundle.totalDataPoints,
            sectionsWithData: factsBundle.sections.filter(s => s.statistics).length
        };
        
        // Cache the result
        cache.set(cacheKey, result);
        
        logger.info('Insight generated successfully', { 
            requestId, 
            latency: result.latency,
            fallback: result.fallback,
            tokensUsed: result.tokensUsed || 0
        });
        
        return result;
        
    } catch (error) {
        logger.error('Insight generation failed', { requestId, error: error.message });
        return {
            insight: "Unable to generate insights at this time. Please try again later.",
            confidence: 0.5,
            priority: "low",
            error: true,
            generatedAt: new Date().toISOString(),
            latency: Date.now() - startTime,
            requestId
        };
    }
}

// Middleware for rate limiting
async function rateLimitMiddleware(req, res, next) {
    try {
        await rateLimiter.consume(req.ip || req.connection.remoteAddress);
        next();
    } catch (rejRes) {
        const msBeforeNext = rejRes.msBeforeNext || 1000;
        res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.round(msBeforeNext / 1000),
            message: 'Too many requests. Please try again later.'
        });
    }
}

module.exports = {
    generateInsights,
    rateLimitMiddleware,
    initializeOpenAI,
    logger
};