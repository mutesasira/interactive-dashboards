import React, { useMemo, useState, useRef } from "react";
import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Divider,
    Heading,
    Badge,
    useToast,
    IconButton,
    Tooltip,
} from "@chakra-ui/react";
import { DownloadIcon, RepeatIcon } from "@chakra-ui/icons";
import { useStore } from "effector-react";
import html2canvas from "html2canvas";
import JsPDF from "jspdf";
import { saveAs } from "file-saver";
import { ChartProps } from "../../interfaces";
import { $dashboard, $visualizationData } from "../../Store";
import aiInsightsService, { DashboardData } from "../../services/aiInsightsService";

interface InsightItem {
    id: string;
    type: "trend" | "comparison" | "outlier" | "summary" | "recommendation";
    title: string;
    description: string;
    value?: string | number;
    confidence: "high" | "medium" | "low";
    recommendation?: string;
    priority?: "high" | "medium" | "low";
}

const InsightsVisualization = ({
    dataProperties,
    layoutProperties,
}: ChartProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [insights, setInsights] = useState<InsightItem[]>([]);
    const [isAutoRegenerating, setIsAutoRegenerating] = useState(false);
    const toast = useToast();
    const insightsRef = useRef<HTMLDivElement>(null);
    const dashboard = useStore($dashboard);
    const visualizationData = useStore($visualizationData);

    // Extract properties
    const title = dataProperties?.["data.title"] || "Insights";
    const backgroundColor = layoutProperties?.["layout.backgroundColor"] || "#ffffff";
    const textColor = dataProperties?.["data.textColor"] || "#000000";
    const fontSize = dataProperties?.["data.fontSize"] || 14;
    const autoGenerate = dataProperties?.["data.autoGenerate"] || false;
    const maxInsights = dataProperties?.["data.maxInsights"] || 10;
    const includeDataValues = dataProperties?.["data.includeDataValues"] !== false;
    const includeTrends = dataProperties?.["data.includeTrends"] !== false;
    const includeGeoComparisons = dataProperties?.["data.includeGeoComparisons"] !== false;
    const numberFormat = dataProperties?.["data.numberFormat"] || "standard";
    const insightFocus = dataProperties?.["data.insightFocus"] || "all";
    const useAI = dataProperties?.["data.useAI"] !== false; // Enable AI by default
    const aiApiKey = dataProperties?.["data.aiApiKey"] || "";

    // AI-powered insight generation
    const generateAIInsights = async (): Promise<InsightItem[]> => {
        if (!useAI) {
            return generateLocalInsights();
        }

        // Set API key if provided
        if (aiApiKey) {
            aiInsightsService.setApiKey(aiApiKey);
        }

        try {
            // Prepare enhanced dashboard data for cross-visualization analysis
            const dashboardData: DashboardData = {
                visualizations: Object.entries(visualizationData).map(([vizId, data]) => {
                    // Find the visualization metadata
                    const vizSection = dashboard.sections?.find(section => 
                        section.visualizations?.some(viz => viz.id === vizId)
                    );
                    const vizInfo = vizSection?.visualizations.find(viz => viz.id === vizId);
                    
                    // Enhanced data preparation for cross-analysis
                    const processedData = Array.isArray(data) ? data.map(item => {
                        // Standardize common field names for better cross-analysis
                        const processed = { ...item };
                        
                        // Add metadata about the visualization for context
                        processed._vizType = vizInfo?.type || 'unknown';
                        processed._vizTitle = vizInfo?.name || 'Untitled';
                        
                        return processed;
                    }) : [];
                    
                    return {
                        id: vizId,
                        title: vizInfo?.name || 'Untitled Visualization',
                        type: vizInfo?.type || 'unknown',
                        data: processedData
                    };
                }).filter(viz => viz.data.length > 0), // Only include visualizations with data
                metadata: {
                    totalVisualizations: Object.keys(visualizationData).length,
                    dashboardTitle: dashboard.name || 'Dashboard',
                    dateRange: `Analysis generated: ${new Date().toLocaleString()}`,
                    // Add additional context for cross-analysis
                    analysisType: 'cross-visualization',
                    focusAreas: [
                        'gender-analysis',
                        'geographic-patterns', 
                        'performance-correlations',
                        'resource-outcomes',
                        'temporal-trends'
                    ]
                }
            };

            // Generate insights using AI
            const aiInsights = await aiInsightsService.generateInsights(dashboardData);
            
            // Convert AI insights to InsightItem format
            return aiInsights.map(insight => ({
                id: insight.id,
                type: insight.type,
                title: insight.title,
                description: insight.description,
                value: insight.value,
                confidence: insight.confidence,
                recommendation: insight.recommendation,
                priority: insight.priority
            })).slice(0, maxInsights);

        } catch (error) {
            console.warn('AI insight generation failed, falling back to local analysis:', error);
            return generateLocalInsights();
        }
    };

    const generateLocalInsights = (): InsightItem[] => {
        return generateInsights();
    };

    const generateInsights = useMemo(() => {
        return (): InsightItem[] => {
            const allInsights: InsightItem[] = [];

            // Helper function to format numbers and percentages
            const formatNumber = (num: number): string => {
                // Check for invalid numbers first
                if (isNaN(num) || !isFinite(num)) {
                    return '0';
                }
                
                const roundedNum = Math.round(num);
                
                switch (numberFormat) {
                    case "compact":
                        if (roundedNum >= 1000000) return (roundedNum / 1000000).toFixed(1) + 'M';
                        if (roundedNum >= 1000) return (roundedNum / 1000).toFixed(1) + 'K';
                        return roundedNum.toString();
                    case "scientific":
                        return roundedNum.toExponential(2);
                    default:
                        return new Intl.NumberFormat('en-US').format(roundedNum);
                }
            };

            const formatPercent = (num: number): string => `${Math.round(num)}%`;

            // Context-aware visualization analysis based on title and data content
            const analyzeVisualizationWithContext = (vizItems: any[], vizId: string, vizTitle: string, vizType: string, formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                if (vizItems.length === 0) return null;

                const titleLower = vizTitle.toLowerCase();
                const dataElements = vizItems.map(item => (item.dataElement || '').toLowerCase()).join(' ');
                const hasRegions = vizItems.some(item => item.orgUnit && item.orgUnit.trim() !== '');
                

                // GENDER-BASED ANALYSIS
                if (titleLower.includes('gender') || titleLower.includes('girls') || titleLower.includes('boys') || 
                    titleLower.includes('male') || titleLower.includes('female') ||
                    dataElements.includes('girl') || dataElements.includes('boy') || dataElements.includes('male') || dataElements.includes('female')) {
                    
                    const genderAnalysis = analyzeGenderDistribution(vizItems, formatNumber, formatPercent);
                    if (genderAnalysis) {
                        genderAnalysis.title = `${vizTitle} Analysis`;
                        return genderAnalysis;
                    }
                }

                // PROGRESSION/DROPOUT ANALYSIS
                if (titleLower.includes('progression') || titleLower.includes('dropout') || titleLower.includes('repeat') ||
                    titleLower.includes('learning outcomes') || titleLower.includes('academic performance') ||
                    dataElements.includes('progression') || dataElements.includes('repetition') || dataElements.includes('dropout')) {
                    
                    const progressionAnalysis = analyzeProgressionData(vizItems, formatNumber, formatPercent);
                    if (progressionAnalysis) {
                        progressionAnalysis.title = titleLower.includes('primary') ? 'Primary Education Outcomes' : 
                                                   titleLower.includes('secondary') ? 'Secondary Education Outcomes' : 
                                                   'Student Learning Outcomes';
                        return progressionAnalysis;
                    }
                }

                // ENROLLMENT ANALYSIS
                if (titleLower.includes('enrollment') || titleLower.includes('enrolment') || titleLower.includes('students') ||
                    titleLower.includes('learners') || titleLower.includes('participation') ||
                    dataElements.includes('enrollment') || dataElements.includes('enrolment')) {
                    
                    const enrollmentAnalysis = analyzeEnrollmentPatterns(vizItems, formatNumber, formatPercent);
                    if (enrollmentAnalysis) {
                        enrollmentAnalysis.title = `${vizTitle} Insights`;
                        return enrollmentAnalysis;
                    }
                }

                // TEACHER-RELATED ANALYSIS
                if (titleLower.includes('teacher') || titleLower.includes('educator') || titleLower.includes('staff') ||
                    titleLower.includes('instructor') || dataElements.includes('teacher')) {
                    
                    const teacherAnalysis = analyzeTeacherData(vizItems, formatNumber, formatPercent);
                    if (teacherAnalysis) {
                        teacherAnalysis.title = `${vizTitle} Assessment`;
                        return teacherAnalysis;
                    }
                }

                // INFRASTRUCTURE ANALYSIS
                if (titleLower.includes('infrastructure') || titleLower.includes('facilities') || titleLower.includes('wash') ||
                    titleLower.includes('toilet') || titleLower.includes('water') || titleLower.includes('classroom') ||
                    dataElements.includes('toilet') || dataElements.includes('water') || dataElements.includes('wash')) {
                    
                    const infraAnalysis = analyzeInfrastructure(vizItems, formatNumber, formatPercent);
                    if (infraAnalysis) {
                        infraAnalysis.title = `${vizTitle} Status`;
                        return infraAnalysis;
                    }
                }

                // REGIONAL COMPARISON (only if it has regional data and doesn't fit other categories)
                if (hasRegions && vizItems.length >= 3) {
                    const regionalAnalysis = analyzeRegionalDistribution(vizItems, formatNumber, formatPercent);
                    if (regionalAnalysis) {
                        // Customize title based on visualization content
                        if (titleLower.includes('enrollment') || titleLower.includes('students')) {
                            regionalAnalysis.title = 'Regional Enrollment Comparison';
                        } else if (titleLower.includes('teacher')) {
                            regionalAnalysis.title = 'Regional Teacher Distribution';
                        } else if (titleLower.includes('progression') || titleLower.includes('performance')) {
                            regionalAnalysis.title = 'Regional Performance Comparison';
                        } else {
                            regionalAnalysis.title = `${vizTitle} by Region`;
                        }
                        return regionalAnalysis;
                    }
                }

                // CONTEXTUAL QUANTITATIVE ANALYSIS
                return analyzeQuantitativeDataWithContext(vizItems, vizId, vizTitle, formatNumber, formatPercent);
            };

            // Context-aware quantitative analysis
            const analyzeQuantitativeDataWithContext = (items: any[], vizId: string, vizTitle: string, formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                if (items.length === 0) return null;

                const values = items.map(item => item.value);
                const total = values.reduce((sum, val) => sum + val, 0);
                const avg = total / values.length;
                const max = Math.max(...values);
                const min = Math.min(...values);
                
                const sortedItems = [...items].sort((a, b) => b.value - a.value);
                const topPerformer = sortedItems[0];
                const bottomPerformer = sortedItems[sortedItems.length - 1];
                
                const titleLower = vizTitle.toLowerCase();
                let description = '';
                let contextualTitle = vizTitle || 'Data Analysis';
                let recommendation = '';

                // Generate insights based on the visualization title context
                if (titleLower.includes('enrollment') || titleLower.includes('students') || titleLower.includes('learners')) {
                    contextualTitle = `${vizTitle} Overview`;
                    const hasRegions = items.some(item => item.orgUnit && item.orgUnit.trim() !== '');
                    
                    if (hasRegions && items.length >= 3) {
                        const topRegion = (topPerformer.orgUnit || 'Unknown').replace(' Region', '');
                        const bottomRegion = (bottomPerformer.orgUnit || 'Unknown').replace(' Region', '');
                        
                        description = `Student enrollment shows ${topRegion} leading with ${formatNumber(topPerformer.value)} students, while ${bottomRegion} has ${formatNumber(bottomPerformer.value)}. Total enrollment across all regions reaches ${formatNumber(total)}, with an average of ${formatNumber(avg)} students per region.`;
                        
                        if (topPerformer.value > bottomPerformer.value * 1.5) {
                            description += ` The significant ${formatPercent((topPerformer.value - bottomPerformer.value) / topPerformer.value)} difference indicates uneven distribution requiring targeted interventions.`;
                            recommendation = `Focus on expanding capacity in ${topRegion} and improving access in ${bottomRegion} to balance regional enrollment.`;
                        } else {
                            description += ` The relatively balanced distribution suggests equitable access across regions.`;
                            recommendation = 'Maintain current enrollment levels while monitoring for emerging disparities.';
                        }
                    } else {
                        description = `Current enrollment data shows ${formatNumber(total)} total students across ${items.length} categories, ranging from ${formatNumber(min)} to ${formatNumber(max)} with consistent distribution patterns.`;
                        recommendation = 'Continue monitoring enrollment trends and capacity planning.';
                    }
                    
                } else if (titleLower.includes('teacher') || titleLower.includes('staff') || titleLower.includes('educator')) {
                    contextualTitle = `${vizTitle} Distribution`;
                    
                    description = `Teaching staff distribution shows ${formatNumber(total)} total educators across regions, with ${(topPerformer.orgUnit || 'the leading region').replace(' Region', '')} having ${formatNumber(topPerformer.value)} teachers and ${(bottomPerformer.orgUnit || 'the region with fewest').replace(' Region', '')} having ${formatNumber(bottomPerformer.value)}.`;
                    
                    if (items.length >= 3) {
                        const variation = (max - min) / avg;
                        if (variation > 0.5) {
                            description += ` High variation in teacher distribution suggests uneven educational resources that need rebalancing.`;
                            recommendation = 'Redistribute teaching staff to ensure equitable teacher-student ratios across all regions.';
                        } else {
                            description += ` Teacher distribution is relatively balanced across regions.`;
                            recommendation = 'Maintain current staffing levels while planning for future growth.';
                        }
                    }
                    
                } else if (titleLower.includes('performance') || titleLower.includes('outcomes') || titleLower.includes('results')) {
                    contextualTitle = `${vizTitle} Summary`;
                    
                    description = `Performance metrics reveal ${formatNumber(total)} total outcomes across measured areas. Top performing area shows ${formatNumber(topPerformer.value)} while the lowest shows ${formatNumber(bottomPerformer.value)}, indicating a ${formatPercent((topPerformer.value - bottomPerformer.value) / topPerformer.value)} performance gap.`;
                    
                    const cv = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length) / avg;
                    if (cv > 0.3) {
                        description += ` High performance variation suggests some areas need targeted improvement strategies.`;
                        recommendation = 'Analyze high-performing areas to identify best practices and implement improvement plans for underperforming regions.';
                    } else {
                        description += ` Consistent performance levels indicate stable educational delivery.`;
                        recommendation = 'Continue current approaches while identifying opportunities for system-wide enhancement.';
                    }
                    
                } else {
                    // Generic analysis with title context
                    description = `${vizTitle} data displays ${items.length} data points with values ranging from ${formatNumber(min)} to ${formatNumber(max)}. The total value of ${formatNumber(total)} represents the combined measure across all categories, with an average of ${formatNumber(avg)} per category.`;
                    
                    const hasHighVariation = (max - min) / avg > 0.5;
                    if (hasHighVariation) {
                        description += ` Notable variation between highest and lowest values suggests different performance levels or resource needs.`;
                        recommendation = 'Investigate factors contributing to variation and develop targeted strategies for improvement.';
                    } else {
                        description += ` Values show consistent patterns across categories.`;
                        recommendation = 'Monitor trends while maintaining current performance standards.';
                    }
                }

                return {
                    id: `contextual-analysis-${vizId}-${Date.now()}`,
                    type: "summary",
                    title: contextualTitle,
                    description,
                    value: formatNumber(total),
                    confidence: "high",
                    recommendation: recommendation || 'Continue monitoring and adjust strategies as needed.'
                };
            };

            // Gender distribution analysis
            const analyzeGenderDistribution = (items: any[], formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                const genderItems = items.filter(item => 
                    item.dataElement && (
                        item.dataElement.toLowerCase().includes('girl') || 
                        item.dataElement.toLowerCase().includes('boy') ||
                        item.dataElement.toLowerCase().includes('female') ||
                        item.dataElement.toLowerCase().includes('male') ||
                        item.category?.toLowerCase().includes('girl') ||
                        item.category?.toLowerCase().includes('boy') ||
                        item.category?.toLowerCase().includes('female') ||
                        item.category?.toLowerCase().includes('male')
                    )
                );

                if (genderItems.length >= 2) {
                    const girls = genderItems.filter(item => 
                        item.dataElement?.toLowerCase().includes('girl') || 
                        item.dataElement?.toLowerCase().includes('female') ||
                        item.category?.toLowerCase().includes('girl') ||
                        item.category?.toLowerCase().includes('female')
                    );
                    const boys = genderItems.filter(item => 
                        item.dataElement?.toLowerCase().includes('boy') || 
                        item.dataElement?.toLowerCase().includes('male') ||
                        item.category?.toLowerCase().includes('boy') ||
                        item.category?.toLowerCase().includes('male')
                    );

                    if (girls.length > 0 && boys.length > 0) {
                        const girlsTotal = girls.reduce((sum, item) => sum + item.value, 0);
                        const boysTotal = boys.reduce((sum, item) => sum + item.value, 0);
                        const total = girlsTotal + boysTotal;
                        const girlsPercent = total > 0 ? (girlsTotal / total) * 100 : 0;
                        const difference = Math.abs(girlsTotal - boysTotal);

                        let description = '';
                        if (difference < total * 0.05) { // Less than 5% difference
                            description = `Gender distribution is nearly balanced with ${formatNumber(girlsTotal)} girls (${formatPercent(girlsPercent)}) and ${formatNumber(boysTotal)} boys (${formatPercent(100 - girlsPercent)}). This excellent balance suggests equitable access across genders.`;
                        } else if (girlsTotal > boysTotal) {
                            description = `Girls slightly outnumber boys with ${formatNumber(girlsTotal)} girls (${formatPercent(girlsPercent)}) vs ${formatNumber(boysTotal)} boys (${formatPercent(100 - girlsPercent)})—a difference of about ${formatNumber(difference)} students. This ${formatPercent(girlsPercent - 50)} percentage point advantage suggests good female participation.`;
                        } else {
                            description = `Boys outnumber girls with ${formatNumber(boysTotal)} boys (${formatPercent(100 - girlsPercent)}) vs ${formatNumber(girlsTotal)} girls (${formatPercent(girlsPercent)})—a gap of ${formatNumber(difference)} students. This may indicate barriers to female participation that warrant investigation.`;
                        }

                        return {
                            id: `gender-analysis-${Date.now()}`,
                            type: "comparison",
                            title: "Gender Distribution",
                            description,
                            value: `${formatPercent(girlsPercent)} girls`,
                            confidence: "high",
                            recommendation: girlsPercent < 45 ? "Implement targeted programs to increase female enrollment and address barriers to girls' education." : girlsPercent > 55 ? "Monitor for potential barriers affecting boys' participation." : "Maintain current gender balance through continued equitable policies."
                        };
                    }
                }
                return null;
            };

            // Regional distribution analysis
            const analyzeRegionalDistribution = (items: any[], formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                const regionItems = items.filter(item => item.orgUnit && item.orgUnit.trim() !== '');
                
                if (regionItems.length >= 3) {
                    const regionTotals = regionItems.reduce((acc: any, item) => {
                        const region = item.orgUnit;
                        const value = Number(item.value);
                        acc[region] = (acc[region] || 0) + value;
                        return acc;
                    }, {});

                    const regions = Object.entries(regionTotals).map(([name, total]: [string, any]) => ({
                        name,
                        total: Number(total)
                    })).sort((a, b) => b.total - a.total);

                    if (regions.length >= 2) {
                        const highest = regions[0];
                        const lowest = regions[regions.length - 1];
                        const totalAcrossRegions = regions.reduce((sum, r) => sum + r.total, 0);
                        const avgPerRegion = totalAcrossRegions / regions.length;
                        const variance = regions.reduce((sum, r) => sum + Math.pow(r.total - avgPerRegion, 2), 0) / regions.length;
                        const stdDev = Math.sqrt(variance);
                        const coefficientOfVariation = avgPerRegion > 0 ? stdDev / avgPerRegion : 0;

                        let description = '';
                        
                        if (coefficientOfVariation < 0.2) {
                            description = `Regional distribution is fairly balanced across ${regions.length} regions, ranging from ${formatNumber(lowest.total)} (${lowest.name}) to ${formatNumber(highest.total)} (${highest.name})—a manageable ${formatPercent((highest.total - lowest.total) / lowest.total)} difference.`;
                        } else {
                            if (regions.length >= 4) {
                                const topRegions = regions.slice(0, 2);
                                const bottomRegions = regions.slice(-2);
                                
                                description = `Significant regional variation detected. ${topRegions.map(r => r.name.replace(' Region', '')).join(' and ')} lead with around ${formatNumber(topRegions[0].total)} and ${formatNumber(topRegions[1].total)} respectively, while ${bottomRegions.map(r => r.name.replace(' Region', '')).join(' and ')} lag behind at approximately ${formatNumber(bottomRegions[bottomRegions.length - 1].total)} and ${formatNumber(bottomRegions[bottomRegions.length - 2].total)}. This means ${topRegions[0].name.replace(' Region', '')} will need the most resources, and ${lowest.name.replace(' Region', '')} may warrant programs to boost its comparatively lower performance.`;
                            } else {
                                description = `Regional comparison shows ${highest.name.replace(' Region', '')} leading with ${formatNumber(highest.total)} while ${lowest.name.replace(' Region', '')} shows ${formatNumber(lowest.total)}—a ${formatPercent((highest.total - lowest.total) / lowest.total)} performance gap that requires attention.`;
                            }
                        }

                        return {
                            id: `regional-analysis-${Date.now()}`,
                            type: "comparison",
                            title: "Regional Performance",
                            description,
                            value: formatNumber(totalAcrossRegions),
                            confidence: "high",
                            recommendation: coefficientOfVariation > 0.3 ? `Focus additional resources on ${lowest.name.replace(' Region', '')} to address the ${formatPercent((highest.total - lowest.total) / lowest.total)} gap with ${highest.name.replace(' Region', '')}.` : "Maintain balanced resource allocation across regions."
                        };
                    }
                }
                return null;
            };

            // Grade level analysis
            const analyzeGradeLevelDistribution = (items: any[], formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                const gradeItems = items.filter(item => {
                    const element = (item.dataElement || '').toLowerCase();
                    const period = (item.period || '').toLowerCase();
                    return element.includes('grade') || element.includes('class') || element.includes('level') || 
                           element.includes('js1') || element.includes('js2') || element.includes('js3') ||
                           element.includes('primary') || element.includes('secondary') ||
                           period.includes('grade') || period.includes('js') || period.includes('primary');
                });

                if (gradeItems.length >= 3) {
                    const gradeMap = gradeItems.reduce((acc: any, item) => {
                        let grade = 'Other';
                        const element = (item.dataElement || '').toLowerCase();
                        const period = (item.period || '').toLowerCase();
                        
                        if (element.includes('js1') || period.includes('js1')) grade = 'JS1';
                        else if (element.includes('js2') || period.includes('js2')) grade = 'JS2';
                        else if (element.includes('js3') || period.includes('js3')) grade = 'JS3';
                        else if (element.includes('primary') || period.includes('primary')) grade = 'Primary';
                        else if (element.includes('secondary') || period.includes('secondary')) grade = 'Secondary';
                        else if (element.match(/grade\s*(\d+)/)) {
                            const match = element.match(/grade\s*(\d+)/);
                            grade = `Grade ${match![1]}`;
                        }

                        acc[grade] = (acc[grade] || 0) + item.value;
                        return acc;
                    }, {});

                    const grades = Object.entries(gradeMap).map(([name, total]: [string, any]) => ({
                        name,
                        total: Number(total)
                    })).sort((a, b) => a.name.localeCompare(b.name));

                    if (grades.length >= 2) {
                        const highest = grades.reduce((max, current) => current.total > max.total ? current : max);
                        const lowest = grades.reduce((min, current) => current.total < min.total ? current : min);

                        // Check for typical dropoff patterns
                        const js1 = grades.find(g => g.name === 'JS1');
                        const js2 = grades.find(g => g.name === 'JS2');
                        const js3 = grades.find(g => g.name === 'JS3');

                        let description = '';
                        if (js1 && js2 && js3) {
                            const js1ToJs2Drop = js1.total > 0 ? ((js1.total - js2.total) / js1.total) * 100 : 0;
                            const js2ToJs3Drop = js2.total > 0 ? ((js2.total - js3.total) / js2.total) * 100 : 0;

                            description = `Enrollment across junior secondary shows ${formatNumber(js1.total)} in JS1, ${formatNumber(js2.total)} in JS2, and ${formatNumber(js3.total)} in JS3. `;
                            
                            if (js1ToJs2Drop > 15) {
                                description += `There's a concerning ${formatPercent(js1ToJs2Drop)} drop from JS1 to JS2, suggesting retention challenges at the transition point.`;
                            } else if (js2ToJs3Drop > 15) {
                                description += `A ${formatPercent(js2ToJs3Drop)} drop from JS2 to JS3 indicates students are leaving before completion.`;
                            } else {
                                description += `Retention appears stable with minimal dropoff between grades, indicating effective progression support.`;
                            }
                        } else {
                            description = `Grade-level enrollment ranges from ${formatNumber(lowest.total)} (${lowest.name}) to ${formatNumber(highest.total)} (${highest.name}). `;
                            
                            if (highest.total > lowest.total * 2) {
                                description += `The ${formatPercent((highest.total - lowest.total) / lowest.total)} difference between highest and lowest grades suggests uneven capacity or demand across levels.`;
                            } else {
                                description += `Distribution is relatively balanced, indicating consistent enrollment patterns across grade levels.`;
                            }
                        }

                        return {
                            id: `grade-analysis-${Date.now()}`,
                            type: "trend",
                            title: "Grade Level Patterns",
                            description,
                            value: `${grades.length} levels`,
                            confidence: "high",
                            recommendation: js1 && js2 && ((js1.total - js2.total) / js1.total > 0.15) ? "Implement transition support programs to improve retention from JS1 to JS2." : "Continue monitoring grade-level progression for early intervention opportunities."
                        };
                    }
                }
                return null;
            };

            // Enrollment patterns analysis
            const analyzeEnrollmentPatterns = (items: any[], formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                const enrollmentItems = items.filter(item => {
                    const element = (item.dataElement || '').toLowerCase();
                    return element.includes('enrollment') || element.includes('enrolment') || element.includes('enrolled');
                });

                if (enrollmentItems.length >= 2) {
                    const total = enrollmentItems.reduce((sum, item) => sum + item.value, 0);
                    const avg = total / enrollmentItems.length;
                    const sorted = enrollmentItems.sort((a, b) => b.value - a.value);
                    const highest = sorted[0];
                    const lowest = sorted[sorted.length - 1];
                    
                    // Check for time-based patterns if periods are available
                    const byPeriod = enrollmentItems.reduce((acc: any, item) => {
                        if (item.period && item.period.trim() !== '') {
                            acc[item.period] = (acc[item.period] || 0) + item.value;
                        }
                        return acc;
                    }, {});

                    const periods = Object.keys(byPeriod);
                    let description = '';

                    if (periods.length >= 2) {
                        const sortedPeriods = periods.sort();
                        const latest = byPeriod[sortedPeriods[sortedPeriods.length - 1]];
                        const previous = byPeriod[sortedPeriods[sortedPeriods.length - 2]];
                        const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

                        description = `Enrollment shows ${Math.abs(change) > 5 ? 'significant' : 'moderate'} ${change > 0 ? 'growth' : 'decline'} of ${formatPercent(Math.abs(change))} from ${sortedPeriods[sortedPeriods.length - 2]} (${formatNumber(previous)}) to ${sortedPeriods[sortedPeriods.length - 1]} (${formatNumber(latest)}). Total enrollment across all categories: ${formatNumber(total)}.`;
                    } else {
                        description = `Current enrollment totals ${formatNumber(total)} students across ${enrollmentItems.length} categories, with individual enrollments ranging from ${formatNumber(lowest.value)} to ${formatNumber(highest.value)}—an average of ${formatNumber(avg)} per category.`;
                    }

                    return {
                        id: `enrollment-analysis-${Date.now()}`,
                        type: "trend",
                        title: "Enrollment Patterns",
                        description,
                        value: formatNumber(total),
                        confidence: "high",
                        recommendation: periods.length >= 2 && byPeriod[periods[periods.length - 1]] < byPeriod[periods[periods.length - 2]] * 0.95 ? "Investigate causes of enrollment decline and implement retention strategies." : "Monitor enrollment trends to maintain current positive trajectory."
                    };
                }
                return null;
            };

            // Infrastructure analysis
            const analyzeInfrastructure = (items: any[], _formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                const infraItems = items.filter(item => {
                    const element = (item.dataElement || '').toLowerCase();
                    return element.includes('toilet') || element.includes('water') || element.includes('classroom') || 
                           element.includes('wash') || element.includes('facility') || element.includes('infrastructure') ||
                           element.includes('handwashing') || element.includes('sanitation');
                });

                if (infraItems.length >= 2) {
                    let description = '';
                    const infraMap = infraItems.reduce((acc: any, item) => {
                        const element = (item.dataElement || '').toLowerCase();
                        if (element.includes('toilet') || element.includes('latrine')) {
                            acc.toilets = (acc.toilets || 0) + item.value;
                        } else if (element.includes('water') && !element.includes('handwashing')) {
                            acc.water = (acc.water || 0) + item.value;
                        } else if (element.includes('handwashing') || element.includes('hand washing')) {
                            acc.handwashing = (acc.handwashing || 0) + item.value;
                        } else if (element.includes('classroom')) {
                            acc.classrooms = (acc.classrooms || 0) + item.value;
                        }
                        return acc;
                    }, {});

                    const facilities = Object.keys(infraMap);
                    if (facilities.length >= 2) {
                        const values = Object.values(infraMap) as number[];
                        const highest = Math.max(...values);
                        const lowest = Math.min(...values);
                        const facilityNames = Object.keys(infraMap);
                        
                        if (infraMap.handwashing && infraMap.toilets && infraMap.water) {
                            const handwashingPercent = infraMap.handwashing;
                            const toiletsPercent = infraMap.toilets;
                            const waterPercent = infraMap.water;
                            
                            description = `WASH infrastructure shows ${formatPercent(handwashingPercent)} of schools have handwashing facilities, ${formatPercent(toiletsPercent)} have functional toilets, and ${formatPercent(waterPercent)} have usable water sources. `;
                            
                            if (handwashingPercent > toiletsPercent + 20 || handwashingPercent > waterPercent + 20) {
                                description += `The gap between handwashing availability (${formatPercent(handwashingPercent)}) and basic facilities raises health concerns—toilet and water infrastructure should be prioritized.`;
                            } else {
                                description += `Infrastructure levels are reasonably aligned, supporting good hygiene practices.`;
                            }
                        } else {
                            description = `Infrastructure data shows facilities ranging from ${formatPercent(lowest)} to ${formatPercent(highest)} availability across ${facilityNames.join(', ')}. `;
                            
                            if (highest > lowest * 2) {
                                description += `The significant variation suggests uneven infrastructure development that needs addressing.`;
                            }
                        }

                        return {
                            id: `infrastructure-analysis-${Date.now()}`,
                            type: "summary",
                            title: "Infrastructure Assessment",
                            description,
                            value: `${facilities.length} facilities`,
                            confidence: "high",
                            recommendation: lowest < 50 ? "Prioritize infrastructure investments in underserved facilities to meet basic standards." : "Maintain current infrastructure while planning for capacity expansion."
                        };
                    }
                }
                return null;
            };

            // Teacher data analysis
            const analyzeTeacherData = (items: any[], formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                const teacherItems = items.filter(item => {
                    const element = (item.dataElement || '').toLowerCase();
                    return element.includes('teacher') || element.includes('educator') || element.includes('instructor');
                });

                if (teacherItems.length >= 2) {
                    const total = teacherItems.reduce((sum, item) => sum + item.value, 0);
                    
                    // Look for qualified vs unqualified, or male vs female teachers
                    const qualified = teacherItems.filter(item => 
                        (item.dataElement || '').toLowerCase().includes('qualified') ||
                        (item.dataElement || '').toLowerCase().includes('trained')
                    );
                    const unqualified = teacherItems.filter(item => 
                        (item.dataElement || '').toLowerCase().includes('unqualified') ||
                        (item.dataElement || '').toLowerCase().includes('untrained')
                    );
                    
                    const female = teacherItems.filter(item => 
                        (item.dataElement || '').toLowerCase().includes('female') ||
                        (item.dataElement || '').toLowerCase().includes('women')
                    );
                    const male = teacherItems.filter(item => 
                        (item.dataElement || '').toLowerCase().includes('male') ||
                        (item.dataElement || '').toLowerCase().includes('men')
                    );

                    let description = `Teacher workforce totals ${formatNumber(total)} across all categories. `;

                    if (qualified.length > 0 && unqualified.length > 0) {
                        const qualifiedTotal = qualified.reduce((sum, item) => sum + item.value, 0);
                        const unqualifiedTotal = unqualified.reduce((sum, item) => sum + item.value, 0);
                        const qualifiedPercent = (qualifiedTotal / (qualifiedTotal + unqualifiedTotal)) * 100;
                        
                        description += `${formatPercent(qualifiedPercent)} are qualified teachers (${formatNumber(qualifiedTotal)} vs ${formatNumber(unqualifiedTotal)} unqualified). `;
                        
                        if (qualifiedPercent < 70) {
                            description += `This low qualification rate poses quality concerns and needs urgent professional development.`;
                        } else {
                            description += `Qualification levels are acceptable but could be improved with continued training programs.`;
                        }
                    }

                    if (female.length > 0 && male.length > 0) {
                        const femaleTotal = female.reduce((sum, item) => sum + item.value, 0);
                        const maleTotal = male.reduce((sum, item) => sum + item.value, 0);
                        const femalePercent = (femaleTotal / (femaleTotal + maleTotal)) * 100;
                        
                        description += ` Gender distribution shows ${formatPercent(femalePercent)} female teachers (${formatNumber(femaleTotal)}) vs ${formatPercent(100 - femalePercent)} male (${formatNumber(maleTotal)}).`;
                        
                        if (femalePercent < 40) {
                            description += ` Low female representation may impact girls' role models and retention.`;
                        }
                    }

                    return {
                        id: `teacher-analysis-${Date.now()}`,
                        type: "summary",
                        title: "Teacher Workforce",
                        description,
                        value: formatNumber(total),
                        confidence: "high",
                        recommendation: qualified.length > 0 && (qualified.reduce((sum, item) => sum + item.value, 0) / (qualified.reduce((sum, item) => sum + item.value, 0) + unqualified.reduce((sum, item) => sum + item.value, 0))) < 0.7 ? "Invest in teacher training programs to improve qualification rates and education quality." : "Continue supporting teacher professional development and recruitment efforts."
                    };
                }
                return null;
            };

            // Progression/dropout analysis
            const analyzeProgressionData = (items: any[], formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                const progressionItems = items.filter(item => {
                    const element = (item.dataElement || '').toLowerCase();
                    return element.includes('dropout') || element.includes('progression') || element.includes('repeat') || 
                           element.includes('completion') || element.includes('graduate');
                });

                if (progressionItems.length >= 3) {
                    const progression = progressionItems.filter(item => 
                        (item.dataElement || '').toLowerCase().includes('progression')
                    );
                    const repetition = progressionItems.filter(item => 
                        (item.dataElement || '').toLowerCase().includes('repetition')
                    );
                    const dropout = progressionItems.filter(item => 
                        (item.dataElement || '').toLowerCase().includes('dropout')
                    );

                    let description = '';
                    let levelType = '';
                    
                    // Determine if this is Primary or Secondary data
                    if (progressionItems.some(item => (item.dataElement || '').toLowerCase().includes('primary'))) {
                        levelType = 'Primary';
                    } else if (progressionItems.some(item => (item.dataElement || '').toLowerCase().includes('secondary'))) {
                        levelType = 'Secondary';
                    }

                    if (progression.length > 0 && repetition.length > 0) {
                        const progressionTotal = progression.reduce((sum, item) => sum + Number(item.value), 0);
                        const repetitionTotal = repetition.reduce((sum, item) => sum + Number(item.value), 0);
                        const total = progressionTotal + repetitionTotal;
                        const progressionRate = total > 0 ? (progressionTotal / total) * 100 : 0;

                        description = `${levelType ? `${levelType} l` : 'L'}earning outcomes show ${formatNumber(progressionTotal)} students progressed vs ${formatNumber(repetitionTotal)} repeated—a ${formatPercent(progressionRate)} progression rate. `;
                        
                        if (progressionRate < 80) {
                            description += `This ${formatPercent(100 - progressionRate)} repetition rate indicates academic challenges requiring targeted support interventions.`;
                        } else if (progressionRate > 90) {
                            description += `Excellent progression rates demonstrate effective teaching and strong learning support systems.`;
                        } else {
                            description += `Solid progression rates suggest generally effective educational delivery with room for improvement.`;
                        }
                    }

                    if (dropout.length > 0) {
                        const dropoutTotal = dropout.reduce((sum, item) => sum + Number(item.value), 0);
                        const dropoutByRegion = dropout.reduce((acc: any, item) => {
                            const region = item.orgUnit?.replace(' Region', '') || 'Unknown';
                            acc[region] = (acc[region] || 0) + Number(item.value);
                            return acc;
                        }, {});
                        
                        const regions = Object.entries(dropoutByRegion).map(([name, total]: [string, any]) => ({ name, total: Number(total) })).sort((a, b) => b.total - a.total);
                        
                        if (regions.length > 1) {
                            description += ` Additionally, ${formatNumber(dropoutTotal)} students dropped out, with ${regions[0].name} showing the highest dropout rate (${formatNumber(regions[0].total)}) followed by ${regions[1].name} (${formatNumber(regions[1].total)}).`;
                        } else {
                            description += ` Additionally, ${formatNumber(dropoutTotal)} students dropped out, requiring retention programs and barrier removal.`;
                        }
                    }

                    if (description) {
                        const progressionTotal = progression.reduce((sum, item) => sum + Number(item.value), 0);
                        const repetitionTotal = repetition.reduce((sum, item) => sum + Number(item.value), 0);
                        const progressionRate = (progressionTotal + repetitionTotal) > 0 ? (progressionTotal / (progressionTotal + repetitionTotal)) * 100 : 0;
                        
                        return {
                            id: `progression-analysis-${Date.now()}`,
                            type: "trend",
                            title: `${levelType} Learning Outcomes`,
                            description,
                            value: `${formatPercent(progressionRate)} progress`,
                            confidence: "high",
                            recommendation: progressionRate < 80 ? "Implement academic support programs to reduce repetition rates and improve learning outcomes." : progressionRate > 90 ? "Maintain current excellent standards while identifying best practices to replicate." : "Continue monitoring progression rates while strengthening support for at-risk students."
                        };
                    }
                }
                return null;
            };

            // Enhanced quantitative analysis specifically designed for bar graphs
            const analyzeQuantitativeData = (items: any[], vizId: string, formatNumber: (n: number) => string, formatPercent: (n: number) => string): InsightItem | null => {
                if (items.length === 0) return null;

                const values = items.map(item => item.value);
                const total = values.reduce((sum, val) => sum + val, 0);
                const avg = total / values.length;
                const max = Math.max(...values);
                const min = Math.min(...values);
                
                // Sort items by value to find top and bottom performers
                const sortedItems = [...items].sort((a, b) => b.value - a.value);
                const topPerformer = sortedItems[0];
                const bottomPerformer = sortedItems[sortedItems.length - 1];
                
                // Calculate coefficient of variation for variability assessment
                const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
                const stdDev = Math.sqrt(variance);
                const cv = avg > 0 ? stdDev / avg : 0;

                let description = '';
                let title = 'Bar Graph Analysis';
                let recommendation = '';

                // Try to create contextual insights based on data elements or org units
                const hasOrgUnits = items.some(item => item.orgUnit && item.orgUnit.trim() !== '');
                const hasDataElements = items.some(item => item.dataElement && item.dataElement.trim() !== '');
                const hasCategories = items.some(item => item.category && item.category.trim() !== '');

                if (hasOrgUnits && items.length >= 3) {
                    // Regional/organizational comparison
                    title = 'Regional Performance Comparison';
                    const topRegion = topPerformer.orgUnit || 'Unknown';
                    const bottomRegion = bottomPerformer.orgUnit || 'Unknown';
                    const gap = topPerformer.value > 0 ? ((topPerformer.value - bottomPerformer.value) / topPerformer.value) * 100 : 0;
                    
                    description = `${topRegion} leads with ${formatNumber(topPerformer.value)}, while ${bottomRegion} shows ${formatNumber(bottomPerformer.value)}—a ${formatPercent(gap)} performance gap. `;
                    
                    if (cv > 0.3) {
                        description += `With significant variation across ${items.length} regions (ranging from ${formatNumber(min)} to ${formatNumber(max)}), resource allocation and targeted support programs are needed for underperforming areas.`;
                        recommendation = `Focus additional resources on ${bottomRegion} and other underperforming regions to reduce the ${formatPercent(gap)} gap with ${topRegion}.`;
                    } else {
                        description += `Performance is relatively balanced across regions, with most values clustering around the ${formatNumber(avg)} average.`;
                        recommendation = 'Maintain current balanced approach while monitoring for emerging disparities.';
                    }
                    
                } else if (hasDataElements && items.length >= 2) {
                    // Category/indicator comparison
                    title = 'Performance Indicators';
                    const topIndicator = (topPerformer.dataElement || 'Top category').replace(/^.{0,50}/, '...').substring(0, 50);
                    const bottomIndicator = (bottomPerformer.dataElement || 'Bottom category').replace(/^.{0,50}/, '...').substring(0, 50);
                    
                    description = `Among ${items.length} indicators, ${topIndicator} performs best at ${formatNumber(topPerformer.value)}, while ${bottomIndicator} shows ${formatNumber(bottomPerformer.value)}. `;
                    
                    const strongPerformers = sortedItems.filter(item => item.value > avg * 1.2).length;
                    const weakPerformers = sortedItems.filter(item => item.value < avg * 0.8).length;
                    
                    if (strongPerformers > 0 && weakPerformers > 0) {
                        description += `${strongPerformers} indicators exceed expectations while ${weakPerformers} need improvement. Total combined value: ${formatNumber(total)}.`;
                        recommendation = `Investigate success factors from top performers and develop improvement plans for underperforming indicators.`;
                    } else {
                        description += `Most indicators cluster around the ${formatNumber(avg)} average, showing consistent performance patterns.`;
                        recommendation = 'Monitor current trends while identifying opportunities for system-wide improvements.';
                    }
                    
                } else if (hasCategories) {
                    // Category comparison
                    title = 'Category Analysis';
                    const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
                    
                    if (categories.length >= 2) {
                        description = `Data across ${categories.length} categories shows values from ${formatNumber(min)} to ${formatNumber(max)}, totaling ${formatNumber(total)}. `;
                        
                        if (cv > 0.4) {
                            description += `High variation between categories suggests different performance levels or resource needs that require targeted attention.`;
                            recommendation = 'Develop category-specific strategies to address performance disparities.';
                        } else {
                            description += `Categories perform relatively consistently, indicating balanced outcomes across different groups.`;
                            recommendation = 'Continue current approach while fine-tuning based on specific category needs.';
                        }
                    }
                    
                } else {
                    // Generic bar graph analysis
                    title = 'Data Distribution';
                    description = `Bar graph displays ${items.length} data points ranging from ${formatNumber(min)} to ${formatNumber(max)}, with an average of ${formatNumber(avg)}. Total value: ${formatNumber(total)}. `;
                    
                    if (cv > 0.5) {
                        description += `High variability suggests significant differences between categories that may indicate opportunities for targeted interventions or resource reallocation.`;
                        recommendation = 'Investigate causes of high variation and develop targeted strategies for outlying values.';
                    } else if (cv < 0.2) {
                        description += `Consistent values across categories indicate stable performance and balanced distribution.`;
                        recommendation = 'Monitor for changes while maintaining current performance levels.';
                    } else {
                        description += `Moderate variation is within normal ranges, suggesting room for improvement in lower-performing areas.`;
                        recommendation = 'Focus improvement efforts on below-average performers while maintaining strong areas.';
                    }
                }

                // Add specific insights about the distribution
                if (items.length >= 3) {
                    const aboveAverage = values.filter(v => v > avg).length;
                    const belowAverage = values.filter(v => v < avg).length;
                    
                    if (aboveAverage > belowAverage * 2) {
                        description += ` Most values exceed the average, indicating generally strong performance with few outliers.`;
                    } else if (belowAverage > aboveAverage * 2) {
                        description += ` Most values fall below average, suggesting systemic challenges that need addressing.`;
                    }
                }

                return {
                    id: `bar-analysis-${vizId}-${Date.now()}`,
                    type: cv > 0.4 ? "comparison" : "summary",
                    title,
                    description,
                    value: formatNumber(total),
                    confidence: "high",
                    recommendation: recommendation || 'Continue monitoring performance and adjust strategies as needed.'
                };
            };

            // Collect all data for cross-visualization analysis
            const allData: any[] = [];
            
            Object.entries(visualizationData).forEach(([vizId, vizData]) => {
                if (Array.isArray(vizData)) {
                    vizData.forEach((item) => {
                        if (item && typeof item === 'object') {
                            // Try multiple ways to extract value with better NaN handling
                            let value = 0;
                            const rawValue = item.value || item.Value || item.val;
                            if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                                const parsed = parseFloat(String(rawValue));
                                if (!isNaN(parsed) && isFinite(parsed)) {
                                    value = parsed;
                                }
                            }
                            
                            // Only include items with valid numeric values
                            if (!isNaN(value) && isFinite(value)) {
                                allData.push({
                                    vizId,
                                    value,
                                    dataElement: item['dx-name'] || item['dx_name'] || item.indicator || item.name || '',
                                    period: item['pe-name'] || item['pe_name'] || item.period || '',
                                    orgUnit: item['ou-name'] || item['ou_name'] || item.orgunit || '',
                                    category: item['co-name'] || item['co_name'] || item.category || '',
                                    ...item
                                });
                            }
                        }
                    });
                }
            });

            if (allData.length === 0) {
                // Debug info about why no data was found
                const debugInfo = Object.entries(visualizationData).map(([vizId, vizData]) => ({
                    vizId,
                    isArray: Array.isArray(vizData),
                    length: Array.isArray(vizData) ? vizData.length : 'N/A',
                    type: typeof vizData,
                    sample: Array.isArray(vizData) && vizData.length > 0 ? vizData[0] : vizData
                }));
                
                return [{
                    id: `no-data-${Date.now()}`,
                    type: "summary" as const,
                    title: "No Data Available",
                    description: `No visualization data found to analyze. Debug info: Found ${Object.keys(visualizationData).length} visualizations in store. ${JSON.stringify(debugInfo, null, 2)}`,
                    confidence: "high" as const,
                    recommendation: "Check console logs for detailed data structure analysis."
                }];
            }


            // INDIVIDUAL VISUALIZATION ANALYSIS
            // Analyze each visualization separately for specific insights
            Object.entries(visualizationData).forEach(([vizId, vizData]) => {
                if (Array.isArray(vizData) && vizData.length > 0) {
                    // Find the visualization metadata to get title and context
                    const vizMetadata = dashboard.sections?.flatMap(section => section.visualizations || [])
                        .find(viz => viz.id === vizId);
                    
                    const vizTitle = vizMetadata?.name || '';
                    const vizType = vizMetadata?.type || '';
                    
                    const vizItems = vizData.filter(item => item && typeof item === 'object').map(item => {
                        // Try multiple ways to extract values
                        let value = 0;
                        
                        // Check for different value fields
                        const rawValue = item.value || item.Value || item.val || item.y || item.data || item.count;
                        
                        if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                            const parsed = parseFloat(String(rawValue));
                            if (!isNaN(parsed) && isFinite(parsed)) {
                                value = parsed;
                            }
                        }
                        
                        // Extract identifiers with more fallbacks
                        const dataElement = item['dx-name'] || item['dx_name'] || item.indicator || item.name || item.label || item.category || '';
                        const period = item['pe-name'] || item['pe_name'] || item.period || item.time || '';
                        const orgUnit = item['ou-name'] || item['ou_name'] || item.orgunit || item.region || item.location || '';
                        const category = item['co-name'] || item['co_name'] || item.category || item.group || '';
                        
                        return {
                            value,
                            dataElement,
                            period,
                            orgUnit,
                            category,
                            ...item
                        };
                    }).filter(item => !isNaN(item.value) && isFinite(item.value));

                    if (vizItems.length > 0) {
                        const insight = analyzeVisualizationWithContext(vizItems, vizId, vizTitle, vizType, formatNumber, formatPercent);
                        if (insight) {
                            allInsights.push(insight);
                        }
                    }
                }
            });
            
            // If no individual insights were generated, create fallback insights for each visualization
            if (allInsights.length === 0 && allData.length > 0) {
                Object.entries(visualizationData).forEach(([vizId, vizData]) => {
                    if (Array.isArray(vizData) && vizData.length > 0) {
                        const vizItems = vizData.filter(item => item && typeof item === 'object').map(item => {
                            let value = 0;
                            const rawValue = item.value || item.Value || item.val;
                            if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                                const parsed = parseFloat(String(rawValue));
                                if (!isNaN(parsed) && isFinite(parsed)) {
                                    value = parsed;
                                }
                            }
                            
                            return {
                                value,
                                dataElement: item['dx-name'] || item['dx_name'] || item.indicator || item.name || '',
                                period: item['pe-name'] || item['pe_name'] || item.period || '',
                                orgUnit: item['ou-name'] || item['ou_name'] || item.orgunit || '',
                                category: item['co-name'] || item['co_name'] || item.category || '',
                                ...item
                            };
                        }).filter(item => !isNaN(item.value) && isFinite(item.value));

                        if (vizItems.length > 0) {
                            const fallbackInsight = analyzeQuantitativeData(vizItems, vizId, formatNumber, formatPercent);
                            if (fallbackInsight) {
                                allInsights.push(fallbackInsight);
                            }
                        }
                    }
                });
            }

            // 1. SCHOOL LANDSCAPE ANALYSIS
            if (includeDataValues && (insightFocus === "all" || insightFocus === "values")) {
                // Look for school-related data first
                const schoolData = allData.filter(item => {
                    if (!item.dataElement) return false;
                    const element = item.dataElement.toLowerCase();
                    return element.includes('school') || element.includes('institution') || element.includes('facility');
                });

                const studentData = allData.filter(item => {
                    if (!item.dataElement) return false;
                    const element = item.dataElement.toLowerCase();
                    return element.includes('student') || element.includes('learner') || element.includes('pupil') || element.includes('enrollment') || element.includes('enrolment');
                });

                // School landscape insight
                if (schoolData.length >= 2) {
                    const publicSchools = schoolData.find(item => item.dataElement.toLowerCase().includes('public') || item.category?.toLowerCase().includes('public'));
                    const privateSchools = schoolData.find(item => item.dataElement.toLowerCase().includes('private') || item.category?.toLowerCase().includes('private'));

                    if (publicSchools && privateSchools) {
                        const totalSchools = publicSchools.value + privateSchools.value;
                        const publicPercent = (publicSchools.value / totalSchools) * 100;
                        const privatePercent = (privateSchools.value / totalSchools) * 100;

                        let description = `You've got ${formatNumber(totalSchools)} schools total, about ${formatPercent(publicPercent)} public (${formatNumber(publicSchools.value)}) and ${formatPercent(privatePercent)} private (${formatNumber(privateSchools.value)}).`;

                        // Add student-per-school ratio if student data available
                        const totalStudents = studentData.reduce((sum, item) => sum + item.value, 0);
                        if (totalStudents > 0) {
                            const studentsPerSchool = totalStudents / totalSchools;
                            description += `\n\nWith ${formatNumber(totalStudents)} learners, that works out to roughly ${Math.round(studentsPerSchool)} students per school on average—good to benchmark against your region's ideal.`;
                        }

                        allInsights.push({
                            id: `school-landscape-${Date.now()}`,
                            type: "summary",
                            title: "School Landscape",
                            description,
                            value: `${formatNumber(totalSchools)} schools`,
                            confidence: "high"
                        });
                    }
                }

                // Teacher capacity analysis
                const teacherData = allData.filter(item => {
                    if (!item.dataElement) return false;
                    const element = item.dataElement.toLowerCase();
                    return element.includes('teacher') || element.includes('educator') || element.includes('instructor');
                });

                if (teacherData.length > 0 && studentData.length > 0) {
                    const totalTeachers = teacherData.reduce((sum, item) => sum + item.value, 0);
                    const totalStudents = studentData.reduce((sum, item) => sum + item.value, 0);

                    if (totalTeachers > 0 && totalStudents > 0) {
                        const ratio = totalStudents / totalTeachers;
                        const targetRatio = 40;
                        const ratioStatus = ratio > targetRatio ? `well above the typical ${targetRatio} : 1 target` : `within the typical ${targetRatio} : 1 target`;

                        let description = `${formatNumber(totalTeachers)} teachers serving ${formatNumber(totalStudents)} students is about a ${Math.round(ratio)} : 1 learner‑to‑teacher ratio, ${ratioStatus}.`;

                        // Gender analysis for teachers
                        const femaleTeachers = teacherData.find(item =>
                            item.dataElement.toLowerCase().includes('female') ||
                            item.category?.toLowerCase().includes('female') ||
                            item.category?.toLowerCase().includes('women')
                        );
                        const maleTeachers = teacherData.find(item =>
                            item.dataElement.toLowerCase().includes('male') ||
                            item.category?.toLowerCase().includes('male') ||
                            item.category?.toLowerCase().includes('men')
                        );

                        if (femaleTeachers && maleTeachers) {
                            const femalePercent = (femaleTeachers.value / (femaleTeachers.value + maleTeachers.value)) * 100;
                            description += `\n\nOnly ${formatPercent(femalePercent)} of your teachers are women (${formatNumber(femaleTeachers.value)} vs ${formatNumber(maleTeachers.value)} men). If you're pushing gender equity in the workforce, that's another flag.`;
                        }

                        allInsights.push({
                            id: `teacher-capacity-${Date.now()}`,
                            type: "summary",
                            title: "Teacher Capacity",
                            description,
                            value: `${Math.round(ratio)}:1 ratio`,
                            confidence: "high",
                            recommendation: ratio > targetRatio ? "Consider increasing teacher recruitment to meet the 40:1 target ratio." : undefined
                        });
                    }
                }

                // Gender shift analysis by grade level
                const gradeData = allData.filter(item => {
                    if (!item.dataElement) return false;
                    const element = item.dataElement.toLowerCase();
                    return element.includes('js1') || element.includes('js2') || element.includes('js3') ||
                        element.includes('junior') || element.includes('secondary') ||
                        element.includes('grade') || element.includes('class');
                });

                if (gradeData.length >= 4) {
                    // Group by grade and gender
                    const gradesByGender = gradeData.reduce((acc: any, item) => {
                        let grade = 'unknown';
                        const element = item.dataElement.toLowerCase();

                        if (element.includes('js1')) grade = 'JS1';
                        else if (element.includes('js2')) grade = 'JS2';
                        else if (element.includes('js3')) grade = 'JS3';

                        let gender = 'unknown';
                        if (element.includes('girl') || element.includes('female')) gender = 'girls';
                        else if (element.includes('boy') || element.includes('male')) gender = 'boys';

                        if (grade !== 'unknown' && gender !== 'unknown') {
                            if (!acc[grade]) acc[grade] = {};
                            acc[grade][gender] = item.value;
                        }

                        return acc;
                    }, {});

                    const grades = Object.keys(gradesByGender).sort();
                    if (grades.length >= 2) {
                        let description = '';
                        const js1Data = gradesByGender['JS1'];
                        const js2Data = gradesByGender['JS2'];

                        if (js1Data && js2Data && js1Data.girls && js1Data.boys && js2Data.girls && js2Data.boys) {
                            const js1Girls = js1Data.girls;
                            const js2Girls = js2Data.girls;
                            const js2Boys = js2Data.boys;

                            const girlsDropoff = js1Girls > 0 ? ((js1Girls - js2Girls) / js1Girls) * 100 : 0;

                            description = `In Junior Secondary 1, girls ${js1Data.girls > js1Data.boys ? 'slightly outnumber boys' : 'are roughly equal to boys'}, but by JS2 and JS3 boys pull ahead—for example, JS2 has ~${formatNumber(js2Boys)} boys vs ~${formatNumber(js2Girls)} girls.`;

                            if (girlsDropoff > 10) {
                                description += `\n\nThat drop in girls from JS1→JS2 (~${formatPercent(girlsDropoff)} fall) suggests you may need targeted retention support for girls around the Grade 8 transition.`;
                            }
                        }

                        if (description) {
                            allInsights.push({
                                id: `gender-shift-${Date.now()}`,
                                type: "trend",
                                title: "Gender Shift in Secondary",
                                description,
                                confidence: "medium",
                                recommendation: "Implement targeted retention programs for girls transitioning from JS1 to JS2."
                            });
                        }
                    }
                }

                // Pre-primary analysis
                const preprimaryData = allData.filter(item => {
                    if (!item.dataElement) return false;
                    const element = item.dataElement.toLowerCase();
                    return element.includes('n1') || element.includes('n2') || element.includes('n3') ||
                        element.includes('nursery') || element.includes('pre-primary');
                });

                if (preprimaryData.length >= 3) {
                    const n1Data = preprimaryData.filter(item => item.dataElement.toLowerCase().includes('n1'));
                    const n2Data = preprimaryData.filter(item => item.dataElement.toLowerCase().includes('n2'));
                    const n3Data = preprimaryData.filter(item => item.dataElement.toLowerCase().includes('n3'));

                    if (n1Data.length > 0 && n2Data.length > 0 && n3Data.length > 0) {
                        const n1Total = n1Data.reduce((sum, item) => sum + item.value, 0);
                        const n2Total = n2Data.reduce((sum, item) => sum + item.value, 0);
                        const n3Total = n3Data.reduce((sum, item) => sum + item.value, 0);

                        let description = `N1 and N2 look fairly balanced (roughly ${formatNumber(n1Total)} in N1, ~${formatNumber(n2Total)} in N2)`;

                        // Check for anomalies in N3
                        const expectedN3 = (n1Total + n2Total) / 2;
                        const n3Variance = Math.abs(n3Total - expectedN3) / expectedN3;

                        if (n3Variance > 0.5) {
                            description += `, but N3 shows ${formatNumber(n3Total)} which is ${n3Total < expectedN3 ? 'way lower' : 'much higher'} than expected.\n\nEither there's been a ${n3Total < expectedN3 ? 'huge dropout' : 'data inflation'} or it's a data‑capture glitch—worth a quick audit.`;
                        }

                        allInsights.push({
                            id: `preprimary-analysis-${Date.now()}`,
                            type: "outlier",
                            title: "Pre‑primary Oddities",
                            description,
                            confidence: "medium",
                            recommendation: "Audit N3 enrollment data to verify accuracy and investigate any anomalies."
                        });
                    }
                }

                // Rural vs Urban analysis
                const ruralUrbanData = allData.filter(item => {
                    if (!item.dataElement) return false;
                    const element = item.dataElement.toLowerCase();
                    return element.includes('rural') || element.includes('urban');
                });

                if (ruralUrbanData.length >= 2) {
                    const ruralData = ruralUrbanData.find(item => item.dataElement.toLowerCase().includes('rural'));
                    const urbanData = ruralUrbanData.find(item => item.dataElement.toLowerCase().includes('urban'));

                    if (ruralData && urbanData) {
                        // Check for data quality issues
                        if ((ruralData.value < 100 && urbanData.value < 100) || Math.abs(ruralData.value - urbanData.value) > ruralData.value * 10) {
                            const description = `"Rural Enrolment" shows ${formatNumber(ruralData.value)}, "Urban Enrolment" is ${formatNumber(urbanData.value)}. ${urbanData.value === 1 ? 'Definitely a broken feed or mapping error there.' : 'This distribution looks suspicious.'} You'll want complete coverage before drawing conclusions on access.`;

                            allInsights.push({
                                id: `rural-urban-flag-${Date.now()}`,
                                type: "outlier",
                                title: "Rural vs. Urban Flag",
                                description,
                                confidence: "high",
                                recommendation: "Fix data collection for rural/urban enrollment to ensure complete geographic coverage."
                            });
                        }
                    }
                }
            }

            // 2. GAP ANALYSIS & BENCHMARKS
            if (includeTrends && (insightFocus === "all" || insightFocus === "trends")) {
                // Look for indicators that suggest gaps (ratios, targets, etc.)
                const ratioKeywords = ['ratio', 'per', 'teacher', 'student', 'pupil', 'staff'];

                allData.forEach(item => {
                    if (!item.dataElement || item.dataElement.trim() === '') return;
                    const elementLower = item.dataElement.toLowerCase();

                    // Student-teacher ratio analysis
                    if (ratioKeywords.some(keyword => elementLower.includes(keyword))) {
                        const value = item.value;
                        let gapAnalysis = '';
                        let recommendation = '';

                        if (elementLower.includes('teacher') && elementLower.includes('ratio')) {
                            const targetRatio = 40; // Assuming 40:1 as goal
                            if (value > targetRatio) {
                                const excess = value - targetRatio;
                                gapAnalysis = `${Math.round(value)} : 1 student‑to‑teacher ratio (above the ${targetRatio} : 1 goal)`;
                                recommendation = `Need to recruit ${Math.round(excess * 100 / targetRatio)}% more teachers to meet standards.`;
                            } else {
                                gapAnalysis = `${Math.round(value)} : 1 student‑to‑teacher ratio (meets the ${targetRatio} : 1 goal)`;
                                recommendation = 'Maintain current teacher recruitment levels.';
                            }

                            allInsights.push({
                                id: `gap-${item.dataElement}-${Date.now()}`,
                                type: "outlier",
                                title: "Teacher Gap Analysis",
                                description: gapAnalysis,
                                value: `${Math.round(value)}:1`,
                                confidence: "high",
                                recommendation
                            });
                        }
                    }
                });
            }

            // 3. DROPOUT & RETENTION ANALYSIS
            if (includeGeoComparisons && (insightFocus === "all" || insightFocus === "comparisons")) {
                // Look for enrollment patterns by grade/level
                const enrollmentData = allData.filter(item => {
                    if (!item.dataElement || item.dataElement.trim() === '') return false;
                    const elementLower = item.dataElement.toLowerCase();
                    return elementLower.includes('enrollment') || elementLower.includes('enrolment');
                });

                if (enrollmentData.length > 1) {
                    // Group by period/grade to find dropoff patterns
                    const byGrade = enrollmentData.reduce((acc: any, item) => {
                        const grade = item.period || item.category || 'Unknown';
                        if (!acc[grade]) acc[grade] = [];
                        acc[grade].push(item);
                        return acc;
                    }, {});

                    const grades = Object.keys(byGrade).sort();
                    if (grades.length >= 2) {
                        for (let i = 1; i < grades.length; i++) {
                            const prevGrade = byGrade[grades[i - 1]];
                            const currGrade = byGrade[grades[i]];

                            if (prevGrade.length > 0 && currGrade.length > 0) {
                                const prevTotal = prevGrade.reduce((sum: number, item: any) => sum + item.value, 0);
                                const currTotal = currGrade.reduce((sum: number, item: any) => sum + item.value, 0);

                                if (prevTotal > currTotal && prevTotal > 0) {
                                    const dropoffPercent = ((prevTotal - currTotal) / prevTotal) * 100;

                                    allInsights.push({
                                        id: `dropout-${grades[i]}-${Date.now()}`,
                                        type: "outlier",
                                        title: "Enrollment Drop-Off",
                                        description: `After ${grades[i - 1]}, enrollment falls by ~${Math.round(dropoffPercent)}% in ${grades[i]}—retention support is needed.`,
                                        value: `${formatPercent(dropoffPercent)}`,
                                        confidence: "medium",
                                        recommendation: `Launch targeted retention programs for ${grades[i]} students, especially focusing on transition support.`
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // 4. DATA QUALITY ALERTS
            allData.forEach(item => {
                if (!item.dataElement || item.dataElement.trim() === '') return;

                // Flag suspiciously low values
                if (item.value === 1) {
                    allInsights.push({
                        id: `data-quality-${item.dataElement}-${Date.now()}`,
                        type: "outlier",
                        title: "Data Quality Alert",
                        description: `${item.dataElement} in ${item.orgUnit || 'a location'} shows "${item.value}"—this may indicate a data feed issue.`,
                        value: item.value.toString(),
                        confidence: "medium",
                        recommendation: "Review data collection process and verify source data accuracy."
                    });
                }

                // Flag extremely high or low percentages
                if (item.dataElement.toLowerCase().includes('percent') || item.dataElement.toLowerCase().includes('%')) {
                    if (item.value > 100) {
                        allInsights.push({
                            id: `data-anomaly-${item.dataElement}-${Date.now()}`,
                            type: "outlier",
                            title: "Data Anomaly",
                            description: `${item.dataElement} shows ${item.value}% which exceeds 100%—needs verification.`,
                            value: `${item.value}%`,
                            confidence: "low",
                            recommendation: "Investigate calculation methodology and source data."
                        });
                    }
                }
            });

            // 5. TEMPORAL TRENDS ANALYSIS
            if (includeTrends && (insightFocus === "all" || insightFocus === "trends")) {
                // Group by data element and org unit to find temporal patterns
                const temporalData = allData.reduce((acc: any, item) => {
                    if (item.dataElement && item.period && item.dataElement.trim() !== '') {
                        const key = `${item.dataElement}-${item.orgUnit || 'overall'}`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(item);
                    }
                    return acc;
                }, {});

                Object.entries(temporalData).forEach(([key, items]) => {
                    const itemArray = items as any[];
                    if (itemArray.length >= 2) {
                        const sortedByPeriod = itemArray.sort((a, b) => {
                            // Simple period sorting - works for years, months
                            return (a.period || '').localeCompare(b.period || '');
                        });

                        const latest = sortedByPeriod[sortedByPeriod.length - 1];
                        const previous = sortedByPeriod[sortedByPeriod.length - 2];

                        if (latest.value !== previous.value && previous.value > 0) {
                            const change = ((latest.value - previous.value) / previous.value) * 100;
                            const trend = change > 0 ? 'increased' : 'decreased';
                            const [dataElement] = key.split('-');

                            allInsights.push({
                                id: `trend-${key}-${Date.now()}`,
                                type: "trend",
                                title: `${dataElement} Trend`,
                                description: `${dataElement} ${trend} by ${formatPercent(Math.abs(change))} from ${previous.period} to ${latest.period} (${formatNumber(previous.value)} → ${formatNumber(latest.value)}).`,
                                value: `${change > 0 ? '+' : ''}${formatPercent(change)}`,
                                confidence: "high",
                                recommendation: change < -20 ? "Investigate causes of decline and implement corrective measures." : change > 20 ? "Analyze success factors to replicate improvements elsewhere." : undefined
                            });
                        }
                    }
                });
            }

            // 6. CORRELATION ANALYSIS
            if (includeGeoComparisons && (insightFocus === "all" || insightFocus === "comparisons")) {
                // Find correlations between different data elements in the same org units
                const byOrgUnit = allData.reduce((acc: any, item) => {
                    if (item.orgUnit && item.dataElement && item.orgUnit.trim() !== '') {
                        if (!acc[item.orgUnit]) acc[item.orgUnit] = {};
                        acc[item.orgUnit][item.dataElement] = item.value;
                    }
                    return acc;
                }, {});

                const orgUnits = Object.keys(byOrgUnit);
                if (orgUnits.length >= 3) {
                    // Find data elements that appear in multiple org units for correlation
                    const commonElements = Object.keys(byOrgUnit[orgUnits[0]] || {}).filter(element =>
                        orgUnits.every(orgUnit => byOrgUnit[orgUnit][element] !== undefined)
                    );

                    if (commonElements.length >= 2) {
                        const [elem1, elem2] = commonElements.slice(0, 2);
                        const correlationData = orgUnits.map(orgUnit => ({
                            x: byOrgUnit[orgUnit][elem1],
                            y: byOrgUnit[orgUnit][elem2],
                            orgUnit
                        })).filter(point => point.x > 0 && point.y > 0);

                        if (correlationData.length >= 3) {
                            // Simple correlation analysis
                            const avgX = correlationData.reduce((sum, point) => sum + point.x, 0) / correlationData.length;
                            const avgY = correlationData.reduce((sum, point) => sum + point.y, 0) / correlationData.length;

                            const correlation = correlationData.reduce((sum, point) => sum + (point.x - avgX) * (point.y - avgY), 0) /
                                Math.sqrt(correlationData.reduce((sum, point) => sum + Math.pow(point.x - avgX, 2), 0) *
                                    correlationData.reduce((sum, point) => sum + Math.pow(point.y - avgY, 2), 0));

                            if (Math.abs(correlation) > 0.5) {
                                const relationshipType = correlation > 0 ? 'positive' : 'negative';
                                const strength = Math.abs(correlation) > 0.8 ? 'strong' : 'moderate';

                                allInsights.push({
                                    id: `correlation-${elem1}-${elem2}-${Date.now()}`,
                                    type: "comparison",
                                    title: "Cross-Indicator Relationship",
                                    description: `${elem1} shows a ${strength} ${relationshipType} relationship with ${elem2} across ${correlationData.length} locations (r=${correlation.toFixed(2)}).`,
                                    value: correlation.toFixed(2),
                                    confidence: Math.abs(correlation) > 0.7 ? "high" : "medium",
                                    recommendation: correlation > 0 ? `Investing in ${elem1} may positively impact ${elem2}.` : `Monitor ${elem1} changes as they may inversely affect ${elem2}.`
                                });
                            }
                        }
                    }
                }
            }

            // 7. WASH INFRASTRUCTURE ANALYSIS
            const washItems = allData.filter(item => {
                if (!item.dataElement || item.dataElement.trim() === '') return false;
                const elementLower = item.dataElement.toLowerCase();
                return (elementLower.includes('water') || elementLower.includes('toilet') ||
                    elementLower.includes('wash') || elementLower.includes('sanitation') ||
                    elementLower.includes('handwashing') || elementLower.includes('hand washing')) &&
                    (elementLower.includes('usable') || elementLower.includes('functional') ||
                        elementLower.includes('access') || elementLower.includes('available'));
            });

            if (washItems.length >= 2) {
                const washData = washItems.reduce((acc: any, item) => {
                    const elementLower = item.dataElement.toLowerCase();

                    if (elementLower.includes('handwashing') || elementLower.includes('hand washing') || elementLower.includes('hand-washing')) {
                        acc.handwashing = item.value;
                    } else if (elementLower.includes('water') && !elementLower.includes('handwashing')) {
                        acc.water = item.value;
                    } else if (elementLower.includes('toilet') || elementLower.includes('latrine')) {
                        acc.toilets = item.value;
                    }
                    return acc;
                }, {});

                if (Object.keys(washData).length >= 2) {
                    let description = '';

                    if (washData.handwashing !== undefined) {
                        description += `Almost ${formatPercent(washData.handwashing)} of schools have usable hand‑washing, which is great.`;
                    }

                    if (washData.water !== undefined && washData.toilets !== undefined) {
                        description += `\n\nBut only ${formatPercent(washData.water)} have a usable water source and a shocking ${formatPercent(washData.toilets)} have usable toilets.`;

                        if (washData.handwashing && (washData.handwashing > washData.water + 20 || washData.handwashing > washData.toilets + 20)) {
                            description += `\n\nThat mismatch raises serious health and hygiene concerns—toilet and water‑point investments should be top of the list.`;
                        }
                    } else if (washData.water !== undefined || washData.toilets !== undefined) {
                        const facility = washData.water !== undefined ? 'water' : 'toilets';
                        const percent = washData.water !== undefined ? washData.water : washData.toilets;
                        description += `\n\nBut only ${formatPercent(percent)} have usable ${facility}.`;
                    }

                    if (description) {
                        allInsights.push({
                            id: `wash-infrastructure-${Date.now()}`,
                            type: "summary",
                            title: "WASH Infrastructure Gap",
                            description,
                            confidence: "high",
                            recommendation: "Prioritize toilet and water infrastructure investments to match handwashing facility availability and ensure student health and safety."
                        });
                    }
                }
            }

            // 8. STATISTICAL OUTLIERS AND ANOMALIES
            Object.entries(allData.reduce((acc: any, item) => {
                if (item.dataElement && item.dataElement.trim() !== '') {
                    if (!acc[item.dataElement]) acc[item.dataElement] = [];
                    acc[item.dataElement].push(item.value);
                }
                return acc;
            }, {})).forEach(([dataElement, values]) => {
                const valueArray = values as number[];
                if (valueArray.length >= 5) {
                    const sorted = [...valueArray].sort((a, b) => a - b);
                    const q1 = sorted[Math.floor(sorted.length * 0.25)];
                    const q3 = sorted[Math.floor(sorted.length * 0.75)];
                    const iqr = q3 - q1;
                    const lowerBound = q1 - 1.5 * iqr;
                    const upperBound = q3 + 1.5 * iqr;

                    const outliers = valueArray.filter(v => v < lowerBound || v > upperBound);
                    if (outliers.length > 0 && outliers.length <= valueArray.length * 0.2) {
                        const outliersStr = outliers.slice(0, 3).map(v => formatNumber(v)).join(', ');

                        allInsights.push({
                            id: `outlier-${dataElement}-${Date.now()}`,
                            type: "outlier",
                            title: `${dataElement} Outliers Detected`,
                            description: `${dataElement} has ${outliers.length} statistical outliers (${outliersStr}${outliers.length > 3 ? '...' : ''}) that may need attention.`,
                            value: `${outliers.length}`,
                            confidence: "medium",
                            recommendation: "Review outlier cases to identify data quality issues or exceptional circumstances."
                        });
                    }
                }
            });

            // 9. GENERATE SUMMARY WITH NEXT STEPS
            if (allInsights.length > 0) {
                const priorities = [];
                const hasDataQuality = allInsights.some(i => i.type === "outlier" && i.title.includes("Data"));
                const hasDropout = allInsights.some(i => i.description.includes("falls by"));
                const hasTeacherGap = allInsights.some(i => i.title.includes("Teacher"));
                const hasInfrastructure = allInsights.some(i => i.title.includes("WASH"));

                if (hasDataQuality) priorities.push("correct data feeds");
                if (hasDropout) priorities.push("launch retention programs");
                if (hasTeacherGap) priorities.push("boost teacher recruitment");
                if (hasInfrastructure) priorities.push("fast-track infrastructure upgrades");

                if (priorities.length > 0) {
                    allInsights.push({
                        id: `next-steps-${Date.now()}`,
                        type: "summary",
                        title: "Next Steps",
                        description: `Priority actions: ${priorities.join(', ')}.`,
                        confidence: "high",
                        recommendation: "Address these items systematically to improve overall performance."
                    });
                }
            }

            // Remove duplicates and limit results
            const uniqueInsights = allInsights.filter((insight, index, self) =>
                index === self.findIndex(i => i.description === insight.description)
            );
            
            return uniqueInsights.slice(0, maxInsights);
        };
    }, [dashboard, visualizationData, maxInsights, includeDataValues, includeTrends, includeGeoComparisons, numberFormat, insightFocus]);

    const handleGenerateInsights = async () => {
        setIsGenerating(true);
        try {
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000));
            const newInsights = await generateAIInsights();
            setInsights(newInsights);

            const insightSource = useAI && aiInsightsService.isAvailable() ? "AI-powered" : "local";
            toast({
                title: "Insights Generated",
                description: `Generated ${newInsights.length} ${insightSource} insights from your dashboard data.`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Error generating insights:", error);
            toast({
                title: "Error Generating Insights",
                description: "Failed to analyze dashboard data.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!insightsRef.current) return;

        try {
            const canvas = await html2canvas(insightsRef.current, {
                backgroundColor: backgroundColor,
                scale: 2,
                useCORS: true,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new JsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const blob = pdf.output("blob");
            saveAs(blob, `dashboard-insights-${Date.now()}.pdf`);

            toast({
                title: "PDF Downloaded",
                description: "Insights report has been downloaded successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "Download Failed",
                description: "Failed to generate PDF report.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case "high": return "green";
            case "medium": return "yellow";
            case "low": return "red";
            default: return "gray";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "trend": return "📈";
            case "comparison": return "⚖️";
            case "outlier": return "⚠️";
            case "summary": return "📊";
            case "recommendation": return "🎯";
            default: return "💡";
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case "high": return "red";
            case "medium": return "orange";
            case "low": return "blue";
            default: return "gray";
        }
    };

    // Auto-generate insights on mount if enabled
    React.useEffect(() => {
        if (autoGenerate && insights.length === 0 && Object.keys(visualizationData).length > 0) {
            handleGenerateInsights();
        }
    }, [autoGenerate, visualizationData]);

    // Dynamic insights: regenerate when visualization data changes significantly
    React.useEffect(() => {
        const dataKeys = Object.keys(visualizationData);
        const dataCount = dataKeys.reduce((sum, key) => {
            const data = visualizationData[key];
            return sum + (Array.isArray(data) ? data.length : 0);
        }, 0);

        // Only regenerate if we have insights and data has changed significantly
        if (insights.length > 0 && useAI && dataCount > 0 && !isGenerating) {
            setIsAutoRegenerating(true);
            // Debounce the regeneration to avoid too frequent updates
            const timeoutId = setTimeout(async () => {
                try {
                    const newInsights = await generateAIInsights();
                    setInsights(newInsights);
                    setIsAutoRegenerating(false);
                } catch (error) {
                    console.warn('Auto-regeneration failed:', error);
                    setIsAutoRegenerating(false);
                }
            }, 3000); // 3 second delay

            return () => {
                clearTimeout(timeoutId);
                setIsAutoRegenerating(false);
            };
        }
    }, [visualizationData, useAI, insights.length, isGenerating]);

    return (
        <Box
            w="100%"
            h="100%"
            bg={backgroundColor}
            color={textColor}
            fontSize={`${fontSize}px`}
            p={4}
            overflow="auto"
        >
            <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                    <HStack align="center">
                        <Heading size="lg" color={textColor}>
                            {title}
                        </Heading>
                        {isAutoRegenerating && (
                            <Badge colorScheme="blue" fontSize="xs" ml={2}>
                                Updating...
                            </Badge>
                        )}
                        {useAI && aiInsightsService.isAvailable() && (
                            <Badge colorScheme="purple" fontSize="xs" ml={2}>
                                AI-Powered
                            </Badge>
                        )}
                    </HStack>
                    <HStack>
                        <Tooltip label="Generate New Insights">
                            <IconButton
                                aria-label="Generate insights"
                                icon={<RepeatIcon />}
                                onClick={handleGenerateInsights}
                                isLoading={isGenerating}
                                size="sm"
                                colorScheme="blue"
                            />
                        </Tooltip>
                        <Tooltip label="Download as PDF">
                            <IconButton
                                aria-label="Download PDF"
                                icon={<DownloadIcon />}
                                onClick={handleDownloadPDF}
                                size="sm"
                                colorScheme="green"
                                isDisabled={insights.length === 0}
                            />
                        </Tooltip>
                    </HStack>
                </HStack>

                <Divider />

                <Box ref={insightsRef}>
                    {insights.length === 0 ? (
                        <VStack spacing={4} py={8}>
                            <Text fontSize="lg" color="gray.500">
                                No insights generated yet
                            </Text>
                            <Button
                                onClick={handleGenerateInsights}
                                isLoading={isGenerating}
                                colorScheme="blue"
                                loadingText="Analyzing..."
                            >
                                Generate Insights
                            </Button>
                        </VStack>
                    ) : (
                            <VStack spacing={4} align="stretch">
                                {insights.map((insight) => (
                                    <Box
                                        key={insight.id}
                                        p={4}
                                        border="1px"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        bg="white"
                                        boxShadow="sm"
                                    >
                                        <HStack justify="space-between" align="start" mb={2}>
                                            <HStack align="center">
                                                <Text fontSize="lg" mr={2}>
                                                    {getTypeIcon(insight.type)}
                                                </Text>
                                                <Text fontWeight="bold" fontSize="md">
                                                    {insight.title}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                {insight.priority && (
                                                    <Badge colorScheme={getPriorityColor(insight.priority)} size="sm">
                                                        {insight.priority.toUpperCase()}
                                                    </Badge>
                                                )}
                                                {insight.value && (
                                                    <Badge colorScheme="blue" variant="subtle">
                                                        {insight.value}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    colorScheme={getConfidenceColor(insight.confidence)}
                                                    variant="subtle"
                                                >
                                                    {insight.confidence} confidence
                                            </Badge>
                                            </HStack>
                                        </HStack>

                                        <Text fontSize="sm" mb={2} color="gray.700">
                                            {insight.description}
                                        </Text>

                                        {insight.recommendation && (
                                            <Box
                                                mt={2}
                                                p={2}
                                                bg="blue.50"
                                                borderRadius="sm"
                                                borderLeft="4px"
                                                borderLeftColor="blue.400"
                                            >
                                                <Text fontSize="xs" fontWeight="semibold" color="blue.700" mb={1}>
                                                    💡 Recommendation:
                                            </Text>
                                                <Text fontSize="xs" color="blue.600">
                                                    {insight.recommendation}
                                                </Text>
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </VStack>
                        )}
                </Box>

                {insights.length > 0 && (
                    <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                        <Text fontSize="xs" color="gray.600" textAlign="center">
                            Insights generated from {dashboard.sections.length} sections •
                            Last updated: {new Date().toLocaleString()}
                        </Text>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default InsightsVisualization;