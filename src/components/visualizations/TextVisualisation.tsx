import React from "react";
import { ChartProps } from "../../interfaces";
import { Box, Text as ChakraText } from "@chakra-ui/react";

export default function TextVisualisation({
    visualization,
}: ChartProps) {
    const props = visualization.properties || {};
    const text = (props["data.text"] as string) || "";
    const color = (props["data.color"] as string) || "#000000";
    const fontSize = (props["data.height"] as number) || 20;
    const fontWeight = (props["data.fontWeight"] as number) || 400;
    const textAlign = (props["data.align"] as string) || "left";

    return (
        <Box
            h="100%"
            w="100%"
            p={4}
            overflow="auto"
        >
            <ChakraText
                color={color}
                fontSize={`${fontSize}px`}
                fontWeight={fontWeight}
                textAlign={textAlign as any}
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                overflowWrap="anywhere"
            >
                {text}
            </ChakraText>
        </Box>
    );
}
