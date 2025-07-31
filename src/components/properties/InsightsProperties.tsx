import { Stack } from "@chakra-ui/react";
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
        <Stack spacing="20px">
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