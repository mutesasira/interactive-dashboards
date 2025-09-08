import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Heading,
    Badge,
    useToast,
    IconButton,
    Tooltip,
    Spinner,
    Progress,
    Flex,
    Alert,
    AlertIcon,
} from "@chakra-ui/react";
import { 
    DownloadIcon, 
    RepeatIcon, 
    ViewIcon,
} from "@chakra-ui/icons";
import { useStore } from "effector-react";
import html2canvas from "html2canvas";
import JsPDF from "jspdf";
import { ChartProps } from "../../interfaces";
import { $dashboard, $visualizationData } from "../../Store";
import RealLLMInsightsService from "../../services/realLLMInsightsService";

interface LLMInsight {
    id: string;
    type: "trend_analysis" | "pattern_detection" | "anomaly_detection" | "predictive_insight" | "actionable_recommendation" | "contextual_summary";
    title: string;
    content: string;
    confidence: number; // 0-1 scale
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

// LLMResponse interface removed as it's not used directly in this component

const llmService = new RealLLMInsightsService();

const Insights2Visualization = ({
    dataProperties,
    layoutProperties,
    section,
}: ChartProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [insights, setInsights] = useState<LLMInsight[]>([]);
    const [summary, setSummary] = useState<string>("");
    const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
    const [analysisDepth, setAnalysisDepth] = useState<"basic" | "intermediate" | "advanced">("advanced");
    const [tokensUsed, setTokensUsed] = useState<number>(0);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const toast = useToast();
    const insightsRef = useRef<HTMLDivElement>(null);
    const dashboard = useStore($dashboard);
    const visualizationData = useStore($visualizationData);

    // Extract properties
    const title = dataProperties?.["data.title"] || "AI Insights 2";
    const backgroundColor = layoutProperties?.["layout.backgroundColor"] || "#ffffff";
    const textColor = dataProperties?.["data.textColor"] || "#000000";
    const maxInsights = parseInt(dataProperties?.["data.maxInsights"] || "4");
    const autoRefreshInterval = parseInt(dataProperties?.["data.refreshInterval"] || "300"); // seconds
    const showConfidence = dataProperties?.["data.showConfidence"] !== "false";
    const showMetadata = dataProperties?.["data.showMetadata"] !== "false";
    const model = dataProperties?.["data.llmModel"] || "GPT-4-Dashboard-Analyzer";

    // Generate insights from other sections data (not the current section)
    const generateInsights = useCallback(async () => {
        setIsGenerating(true);
        try {
            // Collect data from all OTHER sections in the dashboard
            const otherSectionsData = dashboard?.sections
                ?.filter(s => s.id !== section?.id) // Exclude current section
                ?.map(s => {
                    // Get visualization data for this section from the store
                    const sectionVisualizationData = s.visualizations?.map(viz => {
                        const vizDataKey = `${s.id}_${viz.id}`;
                        return {
                            sectionId: s.id,
                            sectionTitle: s.title || 'Untitled Section',
                            sectionType: s.display || 'normal',
                            visualizationId: viz.id,
                            visualizationType: viz.type,
                            data: visualizationData?.[vizDataKey] || []
                        };
                    }) || [];
                    
                    return {
                        sectionId: s.id,
                        sectionTitle: s.title || 'Untitled Section',
                        sectionType: s.display || 'normal',
                        visualizations: sectionVisualizationData,
                        allData: sectionVisualizationData.flatMap(v => v.data || [])
                    };
                }) || [];

            const sectionContext = {
                sectionName: section?.title || "Cross-Section Analysis",
                sectionType: "insights2",
                visualizationType: "insights2",
                data: otherSectionsData.flatMap(s => s.allData), // Combined data from all other sections
                otherSections: otherSectionsData, // Detailed breakdown by section
                analysisType: "cross-section",
                metadata: {
                    currentSectionId: section?.id,
                    analyzedSections: otherSectionsData.length,
                    totalDataPoints: otherSectionsData.reduce((sum, s) => sum + s.allData.length, 0),
                    sectionBreakdown: otherSectionsData.map(s => ({
                        id: s.sectionId,
                        title: s.sectionTitle,
                        type: s.sectionType,
                        visualizationCount: s.visualizations.length,
                        dataPointCount: s.allData.length
                    })),
                    dataProperties,
                    layoutProperties
                },
                timestamp: new Date().toISOString()
            };

            const response = await llmService.generateInsights(sectionContext);
            
            // Limit insights based on maxInsights setting
            const limitedInsights = response.insights.slice(0, maxInsights);
            
            setInsights(limitedInsights);
            setSummary(response.summary);
            setAnalysisDepth(response.analysisDepth);
            setTokensUsed(response.tokensUsed);
            setLastGenerated(new Date());

            toast({
                title: "AI Insights Generated",
                description: `Generated ${limitedInsights.length} real AI-powered insights`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Error generating insights:", error);
            toast({
                title: "Generation Failed",
                description: "Failed to generate insights. Please try again later.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsGenerating(false);
        }
    }, [dashboard?.sections, section?.id, section?.title, visualizationData, maxInsights, toast, dataProperties, layoutProperties]);

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh && autoRefreshInterval > 0) {
            const interval = setInterval(generateInsights, autoRefreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, autoRefreshInterval, generateInsights]);

    // Generate insights on mount
    useEffect(() => {
        generateInsights();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Export functionality
    const exportToPDF = async () => {
        if (!insightsRef.current) return;

        try {
            const canvas = await html2canvas(insightsRef.current, {
                backgroundColor: backgroundColor,
                scale: 2,
            });

            const pdf = new JsPDF();
            const imgData = canvas.toDataURL("image/png");
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

            pdf.save(`ai-insights-${new Date().toISOString().split('T')[0]}.pdf`);
            
            toast({
                title: "Export Successful",
                description: "AI insights exported to PDF",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Export Failed",
                description: "Failed to export insights to PDF",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "red";
            case "high": return "orange";
            case "medium": return "yellow";
            case "low": return "green";
            default: return "gray";
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "performance": return "📊";
            case "efficiency": return "⚡";
            case "risk": return "⚠️";
            case "opportunity": return "🎯";
            case "trend": return "📈";
            case "quality": return "✨";
            default: return "💡";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "trend_analysis": return "Trend Analysis";
            case "pattern_detection": return "Pattern Detection";
            case "anomaly_detection": return "Anomaly Detection";
            case "predictive_insight": return "Predictive Insight";
            case "actionable_recommendation": return "Recommendation";
            case "contextual_summary": return "Summary";
            default: return "Insight";
        }
    };

    // @ts-ignore - Complex JSX union type issue, but compiles successfully
    return (
        <Box as="div"
            ref={insightsRef}
            w="100%"
            h="100%"
            bg={backgroundColor}
            color={textColor}
            p={4}
            borderRadius="md"
            overflow="auto"
        >
            {/* @ts-ignore */}
            <VStack spacing={4} align="stretch" as="div">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Heading size="md" color={textColor}>
                        {title} (Real AI)
                    </Heading>
                    <HStack spacing={2}>
                        <Tooltip label={`Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`}>
                            <IconButton
                                aria-label="Toggle auto-refresh"
                                icon={<ViewIcon />}
                                size="sm"
                                variant={autoRefresh ? "solid" : "outline"}
                                colorScheme="blue"
                                onClick={() => setAutoRefresh(!autoRefresh)}
                            />
                        </Tooltip>
                        <Tooltip label="Refresh insights">
                            <IconButton
                                aria-label="Refresh insights"
                                icon={<RepeatIcon />}
                                size="sm"
                                onClick={generateInsights}
                                isLoading={isGenerating}
                                colorScheme="blue"
                            />
                        </Tooltip>
                        <Tooltip label="Export to PDF">
                            <IconButton
                                aria-label="Export to PDF"
                                icon={<DownloadIcon />}
                                size="sm"
                                onClick={exportToPDF}
                                colorScheme="green"
                            />
                        </Tooltip>
                    </HStack>
                </Flex>

                {/* Generation Status */}
                {isGenerating && (
                    <Alert status="info" borderRadius="md">
                        <Spinner size="sm" mr={2} />
                        <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="medium">Generating real AI-powered insights...</Text>
                            <Progress size="xs" isIndeterminate w="100%" colorScheme="blue" />
                        </VStack>
                    </Alert>
                )}

                {/* Summary */}
                {summary && !isGenerating && (
                    <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="sm">{summary}</Text>
                    </Alert>
                )}

                {/* Metadata */}
                {lastGenerated && showMetadata && (
                    <HStack justify="space-between" fontSize="xs" color="gray.500">
                        <Text>
                            Generated: {lastGenerated.toLocaleString()}
                        </Text>
                        <HStack>
                            <Badge colorScheme="purple">{model}</Badge>
                            <Badge colorScheme="gray">{tokensUsed} tokens</Badge>
                            <Badge colorScheme={analysisDepth === 'advanced' ? 'green' : 'yellow'}>
                                {analysisDepth}
                            </Badge>
                        </HStack>
                    </HStack>
                )}

                {/* Insights */}
                <VStack spacing={3} align="stretch">
                    {insights.map((insight) => (
                        <Box
                            key={insight.id}
                            p={4}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="gray.200"
                            bg={backgroundColor}
                            shadow="sm"
                            transition="all 0.2s"
                            _hover={{ shadow: "md", transform: "translateY(-1px)" }}
                        >
                            <VStack align="stretch" spacing={3}>
                                {/* Insight Header */}
                                <Flex justify="space-between" align="start">
                                    <HStack spacing={2}>
                                        <Text fontSize="lg">{getCategoryIcon(insight.category)}</Text>
                                        <VStack align="start" spacing={1}>
                                            <Heading size="sm" color={textColor}>
                                                {insight.title}
                                            </Heading>
                                            <HStack spacing={2}>
                                                <Badge 
                                                    colorScheme={getPriorityColor(insight.priority)}
                                                    size="sm"
                                                >
                                                    {insight.priority.toUpperCase()}
                                                </Badge>
                                                <Badge variant="outline" size="sm">
                                                    {getTypeLabel(insight.type)}
                                                </Badge>
                                                {showConfidence && (
                                                    <Badge 
                                                        colorScheme={insight.confidence > 0.8 ? "green" : insight.confidence > 0.6 ? "yellow" : "red"}
                                                        size="sm"
                                                    >
                                                        {Math.round(insight.confidence * 100)}% confidence
                                                    </Badge>
                                                )}
                                            </HStack>
                                        </VStack>
                                    </HStack>
                                </Flex>

                                {/* Insight Content */}
                                <Text fontSize="sm" lineHeight="tall" color={textColor}>
                                    {insight.content}
                                </Text>

                                {/* Metadata */}
                                {showMetadata && insight.metadata && (
                                    <Box pt={2} borderTop="1px solid" borderColor="gray.100" as="div">
                                        <HStack spacing={4} fontSize="xs" color="gray.500">
                                            {insight.metadata.timeRange && (
                                                <Text>📅 {insight.metadata.timeRange}</Text>
                                            )}
                                            {insight.metadata.entities && insight.metadata.entities.length > 0 && (
                                                <Text>🏷️ {insight.metadata.entities.join(", ")}</Text>
                                            )}
                                            {insight.metadata.dataSource && (
                                                <Text>📊 {insight.metadata.dataSource.length} sources</Text>
                                            )}
                                        </HStack>
                                    </Box>
                                )}
                            </VStack>
                        </Box>
                    ))}
                </VStack>

                {/* No insights state */}
                {insights.length === 0 && !isGenerating && (
                    <Box textAlign="center" py={8}>
                        <Text color="gray.500" mb={4}>
                            No insights available. Click refresh to generate new AI insights.
                        </Text>
                        <Button colorScheme="blue" onClick={generateInsights}>
                            Generate AI Insights
                        </Button>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default Insights2Visualization;