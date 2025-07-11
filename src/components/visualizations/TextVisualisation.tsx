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

    return (
        <Box
            w="100%"
            p={4}
            /* no fixed height, so it will stretch to fit its content */
            height="auto"
            overflow="visible"    /* no scrolling unless you explicitly set maxH elsewhere */
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

