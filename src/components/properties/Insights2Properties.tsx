import { 
    Stack, 
    Text, 
    Divider, 
    Alert, 
    AlertIcon, 
    AlertDescription, 
    Link,
    Code,
    Badge,
    Box
} from "@chakra-ui/react";
import { IVisualization } from "../../interfaces";
import ColorProperty from "./ColorProperty";
import NumberProperty from "./NumberProperty";
import SelectProperty from "./SelectProperty";
import SwitchProperty from "./SwitchProperty";
import TextProperty from "./TextProperty";

export default function Insights2Properties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    return (
        <Stack spacing="20px" pb="10px">
            {/* Header */}
            <Box>
                <Text fontWeight="bold" fontSize="lg" color="purple.600">
                    AI Insights 2 Configuration
                </Text>
                <Text fontSize="sm" color="gray.600">
                    Advanced LLM-powered insights with dynamic analysis capabilities
                </Text>
            </Box>

            {/* Basic Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Basic Configuration</Text>
            
            <TextProperty
                title="Title"
                attribute="data.title"
                visualization={visualization}
            />

            <ColorProperty
                title="Background Color"
                attribute="layout.backgroundColor"
                visualization={visualization}
            />

            <ColorProperty
                title="Text Color"
                attribute="data.textColor"
                visualization={visualization}
            />

            <NumberProperty
                title="Max Insights"
                attribute="data.maxInsights"
                visualization={visualization}
                min={1}
                max={10}
            />

            <Divider />
            
            {/* LLM Configuration */}
            <Text fontWeight="bold" fontSize="md" color="purple.600">
                Large Language Model Configuration
            </Text>

            <Alert status="info" fontSize="sm">
                <AlertIcon />
                <AlertDescription>
                    Insights2 uses advanced LLM capabilities for dynamic, contextual analysis. 
                    Configure your preferred model and analysis parameters below.
                </AlertDescription>
            </Alert>

            <SelectProperty
                title="LLM Model"
                attribute="data.llmModel"
                visualization={visualization}
                options={[
                    { label: "GPT-4 Dashboard Analyzer (Recommended)", value: "GPT-4-Dashboard-Analyzer" },
                    { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
                    { label: "Claude-3 Sonnet", value: "claude-3-sonnet" },
                    { label: "Gemini Pro", value: "gemini-pro" },
                    { label: "Local Model", value: "local-llm" },
                ]}
            />

            <TextProperty
                title="API Key (Optional)"
                attribute="data.apiKey"
                visualization={visualization}
                placeholder="Enter your LLM API key"
            />

            <SelectProperty
                title="Analysis Depth"
                attribute="data.analysisDepth"
                visualization={visualization}
                options={[
                    { label: "Basic - Quick insights", value: "basic" },
                    { label: "Intermediate - Standard analysis", value: "intermediate" },
                    { label: "Advanced - Deep analysis (Recommended)", value: "advanced" },
                ]}
            />

            <Divider />

            {/* Analysis Configuration */}
            <Text fontWeight="bold" fontSize="md" color="green.600">Analysis Configuration</Text>

            <SwitchProperty
                title="Trend Analysis"
                attribute="data.enableTrendAnalysis"
                visualization={visualization}
            />

            <SwitchProperty
                title="Anomaly Detection"
                attribute="data.enableAnomalyDetection"
                visualization={visualization}
            />

            <SwitchProperty
                title="Pattern Recognition"
                attribute="data.enablePatternRecognition"
                visualization={visualization}
            />

            <SwitchProperty
                title="Predictive Insights"
                attribute="data.enablePredictiveInsights"
                visualization={visualization}
            />

            <SwitchProperty
                title="Actionable Recommendations"
                attribute="data.enableRecommendations"
                visualization={visualization}
            />

            <SwitchProperty
                title="Contextual Summary"
                attribute="data.enableContextualSummary"
                visualization={visualization}
            />

            <Divider />

            {/* Display Configuration */}
            <Text fontWeight="bold" fontSize="md" color="orange.600">Display Configuration</Text>

            <SwitchProperty
                title="Show Confidence Scores"
                attribute="data.showConfidence"
                visualization={visualization}
            />

            <SwitchProperty
                title="Show Metadata"
                attribute="data.showMetadata"
                visualization={visualization}
            />

            <SwitchProperty
                title="Show Priority Badges"
                attribute="data.showPriority"
                visualization={visualization}
            />

            <SwitchProperty
                title="Show Category Icons"
                attribute="data.showCategoryIcons"
                visualization={visualization}
            />

            <SelectProperty
                title="Insight Grouping"
                attribute="data.groupingMode"
                visualization={visualization}
                options={[
                    { label: "By Priority", value: "priority" },
                    { label: "By Type", value: "type" },
                    { label: "By Category", value: "category" },
                    { label: "By Confidence", value: "confidence" },
                    { label: "Chronological", value: "chronological" },
                ]}
            />

            <Divider />

            {/* Auto-refresh Configuration */}
            <Text fontWeight="bold" fontSize="md" color="teal.600">Auto-refresh Configuration</Text>

            <SwitchProperty
                title="Enable Auto-refresh"
                attribute="data.enableAutoRefresh"
                visualization={visualization}
            />

            <NumberProperty
                title="Refresh Interval (seconds)"
                attribute="data.refreshInterval"
                visualization={visualization}
                min={60}
                max={3600}
            />

            <SwitchProperty
                title="Refresh on Data Change"
                attribute="data.refreshOnDataChange"
                visualization={visualization}
            />

            <Divider />

            {/* Advanced Settings */}
            <Text fontWeight="bold" fontSize="md" color="red.600">Advanced Settings</Text>

            <NumberProperty
                title="Max Tokens per Request"
                attribute="data.maxTokens"
                visualization={visualization}
                min={500}
                max={4000}
            />

            <NumberProperty
                title="Temperature (Creativity)"
                attribute="data.temperature"
                visualization={visualization}
                min={0}
                max={1}
                step={0.1}
            />

            <SwitchProperty
                title="Include Raw Data in Context"
                attribute="data.includeRawData"
                visualization={visualization}
            />

            <SwitchProperty
                title="Enable Caching"
                attribute="data.enableCaching"
                visualization={visualization}
            />

            <NumberProperty
                title="Cache Duration (minutes)"
                attribute="data.cacheDuration"
                visualization={visualization}
                min={5}
                max={1440}
            />

            <Divider />

            {/* Export Configuration */}
            <Text fontWeight="bold" fontSize="md" color="cyan.600">Export Configuration</Text>

            <SwitchProperty
                title="Enable PDF Export"
                attribute="data.enablePdfExport"
                visualization={visualization}
            />

            <SwitchProperty
                title="Include Timestamps in Export"
                attribute="data.includeTimestamps"
                visualization={visualization}
            />

            <SwitchProperty
                title="Include Model Information"
                attribute="data.includeModelInfo"
                visualization={visualization}
            />

            <Divider />
            
            {/* Setup Instructions */}
            <Text fontWeight="bold" fontSize="md" color="orange.600">Setup & Usage</Text>

            <Alert status="success" fontSize="sm">
                <AlertIcon />
                <Stack spacing={2}>
                    <AlertDescription>
                        <Badge colorScheme="green" mr={2}>NEW</Badge>
                        <strong>Insights2 Features:</strong>
                    </AlertDescription>
                    <AlertDescription>
                        • Advanced LLM integration with multiple model support
                    </AlertDescription>
                    <AlertDescription>
                        • Dynamic trend analysis and anomaly detection
                    </AlertDescription>
                    <AlertDescription>
                        • Predictive insights and actionable recommendations
                    </AlertDescription>
                    <AlertDescription>
                        • Real-time auto-refresh capabilities
                    </AlertDescription>
                    <AlertDescription>
                        • Enhanced export and caching features
                    </AlertDescription>
                </Stack>
            </Alert>

            <Alert status="info" fontSize="sm">
                <AlertIcon />
                <Stack spacing={2}>
                    <AlertDescription>
                        <strong>Getting Started:</strong>
                    </AlertDescription>
                    <AlertDescription>
                        1. Select your preferred LLM model above
                    </AlertDescription>
                    <AlertDescription>
                        2. Configure analysis parameters (trend analysis, anomaly detection, etc.)
                    </AlertDescription>
                    <AlertDescription>
                        3. Set display preferences and auto-refresh options
                    </AlertDescription>
                    <AlertDescription>
                        4. Click the refresh button in the visualization to generate insights
                    </AlertDescription>
                </Stack>
            </Alert>

            <Alert status="warning" fontSize="sm">
                <AlertIcon />
                <AlertDescription>
                    For production use with external LLM APIs, add your API key to the "API Key" field above 
                    or set the appropriate environment variable (e.g., <Code>REACT_APP_OPENAI_API_KEY</Code>).
                </AlertDescription>
            </Alert>

            {/* Layout Properties */}
            <Divider />
            <Text fontWeight="bold" fontSize="md" color="gray.600">Layout Properties</Text>

            <NumberProperty
                title="Border Radius (px)"
                attribute="layout.borderRadius"
                visualization={visualization}
            />

            <SelectProperty
                title="Corner Style"
                attribute="layout.cornerStyle"
                visualization={visualization}
                options={[
                    { label: "Sharp Corners", value: "0" },
                    { label: "Slightly Rounded", value: "4" },
                    { label: "Rounded", value: "8" },
                    { label: "Very Rounded", value: "16" },
                    { label: "Curved", value: "24" },
                ]}
            />
        </Stack>
    );
}