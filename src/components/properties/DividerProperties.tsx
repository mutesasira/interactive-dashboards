import React from "react";
import { Stack, Text, Select as ChakraSelect } from "@chakra-ui/react";
import ColorPalette from "../ColorPalette";
import NumberProperty from "../properties/NumberProperty";
import { IVisualization } from "../../interfaces";
import { sectionApi } from "../../Events";

export default function DividerProperties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    const orientation = visualization.properties?.["orientation"] || "horizontal";
    const style = visualization.properties?.["style"] || "solid";
    
    return (
        <Stack spacing="20px" p="10px">
            <Text fontSize="sm" fontWeight="medium">Line/Divider Configuration</Text>
            
            {/* Orientation */}
            <Stack spacing="10px">
                <Text fontSize="sm">Orientation</Text>
                <ChakraSelect
                    value={orientation}
                    size="sm"
                    onChange={(e) => {
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "orientation",
                            value: e.target.value,
                        });
                    }}
                >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                </ChakraSelect>
            </Stack>

            {/* Style */}
            <Stack spacing="10px">
                <Text fontSize="sm">Line Style</Text>
                <ChakraSelect
                    value={style}
                    size="sm"
                    onChange={(e) => {
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "style",
                            value: e.target.value,
                        });
                    }}
                >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </ChakraSelect>
            </Stack>

            {/* Color */}
            <Stack spacing="10px">
                <Text fontSize="sm">Color</Text>
                <ColorPalette
                    visualization={visualization}
                    attribute="color"
                />
            </Stack>

            {/* Thickness */}
            <NumberProperty
                visualization={visualization}
                attribute="thickness"
                title="Thickness (px)"
                min={1}
                max={20}
                step={1}
            />

            {/* Length */}
            <NumberProperty
                visualization={visualization}
                attribute="length"
                title="Length (%)"
                min={10}
                max={100}
                step={5}
            />

            {/* Opacity */}
            <NumberProperty
                visualization={visualization}
                attribute="opacity"
                title="Opacity"
                min={0.1}
                max={1}
                step={0.1}
            />
        </Stack>
    );
}
