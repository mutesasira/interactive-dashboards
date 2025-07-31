import { Box, Text } from "@chakra-ui/react";
import { ISection } from "../interfaces";

interface SectionTitleProps {
    section: ISection;
}

const SectionTitle = ({ section }: SectionTitleProps) => {
    // Get section title properties with defaults
    const showSectionTitle = section.displayTitle !== false;
    const sectionTitle = section.title || "";
    
    // Get styling properties from section or use defaults
    const titleFontSize = section.properties?.["sectionTitle.fontSize"] || "1.6vh";
    const titleFontWeight = section.properties?.["sectionTitle.fontWeight"] || "600";
    const titleColor = section.properties?.["sectionTitle.color"] || "#2D3748";
    const titleBg = section.properties?.["sectionTitle.bg"] || "transparent";
    const titlePadding = section.properties?.["sectionTitle.padding"] || "8px 12px";
    const titleMargin = section.properties?.["sectionTitle.margin"] || "0px 0px 8px 0px";
    const titleBorderRadius = section.properties?.["sectionTitle.borderRadius"] || "4px";
    const titleTextAlign = section.properties?.["sectionTitle.textAlign"] || "left";
    const titleBorder = section.properties?.["sectionTitle.border"] || "none";
    const titleTextShadow = section.properties?.["sectionTitle.textShadow"] || "none";
    const titleFontFamily = section.properties?.["sectionTitle.fontFamily"] || "inherit";
    const titleLetterSpacing = section.properties?.["sectionTitle.letterSpacing"] || "normal";
    const titleTextTransform = section.properties?.["sectionTitle.textTransform"] || "none";
    const titleBoxShadow = section.properties?.["sectionTitle.boxShadow"] || "none";
    
    // Don't render if title is empty or disabled
    if (!showSectionTitle || !sectionTitle.trim()) {
        return null;
    }

    return (
        <Box
            w="100%"
            bg={titleBg}
            padding={titlePadding}
            margin={titleMargin}
            borderRadius={titleBorderRadius}
            border={titleBorder}
            boxShadow={titleBoxShadow}
            flexShrink={0} // Prevent title from shrinking
        >
            <Text
                fontSize={titleFontSize}
                fontWeight={titleFontWeight}
                color={titleColor}
                textAlign={titleTextAlign as any}
                textShadow={titleTextShadow}
                fontFamily={titleFontFamily}
                letterSpacing={titleLetterSpacing}
                textTransform={titleTextTransform as any}
                noOfLines={2} // Allow wrapping to 2 lines max
                wordBreak="break-word"
            >
                {sectionTitle}
            </Text>
        </Box>
    );
};

export default SectionTitle;