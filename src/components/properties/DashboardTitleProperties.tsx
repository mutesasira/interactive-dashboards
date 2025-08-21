import { Stack, Text } from "@chakra-ui/react";
import React from "react";
import { IVisualization } from "../../interfaces";
import NumberProperty from "./NumberProperty";
import ColorPalette from "../ColorPalette";
import RadioProperty from "./RadioProperty";
import TextProperty from "./TextProperty";

const DashboardTitleProperties = ({
    visualization,
}: {
    visualization: IVisualization;
}) => {
    const titleType = visualization.properties.titleType || "manual";
    
    return (
        <Stack spacing="20px" pb="10px">
            <RadioProperty
                title="Title Type"
                visualization={visualization}
                attribute="titleType"
                options={[
                    { label: "Manual", value: "manual" },
                    { label: "Dynamic (User-based)", value: "dynamic" },
                ]}
            />
            
            {titleType === "manual" && (
                <TextProperty
                    title="Custom Title"
                    visualization={visualization}
                    attribute="customTitle"
                    placeholder="Enter custom title"
                />
            )}
            
            {titleType === "dynamic" && (
                <>
                    <TextProperty
                        title="Additional Text"
                        visualization={visualization}
                        attribute="dynamicText"
                        placeholder="e.g., Dashboard for, Welcome"
                    />
                    
                    <RadioProperty
                        title="Text Position"
                        visualization={visualization}
                        attribute="textPosition"
                        options={[
                            { label: "Before Username", value: "before" },
                            { label: "After Username", value: "after" },
                        ]}
                    />
                </>
            )}
            
            <NumberProperty
                title="Font size"
                visualization={visualization}
                attribute="fontSize"
            />
            <Stack>
                <Text>Title font color</Text>
                <ColorPalette visualization={visualization} attribute="color" />
            </Stack>
            <NumberProperty
                title="Font Weight"
                visualization={visualization}
                attribute="fontWeight"
                min={100}
                max={900}
                step={50}
            />
        </Stack>
    );
};

export default DashboardTitleProperties;
