import {
  Box,
  Stack,
  TabList,
  Tab,
  Tabs,
  Text,
  Fade,
  Slide,
  ScaleFade,
  keyframes,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useState } from "react";
import useInterval from "react-useinterval";
import { useStore } from "effector-react";

import { ISection } from "../../interfaces";
import SectionTitle from "../SectionTitle";
import Visualization from "./Visualization";

// Custom slide animations
const slideInFromRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInFromLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideOutToLeft = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
`;

const slideOutToRight = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
`;

const TabPanelVisualization = ({ section }: { section: ISection }) => {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [previousTabIndex, setPreviousTabIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const enableAnimations = section.enableTabAnimations !== false;
  const animationType = section.tabAnimationType || "fade";
  const animationDuration = section.tabAnimationDuration || 300;

  const increment = () => {
    if (enableAnimations && animationType !== "none") {
      setIsTransitioning(true);
      setPreviousTabIndex(tabIndex);
      setTimeout(() => {
        setTabIndex((s: number) => (s + 1) % section.visualizations.length);
        setTimeout(() => setIsTransitioning(false), animationDuration);
      }, animationDuration / 2);
    } else {
      setTabIndex((s: number) => (s + 1) % section.visualizations.length);
    }
  };

  const handleTabChange = (index: number) => {
    if (enableAnimations && animationType !== "none" && index !== tabIndex) {
      setIsTransitioning(true);
      setPreviousTabIndex(tabIndex);
      setTimeout(() => {
        setTabIndex(index);
        setTimeout(() => setIsTransitioning(false), animationDuration);
      }, animationDuration / 2);
    } else {
      setTabIndex(index);
    }
  };

  const rotationInterval = 1000 * 50;
  
  useInterval(increment, rotationInterval);

  return (
    <Stack
      h="100%"
      w="100%"
      flexDirection="column"
      key={section.id}
      spacing="0"
      overflow="hidden"
    >
      <SectionTitle section={section} />
      <Stack
        alignItems="center"
        justifyItems="center"
        alignContent="center"
        justifyContent={section.justifyContent || "space-around"}
        direction={section.direction}
        flex={1}
        w="100%"
        h="100%"
        bg={section.bg}
        overflow="hidden"
        borderRadius={section.cornerStyle || (section.borderRadius ? `${section.borderRadius}px` : "0px")}
      >
        <Tabs
          flex={1}
          index={tabIndex}
          onChange={handleTabChange}
          h="100%"
          w="100%"
          display="flex"
          flexDirection="column"
          alignContent="center"
          overflow="hidden"
          variant="line"
          size="md"
        >
          <TabList fontSize="1.4vh">
            {section.visualizations.map((visualization) => (
              <Tab key={visualization.id}>
                <Text noOfLines={1} fontSize="md" maxWidth="150px">
                  {visualization.name}
                </Text>
              </Tab>
            ))}
          </TabList>

          {/* Render all visualizations with animations */}
          <Box flex={1} h="100%" overflow="hidden" position="relative">
            {section.visualizations.map((visualization, index) => {
              const isActive = index === tabIndex;
              const isPrevious = index === previousTabIndex;
              const shouldShow = !enableAnimations || animationType === "none" ? isActive : (isActive || (isTransitioning && isPrevious));

              if (!shouldShow) return null;

              const VisualizationContent = (
                <Stack
                  alignItems="stretch"
                  justifyContent="stretch"
                  h="100%"
                  w="100%"
                  overflow="hidden"
                  p={3}
                >
                  <Box w="100%" h="100%" overflow="hidden">
                    <Visualization
                      key={visualization.id}
                      visualization={visualization}
                      section={section}
                    />
                  </Box>
                </Stack>
              );

              // No animations - simple display toggle
              if (!enableAnimations || animationType === "none") {
                return (
                  <Box
                    key={visualization.id}
                    position="absolute"
                    top={0}
                    left={0}
                    w="100%"
                    h="100%"
                    overflow="hidden"
                  >
                    {VisualizationContent}
                  </Box>
                );
              }

              // Animated rendering
              const getAnimation = () => {
                switch (animationType) {
                  case "fade":
                    return (
                      <Fade
                        in={isActive}
                        transition={{ duration: animationDuration / 1000 }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          overflow="hidden"
                        >
                          {VisualizationContent}
                        </Box>
                      </Fade>
                    );

                  case "scale":
                    return (
                      <ScaleFade
                        in={isActive}
                        initialScale={0.9}
                        transition={{ duration: animationDuration / 1000 }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          overflow="hidden"
                        >
                          {VisualizationContent}
                        </Box>
                      </ScaleFade>
                    );

                  case "slide":
                    const isGoingForward = tabIndex > previousTabIndex || (tabIndex === 0 && previousTabIndex === section.visualizations.length - 1);
                    const slideDirection = isGoingForward ? "right" : "left";
                    
                    return (
                      <Slide
                        in={isActive}
                        direction={slideDirection}
                        transition={{ duration: animationDuration / 1000 }}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          overflow="hidden"
                        >
                          {VisualizationContent}
                        </Box>
                      </Slide>
                    );

                  default:
                    return (
                      <Box
                        key={visualization.id}
                        position="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        overflow="hidden"
                        opacity={isActive ? 1 : 0}
                        transition={`opacity ${animationDuration}ms ease-in-out`}
                      >
                        {VisualizationContent}
                      </Box>
                    );
                }
              };

              return (
                <React.Fragment key={visualization.id}>
                  {getAnimation()}
                </React.Fragment>
              );
            })}
          </Box>
        </Tabs>
      </Stack>
    </Stack>
  );
};

export default TabPanelVisualization;
