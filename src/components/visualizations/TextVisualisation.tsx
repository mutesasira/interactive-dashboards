// import React from "react";
// import { ChartProps } from "../../interfaces";
// import { Box, Text as ChakraText } from "@chakra-ui/react";

// export default function TextVisualisation({
//     visualization,
// }: ChartProps) {
//     const props = visualization.properties || {};
//     const text = (props["data.text"] as string) || "";
//     const color = (props["data.color"] as string) || "#000000";
//     const fontSize = (props["data.height"] as number) || 20;
//     const fontWeight = (props["data.fontWeight"] as number) || 400;
//     const textAlign = (props["data.align"] as string) || "left";

//     return (
//         <Box
//             h="100%"
//             w="100%"
//             p={4}
//             overflow="auto"
//         >
//             <ChakraText
//                 color={color}
//                 fontSize={`${fontSize}px`}
//                 fontWeight={fontWeight}
//                 textAlign={textAlign as any}
//                 whiteSpace="pre-wrap"
//                 wordBreak="break-word"
//                 overflowWrap="anywhere"
//             >
//                 {text}
//             </ChakraText>
//         </Box>
//     );
// }

// src/components/TextVisualisation.tsx
// src/components/TextVisualisation.tsx


import React from "react";
import { Box, Text as ChakraText } from "@chakra-ui/react";
import { ChartProps } from "../../interfaces";

export default function TextVisualisation({ visualization }: ChartProps) {
    const props = visualization.properties || {};
    const text = (props["data.text"] as string) || "";
    const color = (props["data.color"] as string) || "#000000";
    const fontSize = (props["data.height"] as number) || 20;
    const fontWeight = (props["data.fontWeight"] as number) || 400;
    const textAlign = (props["data.align"] as string) || "left";
    const marginTop = (props["data.marginTop"] as number) || 0;
    const marginRight = (props["data.marginRight"] as number) || 0;
    const marginBottom = (props["data.marginBottom"] as number) || 0;
    const marginLeft = (props["data.marginLeft"] as number) || 0;

    return (
        <Box
            w="100%"
            h="100%"
            p={4}
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden" // Hide scrollbars completely
            sx={{
                // Hide scrollbars in all browsers while still allowing scroll
                '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Safari, Edge
                '-ms-overflow-style': 'none', // IE 
                'scrollbar-width': 'none', // Firefox
            }}
        >
            <Box
                marginTop={`${marginTop}px`}
                marginRight={`${marginRight}px`}
                marginBottom={`${marginBottom}px`}
                marginLeft={`${marginLeft}px`}
                maxW="100%"
                maxH="100%"
            >
                <ChakraText
                    color={color}
                    fontSize={`${fontSize}px`}
                    fontWeight={fontWeight}
                    textAlign={textAlign as any}
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    overflowWrap="anywhere"
                    maxW="100%"
                    maxH="100%"
                >
                    {text}
                </ChakraText>
            </Box>
        </Box>
    );
}

