import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Stack,
  Text,
  Circle,
  Image,
} from "@chakra-ui/react";
// import { Progress } from "antd"; // Temporarily commented out
import { useStore } from "effector-react";
import { useEffect, useState } from "react";
import { calculatedApi } from "../../Events";
import { ChartProps, Threshold } from "../../interfaces";
import { $visualizationData } from "../../Store";
import { processSingleValue, findColor } from "../processors";

const SingleValue = ({
  visualization,
  dataProperties,
  layoutProperties,
  data,
  section,
}: ChartProps) => {
  const [color, setColor] = useState<string>("");
  const [targetValue, setTargetValue] = useState<number | undefined | null>();
  const visualizationData = useStore($visualizationData);
  
  // Check if we're in marquee mode
  const isMarqueeMode = section?.display === "marquee";

  //   const value = processSingleValue(data, visualization.properties);
  const rawValue = processSingleValue(data, visualization.properties);
  const value = rawValue == null || isNaN(rawValue) ? '0' : rawValue;

  const thresholds: Threshold[] = dataProperties?.["data.thresholds"] || [];

  const prefix = dataProperties?.["data.prefix"];
  const suffix = dataProperties?.["data.suffix"];
  const target = dataProperties?.["data.target"];
  const targetGraph = dataProperties?.["data.targetgraph"];
  const direction = dataProperties?.["data.direction"] || "column";
  // Helper function to convert font size values to appropriate units
  const convertFontSize = (value: any, defaultSize: string, baseSize: number = 16) => {
    if (!value) return defaultSize;
    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) return defaultSize;
    
    // If the value includes units, use it as-is
    if (String(value).includes('px') || String(value).includes('em') || String(value).includes('rem') || String(value).includes('%')) {
      return String(value);
    }
    
    // If the value is very small (like 1.8), treat it as a multiplier of base size
    if (numValue < 10) {
      return `${numValue * baseSize}px`;
    }
    
    // If it's a larger number, treat it as px
    return `${numValue}px`;
  };

  const titleFontSize = convertFontSize(dataProperties?.["data.title.fontSize"], "16px", 8); // Base: 8px for title (1.8 → 14.4px)
  
  const titleFontWeight = dataProperties?.["data.title.fontWeight"] || 300;
  const titleCase = dataProperties?.["data.title.case"] || "";
  const titleColor = dataProperties?.["data.title.color"] || "black";
  const alignItems = dataProperties?.["data.alignItems"] || "center";
  const singleValueBorder = dataProperties?.["data.border"] || 0;
  const fontWeight = dataProperties?.["data.format.fontWeight"] || 400;
  const fontSize = convertFontSize(dataProperties?.["data.format.fontSize"], "32px", 10); // Base: 10px for value (1.8 → 18px)
  const alignment = dataProperties?.["data.alignment"] || "column";
  const position = dataProperties?.["data.position"] || "center";
  const verticalPosition = dataProperties?.["data.verticalPosition"] || "center";
  const justifyContent = dataProperties?.["data.justifyContent"] || "center";
  const bg = layoutProperties?.["layout.bg"] || "";
  const radius = dataProperties?.["data.targetradius"] || 60;
  const thickness = dataProperties?.["data.targetthickness"] || 10;
  const targetColor = dataProperties?.["data.targetcolor"] || "blue";
  const targetSpacing = dataProperties?.["data.targetspacing"] || 0;
  // Spacing
  const defaultSpacing = ["row", "row-reverse"].includes(alignment) ? 10 : 0;
  const spacing = dataProperties?.["data.format.spacing"] ?? defaultSpacing;

  const showCircle = dataProperties?.["data.showCircle"] ?? false;
  // Circle size
  const circleSize = dataProperties?.["data.circleSize"] ?? 100;
  const circleThickness = dataProperties?.["data.circleThickness"] ?? 2;
  const circleDotted = dataProperties?.["data.circleDotted"] ?? false;
  const circleColor = dataProperties?.["data.circleColor"] ?? color;

  const secondaryKey = dataProperties?.["data.secondaryTarget"];
  const secondaryPosition =
    dataProperties?.["data.secondaryTargetPosition"] ?? "row";
  const secondarySpacing = dataProperties?.["data.secondaryTargetSpacing"] ?? 0;
  const secondaryFontSize =
    dataProperties?.["data.secondaryTargetFontSize"] ?? Math.max(parseFloat(fontSize) * 0.4, 14); // e.g. px value
  const secondaryFontWeight =
    dataProperties?.["data.secondaryTargetFontWeight"] ?? fontWeight;
  const secondaryColor = dataProperties?.["data.secondaryTargetColor"] ?? color;
  const bracketedSecondary =
    dataProperties?.["data.secondaryTargetBracketed"] ?? false;

  const [secondaryValue, setSecondaryValue] = useState<number | null>(null);
  const secondaryDecimals =
    dataProperties?.["data.secondaryTargetDecimalPlaces"] ?? 0;
  const secondaryFormatter = Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: secondaryDecimals,
  });

  // Enhanced styling properties
  const containerPadding = dataProperties?.["data.container.padding"] ?? "4px";
  const containerMargin = dataProperties?.["data.container.margin"] ?? "0px";
  const borderRadius = dataProperties?.["data.container.borderRadius"] ?? "3px";
  const borderColor = dataProperties?.["data.container.borderColor"] ?? "transparent";
  const borderStyle = dataProperties?.["data.container.borderStyle"] ?? "solid";
  
  // Shadow properties
  const boxShadow = dataProperties?.["data.container.boxShadow"] ?? "none";
  const shadowBlur = dataProperties?.["data.shadow.blur"] ?? 0;
  const shadowSpread = dataProperties?.["data.shadow.spread"] ?? 0;
  const shadowOffsetX = dataProperties?.["data.shadow.offsetX"] ?? 0;
  const shadowOffsetY = dataProperties?.["data.shadow.offsetY"] ?? 2;
  const shadowColor = dataProperties?.["data.shadow.color"] ?? "rgba(0,0,0,0.1)";
  const enableShadow = dataProperties?.["data.shadow.enabled"] ?? false;
  
  // Gradient properties
  const enableGradient = dataProperties?.["data.gradient.enabled"] ?? false;
  const gradientDirection = dataProperties?.["data.gradient.direction"] ?? "to bottom";
  const gradientStartColor = dataProperties?.["data.gradient.startColor"] ?? "#ffffff";
  const gradientEndColor = dataProperties?.["data.gradient.endColor"] ?? "#f0f0f0";
  
  // Animation properties
  const enableAnimation = dataProperties?.["data.animation.enabled"] ?? false;
  const animationType = dataProperties?.["data.animation.type"] ?? "pulse";
  const animationDuration = dataProperties?.["data.animation.duration"] ?? "2s";
  
  // Value styling enhancements
  const valueTextShadow = dataProperties?.["data.value.textShadow"] ?? "none";
  const valueFontFamily = dataProperties?.["data.value.fontFamily"] ?? "inherit";
  const valueLetterSpacing = dataProperties?.["data.value.letterSpacing"] ?? "normal";
  const valueLineHeight = dataProperties?.["data.value.lineHeight"] ?? "1.2";
  
  // Title styling enhancements
  const titleTextShadow = dataProperties?.["data.title.textShadow"] ?? "none";
  const titleFontFamily = dataProperties?.["data.title.fontFamily"] ?? "inherit";
  const titleLetterSpacing = dataProperties?.["data.title.letterSpacing"] ?? "normal";
  const titleLineHeight = dataProperties?.["data.title.lineHeight"] ?? "1.2";
  
  // Icon properties (removed unused variables for now)
  // const showIcon = dataProperties?.["data.icon.show"] ?? false;
  // const iconName = dataProperties?.["data.icon.name"] ?? "";
  // const iconSize = dataProperties?.["data.icon.size"] ?? "24px";
  // const iconColor = dataProperties?.["data.icon.color"] ?? color;
  // const iconPosition = dataProperties?.["data.icon.position"] ?? "left";

  // Value margin properties
  const valueMarginTop = dataProperties?.["data.value.marginTop"] ?? 0;
  const valueMarginBottom = dataProperties?.["data.value.marginBottom"] ?? 0;
  const valueMarginLeft = dataProperties?.["data.value.marginLeft"] ?? 0;
  const valueMarginRight = dataProperties?.["data.value.marginRight"] ?? 0;
  const valueMargin = dataProperties?.["data.value.margin"] ?? "";

  // Image properties
  const showImage = dataProperties?.["data.image.show"] ?? false;
  const imageUrl = dataProperties?.["data.image.url"] ?? "";
  const imagePosition = dataProperties?.["data.image.position"] ?? "top";
  // Image sizes
  const imageWidth = dataProperties?.["data.image.width"] ?? 60;
  const imageHeight = dataProperties?.["data.image.height"] ?? 60;
  const imageObjectFit = dataProperties?.["data.image.objectFit"] ?? "contain";
  const imageBorderRadius = dataProperties?.["data.image.borderRadius"] ?? 0;
  // Image spacing
  const imageSpacing = dataProperties?.["data.image.spacing"] ?? 8;
  const imageOpacity = dataProperties?.["data.image.opacity"] ?? 1;

  useEffect(() => {
    if (secondaryKey) {
      const rows = visualizationData[secondaryKey];
      if (rows?.length) setSecondaryValue(Number(rows[0].value));
      else setSecondaryValue(Number(secondaryKey));
    }
  }, [secondaryKey, visualizationData,]);

  const format = {
    style: dataProperties?.["data.format.style"] || "decimal",
    notation: dataProperties?.["data.format.notation"] || "standard",
    maximumFractionDigits:
      dataProperties?.["data.format.maximumFractionDigits"] || 0,
  };

  useEffect(() => {
    setColor(() => findColor(value, thresholds));
  }, [dataProperties]);

  useEffect(() => {
    if (target) {
      const data = visualizationData[target];
      if (data) {
        setTargetValue(() => Number(data[0].value));
      } else {
        setTargetValue(() => Number(target));
      }
    }
  }, [target, visualizationData]);

  useEffect(() => {
    if (value) {
      calculatedApi.add({
        id: visualization.id,
        value,
      });
    }
  }, [String(value)]);
  const numberFormatter = Intl.NumberFormat("en-US", format);

  // Helper functions for advanced styling
  const getContainerStyle = () => {
    const style: any = {
      padding: containerPadding,
      margin: containerMargin,
      borderRadius: borderRadius,
      borderColor: borderColor,
      borderStyle: borderStyle,
      borderWidth: `${singleValueBorder}px`,
    };

    // Apply gradient background
    if (enableGradient) {
      style.background = `linear-gradient(${gradientDirection}, ${gradientStartColor}, ${gradientEndColor})`;
    } else {
      style.bg = bg;
    }

    // Apply shadow
    if (enableShadow) {
      style.boxShadow = `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`;
    } else if (boxShadow !== "none") {
      style.boxShadow = boxShadow;
    }

    // Apply animation
    if (enableAnimation) {
      style.animation = `${animationType} ${animationDuration} infinite`;
    }

    return style;
  };

  const getValueStyle = () => {
    // Build margin style - use custom margin if provided, otherwise use individual margins
    const marginStyle = valueMargin ? {
      margin: valueMargin
    } : {
      marginTop: `${valueMarginTop}px`,
      marginBottom: `${valueMarginBottom}px`,
      marginLeft: `${valueMarginLeft}px`,
      marginRight: `${valueMarginRight}px`,
    };

    return {
      fontSize: fontSize,
      color: color,
      fontWeight: fontWeight,
      textShadow: valueTextShadow,
      fontFamily: valueFontFamily,
      letterSpacing: valueLetterSpacing,
      lineHeight: valueLineHeight,
      minHeight: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...marginStyle,
    };
  };

  const getTitleStyle = () => ({
    textTransform: titleCase,
    fontWeight: titleFontWeight,
    fontSize: titleFontSize,
    color: titleColor,
    whiteSpace: "normal",
    textShadow: titleTextShadow,
    fontFamily: titleFontFamily,
    letterSpacing: titleLetterSpacing,
    lineHeight: titleLineHeight,
    minHeight: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  // Image component helper
  const ImageComponent = () => {
    if (!showImage || !imageUrl) return null;
    
    return (
      <Image
        src={imageUrl}
        alt="Single Value Image"
        width={`${imageWidth}px`}
        height={`${imageHeight}px`}
        objectFit={imageObjectFit}
        borderRadius={`${imageBorderRadius}px`}
        opacity={imageOpacity}
        loading="lazy"
        fallback={
          <Box 
            width={`${imageWidth}px`} 
            height={`${imageHeight}px`} 
            bg="gray.200" 
            borderRadius={`${imageBorderRadius}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="14px"
            color="gray.500"
          >
            📷
          </Box>
        }
      />
    );
  };

  // Get layout direction and spacing based on image position
  const getLayoutForImagePosition = () => {
    switch (imagePosition) {
      case "top":
        return { direction: "column", spacing: imageSpacing };
      case "bottom":
        return { direction: "column-reverse", spacing: imageSpacing };
      case "left":
        return { direction: "row", spacing: imageSpacing };
      case "right":
        return { direction: "row-reverse", spacing: imageSpacing };
      default:
        return { direction: alignment, spacing: spacing };
    }
  };

  // Render the main content (title, value, progress)
  const renderMainContent = () => {
    const content = (
      <>
        {visualization.name && (
          <Text sx={getTitleStyle()}>
            {visualization.name}
          </Text>
        )}
        <Stack direction={direction} spacing={`${targetSpacing}px`}>
          {/* primary target graph */}
          {targetGraph === "circular" && targetValue != null && target ? (
            <CircularProgress
              value={(value * 100) / targetValue}
              size={`${radius}px`}
              thickness={`${thickness}px`}
              color={targetColor}
            >
              <CircularProgressLabel>
                {((value * 100) / targetValue).toFixed(0)}%
              </CircularProgressLabel>
            </CircularProgress>
          ) : targetGraph === "progress" && targetValue != null && target ? (
            <Box 
              w="300px"
              maxW="100%"
              bg="gray.200"
              h="20px"
              borderRadius="md"
            >
              <Box
                bg="blue.500"
                h="100%"
                w={`${Math.min((value * 100) / targetValue, 100)}%`}
                borderRadius="md"
              />
            </Box>
          ) : null}

          {/* main value + secondary target */}
          <Stack
            direction={secondaryPosition}
            spacing={`${secondarySpacing}px`}
            alignItems="center"
          >
            <Text sx={getValueStyle()}>
              {prefix}
              {numberFormatter.format(value)}
              {suffix}
            </Text>
            {secondaryValue != null && (
              <Text
                fontSize={`${secondaryFontSize}px`}
                color={secondaryColor}
                fontWeight={secondaryFontWeight}
              >
                {bracketedSecondary && "("}
                {secondaryFormatter.format(secondaryValue)}%
                {bracketedSecondary && ")"}
              </Text>
            )}
          </Stack>
        </Stack>
      </>
    );

    if (showCircle) {
      return (
        <Box
          w={`${circleSize}px`}
          h={`${circleSize}px`}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          borderWidth={`${circleThickness}px`}
          borderStyle={circleDotted ? "dashed" : "solid"}
          borderColor={circleColor}
          borderRadius="50%"
        >
          {content}
        </Box>
      );
    }

    return (
      <Stack 
        direction={alignment} 
        alignItems={isMarqueeMode ? "center" : alignItems}
        justifyContent={isMarqueeMode ? "center" : getJustifyContentValue()}
        spacing={`${spacing}px`}
        w="100%"
        h="100%"
        flex="1"
        transform={isMarqueeMode ? "translateY(-10%)" : "none"}
      >
        {content}
      </Stack>
    );
  };

  // Helper function to get the appropriate justify-content value
  // Prioritizes the justifyContent property, falls back to position-based logic
  const getJustifyContentValue = () => {
    // If horizontal position is explicitly set (not default), use position-based logic
    const hasExplicitPosition = dataProperties?.["data.position"] && dataProperties["data.position"] !== "center";
    
    if (!hasExplicitPosition && justifyContent) {
      // Use the justifyContent property (includes space-between, space-around, etc.)
      return justifyContent;
    }
    
    // Otherwise, use position-based logic
    switch (position) {
      case "left":
        return "flex-start";
      case "right":
        return "flex-end";
      case "center":
      default:
        return "center";
    }
  };

  // Helper function to convert vertical position to align-items value
  const getAlignItemsFromVerticalPosition = (pos: string) => {
    switch (pos) {
      case "top":
        return "flex-start";
      case "bottom":
        return "flex-end";
      case "center":
      default:
        return "center";
    }
  };

  // Animation keyframes (will be injected as CSS)
  const animationStyles = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 5px rgba(0,123,255,0.5); }
      50% { box-shadow: 0 0 20px rgba(0,123,255,0.8); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Fix marquee alignment issues */
    .marquee-slider-item {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
    }
    
    /* Ensure single value containers are centered in marquee */
    .marquee-slider-item > * {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
      width: 100% !important;
    }
  `;

  return (
    <>
      {/* Inject CSS animations */}
      <style>{animationStyles}</style>
      
      <Stack
        alignItems={isMarqueeMode ? "center" : (showImage && imagePosition !== "background" ? "stretch" : getAlignItemsFromVerticalPosition(verticalPosition))}
        justifyContent={isMarqueeMode ? "center" : (showImage && imagePosition !== "background" ? "stretch" : getJustifyContentValue())}
        direction={showImage && imagePosition !== "background" ? getLayoutForImagePosition().direction : "column"}
        w="100%"
        h="100%"
        minH={isMarqueeMode ? "100px" : "120px"}
        minW="150px"
        spacing={showImage && imagePosition !== "background" ? `${getLayoutForImagePosition().spacing}px` : "0px"}
        sx={{
          ...getContainerStyle(),
          ...(showImage && imagePosition === "background" && imageUrl ? {
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: imageObjectFit === "cover" ? "cover" : "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundOpacity: imageOpacity
          } : {})
        }}
      >
        {/* Top image */}
        {showImage && imagePosition === "top" && <ImageComponent />}
        
        {/* Left image */}
        {showImage && imagePosition === "left" && <ImageComponent />}
        
        {/* Main content */}
        <Box w="100%" h="100%" flex="1" display="flex" alignItems={getAlignItemsFromVerticalPosition(verticalPosition)} justifyContent={getJustifyContentValue()}>
          {renderMainContent()}
        </Box>
        
        {/* Right image */}
        {showImage && imagePosition === "right" && <ImageComponent />}
        
        {/* Bottom image */}
        {showImage && imagePosition === "bottom" && <ImageComponent />}
      </Stack>
    </>
  );
};
export default SingleValue;