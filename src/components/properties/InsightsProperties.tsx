import { 
    Stack, 
    Text, 
    Divider, 
    Alert, 
    AlertIcon, 
    AlertDescription, 
    Link,
    Code 
} from "@chakra-ui/react";
import { IVisualization } from "../../interfaces";
import ColorProperty from "./ColorProperty";
import NumberProperty from "./NumberProperty";
import SelectProperty from "./SelectProperty";
import SwitchProperty from "./SwitchProperty";
import TextProperty from "./TextProperty";

export default function InsightsProperties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    return (
        <Stack spacing="20px" pb="10px">
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
                title="Font Size (px)"
                attribute="data.fontSize"
                visualization={visualization}
            />

            <NumberProperty
                title="Max Insights"
                attribute="data.maxInsights"
                visualization={visualization}
            />

            <Divider />
            
            {/* AI Configuration */}
            <Text fontWeight="bold" fontSize="md" color="purple.600">AI-Powered Insights</Text>

            <Alert status="info" fontSize="sm">
                <AlertIcon />
                <AlertDescription>
                    Enable AI-powered insights for more sophisticated analysis. 
                    Requires a free Google Gemini API key. Get yours at{" "}
                    <Link href="https://makersuite.google.com/app/apikey" isExternal color="blue.500">
                        Google AI Studio
                    </Link>
                </AlertDescription>
            </Alert>

            <SwitchProperty
                title="Use AI-Powered Insights"
                attribute="data.useAI"
                visualization={visualization}
            />

            <TextProperty
                title="AI API Key (Optional)"
                attribute="data.aiApiKey"
                visualization={visualization}
                placeholder="Enter your Google Gemini API key"
            />

            <SwitchProperty
                title="Auto Generate on Load"
                attribute="data.autoGenerate"
                visualization={visualization}
            />

            <NumberProperty
                title="Refresh Interval (ms)"
                attribute="data.refreshInterval"
                visualization={visualization}
            />

            <SwitchProperty
                title="Include Trend Analysis"
                attribute="data.includeTrends"
                visualization={visualization}
            />

            <SwitchProperty
                title="Include Comparisons"
                attribute="data.includeComparisons"
                visualization={visualization}
            />

            <SwitchProperty
                title="Include Outlier Detection"
                attribute="data.includeOutliers"
                visualization={visualization}
            />

            <SwitchProperty
                title="Include Data Values"
                attribute="data.includeDataValues"
                visualization={visualization}
            />

            <SwitchProperty
                title="Include Geographical Comparisons"
                attribute="data.includeGeoComparisons"
                visualization={visualization}
            />
            
            <Divider />
            
            {/* Setup Instructions */}
            <Text fontWeight="bold" fontSize="md" color="orange.600">Setup Instructions</Text>

            <Alert status="warning" fontSize="sm">
                <AlertIcon />
                <Stack spacing={2}>
                    <AlertDescription>
                        <strong>To enable AI insights:</strong>
                    </AlertDescription>
                    <AlertDescription>
                        1. Get a free API key from{" "}
                        <Link href="https://makersuite.google.com/app/apikey" isExternal color="blue.500">
                            Google AI Studio
                        </Link>
                    </AlertDescription>
                    <AlertDescription>
                        2. Either paste it in the "AI API Key" field above, or add it to your environment variables as{" "}
                        <Code>REACT_APP_GEMINI_API_KEY</Code>
                    </AlertDescription>
                    <AlertDescription>
                        3. Toggle "Use AI-Powered Insights" and click "Generate Insights"
                    </AlertDescription>
                </Stack>
            </Alert>

            <SwitchProperty
                title="Show Formatted Numbers"
                attribute="data.showFormattedNumbers"
                visualization={visualization}
            />

            <SelectProperty
                title="Insight Focus"
                attribute="data.insightFocus"
                visualization={visualization}
                options={[
                    { label: "All Insights", value: "all" },
                    { label: "Data Values Only", value: "values" },
                    { label: "Trends Only", value: "trends" },
                    { label: "Comparisons Only", value: "comparisons" },
                ]}
            />

            <SelectProperty
                title="Number Format Style"
                attribute="data.numberFormat"
                visualization={visualization}
                options={[
                    { label: "Standard (1,234)", value: "standard" },
                    { label: "Compact (1.2K)", value: "compact" },
                    { label: "Scientific (1.23E3)", value: "scientific" },
                ]}
            />

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