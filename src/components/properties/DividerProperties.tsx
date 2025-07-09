import React from "react";
import { Stack, Text } from "@chakra-ui/react";
import ColorPalette from "../ColorPalette";
import NumberProperty from "../properties/NumberProperty";
import { IVisualization } from "../../interfaces";

export default function DividerProperties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    return (
        <Stack spacing="20px" p="10px">
            <Text>Divider Color</Text>
            <ColorPalette
                visualization={visualization}
                attribute="divider.color"
            />

            <NumberProperty
                visualization={visualization}
                attribute="divider.thickness"
                title="Divider Thickness (px)"
                min={1}
                max={10}
                step={1}
            />

            <NumberProperty
                visualization={visualization}
                attribute="divider.length"
                title="Divider Length (%)"
                min={10}
                max={100}
                step={10}
            />
        </Stack>
    );
}
