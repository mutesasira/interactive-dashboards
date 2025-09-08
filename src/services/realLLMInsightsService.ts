// Real LLM Insights Service - Frontend
// This service replaces the mock LLM service with real API calls

interface LLMInsight {
    id: string;
    type: "trend_analysis" | "pattern_detection" | "anomaly_detection" | "predictive_insight" | "actionable_recommendation" | "contextual_summary";
    title: string;
    content: string;
    confidence: number;
    priority: "critical" | "high" | "medium" | "low";
    category: "performance" | "efficiency" | "risk" | "opportunity" | "trend" | "quality";
    metadata: {
        dataSource: string[];
        timeRange?: string;
        entities?: string[];
        metrics?: string[];
    };
    generatedAt: Date;
    llmModel: string;
}

interface LLMResponse {
    insights: LLMInsight[];
    summary: string;
    analysisDepth: "basic" | "intermediate" | "advanced";
    tokensUsed: number;
}

interface AIApiResponse {
    success: boolean;
    data: {
        insight: string;
        confidence: number;
        priority: string;
        generatedAt: string;
        cached: boolean;
        metadata: {
            requestId: string;
            model?: string;
            tokensUsed?: number;
            latency: number;
            fallback: boolean;
            factsSummary: {
                sectionsAnalyzed: number;
                totalDataPoints: number;
                sectionsWithData: number;
            };
        };
    };
}

class RealLLMInsightsService {
    private apiUrl: string;
    private retryDelay = 1000; // 1 second
    private maxRetries = 2;

    constructor() {
        // Use localhost for development, adjust for production
        this.apiUrl = process.env.NODE_ENV === 'production' 
            ? '/api/ai/insights' 
            : 'http://localhost:3002/api/ai/insights';
    }

