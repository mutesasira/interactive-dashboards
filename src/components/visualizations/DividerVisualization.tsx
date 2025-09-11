import React from "react";
import { Box, Divider as ChakraDivider } from "@chakra-ui/react";
import { ChartProps } from "../../interfaces";

/**
 * DividerVisualization - A flexible line/divider component for dashboard layouts
 * 
 * Supports:
 * - Horizontal and vertical orientation
 * - Customizable thickness (1-20px)
 * - Adjustable length (10-100%)
 * - Multiple line styles (solid, dashed, dotted)
 * - Custom colors and opacity
 * - Proper centering in grid and other layouts
 */
const DividerVisualization: React.FC<ChartProps> = ({ visualization }) => {
    const props = visualization.properties || {};
    
    // Extract properties with defaults and validation
    const orientation = (props["orientation"] as string) || "horizontal";
    const thickness = Math.max(1, Math.min(20, Number(props["thickness"]) || 2));
    const length = Math.max(10, Math.min(100, Number(props["length"]) || 80));
    const color = (props["color"] as string) || "#e2e8f0";
    const style = (props["style"] as string) || "solid"; // solid, dashed, dotted
    const opacity = Math.max(0.1, Math.min(1, Number(props["opacity"]) || 1));
    
    // For vertical dividers, we need custom styling since Chakra's Divider has limitations
    if (orientation === "vertical") {
        const verticalStyles = style === "solid" 
            ? {
                width: `${thickness}px`,
                height: `${length}%`,
                backgroundColor: color,
                minWidth: "1px", // Ensure minimum visibility
            }
            : {
                width: "0px",
                height: `${length}%`,
                borderLeft: `${thickness}px ${style} ${color}`,
                minWidth: "1px", // Ensure minimum visibility for borders
            };

        return (
            <Box
                w="100%"
                h="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="20px"
            >
                <Box
                    {...verticalStyles}
                    minH="20px"
                    opacity={opacity}
                    flexShrink={0}
                />
            </Box>
        );
    }
    
    // Horizontal divider
    return (
        <Box
            w="100%"
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <ChakraDivider
                orientation="horizontal"
                borderColor={color}
                borderWidth={`${thickness}px`}
                width={`${length}%`}
                opacity={opacity}
                borderStyle={style as any}
            />
        </Box>
    );
};

export default DividerVisualization;