    private async callAIApi(dashboardData: any): Promise<AIApiResponse> {
        const requestBody = {
            dashboardData,
            userId: this.getCurrentUserId(),
            organizationUnit: this.getCurrentOrgUnit()
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add API key header if available
                ...(process.env.REACT_APP_AI_API_KEY && {
                    'X-API-Key': process.env.REACT_APP_AI_API_KEY
                })
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`AI API error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return response.json();
    }

    private getCurrentUserId(): string {
        // Extract user ID from your auth system (adapt to your implementation)
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || user.username || 'anonymous';
        } catch {
            return 'anonymous';
        }
    }

    private getCurrentOrgUnit(): string {
        // Extract org unit from your system (adapt to your implementation)
        try {
            const orgUnit = localStorage.getItem('selectedOrgUnit');
            return orgUnit || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    private convertApiResponseToInsight(apiResponse: AIApiResponse, sectionContext: any): LLMInsight[] {
        const { data } = apiResponse;
        const insight: LLMInsight = {
            id: `insight_${data.metadata.requestId}`,
            type: this.determineInsightType(data.insight),
            title: this.generateTitle(data.insight, data.metadata.fallback),
            content: data.insight,
            confidence: data.confidence,
            priority: data.priority as any,
            category: this.determineCategory(data.insight),
            metadata: {
                dataSource: sectionContext.otherSections?.map((s: any) => s.sectionTitle) || [sectionContext.sectionName],
                timeRange: "current dashboard state",
                entities: ["cross_section_analysis", "ai_generated"],
                metrics: ["sections_analyzed", "data_points", "trend_analysis"]
            },
            generatedAt: new Date(data.generatedAt),
            llmModel: data.metadata.model || "Real LLM"
        };

        return [insight];
    }

    private determineInsightType(content: string): LLMInsight['type'] {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('trend') || lowerContent.includes('increasing') || lowerContent.includes('decreasing')) {
            return 'trend_analysis';
        }
        if (lowerContent.includes('pattern') || lowerContent.includes('relationship')) {
            return 'pattern_detection';
        }
        if (lowerContent.includes('anomaly') || lowerContent.includes('outlier') || lowerContent.includes('unusual')) {
            return 'anomaly_detection';
        }
        if (lowerContent.includes('recommend') || lowerContent.includes('should') || lowerContent.includes('consider')) {
            return 'actionable_recommendation';
        }
        if (lowerContent.includes('predict') || lowerContent.includes('forecast') || lowerContent.includes('expect')) {
            return 'predictive_insight';
        }
        
        return 'contextual_summary';
    }

    private generateTitle(content: string, isFallback: boolean): string {
        const lowerContent = content.toLowerCase();
        
        if (isFallback) {
            return "Dashboard Overview";
        }
        
        if (lowerContent.includes('trend')) {
            return "Cross-Section Trend Analysis";
        }
        if (lowerContent.includes('section') && lowerContent.includes('analys')) {
            return "Multi-Section Data Analysis";
        }
        if (lowerContent.includes('relationship') || lowerContent.includes('pattern')) {
            return "Section Relationship Insights";
        }
        if (lowerContent.includes('recommend')) {
            return "AI Recommendations";
        }
        
        return "Dashboard Insights";
    }

    private determineCategory(content: string): LLMInsight['category'] {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('performance') || lowerContent.includes('metric')) {
            return 'performance';
        }
        if (lowerContent.includes('efficiency') || lowerContent.includes('optimize')) {
            return 'efficiency';
        }
        if (lowerContent.includes('risk') || lowerContent.includes('concern')) {
            return 'risk';
        }
        if (lowerContent.includes('opportunity') || lowerContent.includes('improve')) {
            return 'opportunity';
        }
        if (lowerContent.includes('trend') || lowerContent.includes('direction')) {
            return 'trend';
        }
        
        return 'quality';
    }

    private generateSummary(apiResponse: AIApiResponse): string {
        const { data } = apiResponse;
        const facts = data.metadata.factsSummary;
        
        return `Generated AI insight analyzing ${facts.totalDataPoints} data points across ${facts.sectionsAnalyzed} dashboard sections. ${data.cached ? 'Result retrieved from cache. ' : ''}Analysis ${data.metadata.fallback ? 'used fallback logic due to' : 'successfully processed'} with ${data.metadata.tokensUsed || 0} tokens consumed.`;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateInsights(sectionData: any): Promise<LLMResponse> {
        let lastError: Error;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`[RealLLM] Attempt ${attempt} - Calling AI API...`, {
                    sectionsCount: sectionData.otherSections?.length || 0,
                    analysisType: sectionData.analysisType
                });

                const apiResponse = await this.callAIApi(sectionData);
                
                console.log('[RealLLM] AI API response received:', {
                    cached: apiResponse.data.cached,
                    fallback: apiResponse.data.metadata.fallback,
                    tokensUsed: apiResponse.data.metadata.tokensUsed,
                    latency: apiResponse.data.metadata.latency
                });

                const insights = this.convertApiResponseToInsight(apiResponse, sectionData);
                const summary = this.generateSummary(apiResponse);

                return {
                    insights,
                    summary,
                    analysisDepth: "advanced",
                    tokensUsed: apiResponse.data.metadata.tokensUsed || 0
                };

            } catch (error) {
                lastError = error as Error;
                console.warn(`[RealLLM] Attempt ${attempt} failed:`, error);

                // Check if it's a rate limit error
                if (error instanceof Error && error.message.includes('429')) {
                    console.log('[RealLLM] Rate limited, waiting before retry...');
                    await this.delay(this.retryDelay * attempt);
                    continue;
                }

                // For other errors, wait a bit before retry
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay);
                    continue;
                }
            }
        }

        // All retries failed, return fallback response
        console.error('[RealLLM] All attempts failed, using fallback:', lastError);

        return this.generateFallbackResponse(sectionData, lastError);
    }

    private generateFallbackResponse(sectionData: any, error: Error): LLMResponse {
        const fallbackInsight: LLMInsight = {
            id: `fallback_${Date.now()}`,
            type: "contextual_summary",
            title: "Service Unavailable",
            content: `AI insights service is temporarily unavailable. ${sectionData.otherSections?.length > 0 ? `Dashboard contains ${sectionData.otherSections.length} sections ready for analysis.` : 'Add data to sections for AI analysis.'} Please try again later.`,
            confidence: 0.5,
            priority: "low",
            category: "quality",
            metadata: {
                dataSource: ["fallback_service"],
                timeRange: "current",
                entities: ["service_error"],
                metrics: ["availability"]
            },
            generatedAt: new Date(),
            llmModel: "Fallback Service"
        };

        return {
            insights: [fallbackInsight],
            summary: `AI service unavailable (${error.message}). Using fallback response.`,
            analysisDepth: "basic",
            tokensUsed: 0
        };
    }
}

export default RealLLMInsightsService;