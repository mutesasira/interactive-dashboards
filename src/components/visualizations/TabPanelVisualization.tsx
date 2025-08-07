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
  Grid,
  GridItem,
} from "@chakra-ui/react";
import React, { useState, useMemo } from "react";
import useInterval from "react-useinterval";

import { ISection, IVisualization } from "../../interfaces";
import SectionTitle from "../SectionTitle";
import Visualization from "./Visualization";

// Tab type definition
interface TabData {
  id: string;
  name: string;
  type: 'group' | 'single';
  visualizations: IVisualization[];
  gridEnabled?: boolean;
  gridColumns?: number;
  gridRows?: number;
  gridSpacing?: number;
}

const TabPanelVisualization = ({ section }: { section: ISection }) => {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [previousTabIndex, setPreviousTabIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const enableAnimations = section.enableTabAnimations !== false;
  const animationType = section.tabAnimationType || "fade";
  const animationDuration = section.tabAnimationDuration || 300;

  // Calculate tabs to display based on whether tab groups are enabled
  const tabsToDisplay = useMemo<TabData[]>(() => {
    if (section.useTabGroups && section.tabGroups && section.tabGroups.length > 0) {
      // Use tab groups - create tabs from groups
      return section.tabGroups
        .sort((a, b) => a.order - b.order)
        .map(group => ({
          id: group.id,
          name: group.name,
          type: 'group' as const,
          visualizations: section.visualizations.filter(viz => 
            group.visualizationIds.includes(viz.id)
          ),
          gridEnabled: group.gridEnabled,
          gridColumns: group.gridColumns,
          gridRows: group.gridRows,
          gridSpacing: group.gridSpacing
        }));
    } else {
      // Default behavior - each visualization is its own tab
      return section.visualizations.map(viz => ({
        id: viz.id,
        name: viz.name || 'Untitled',
        type: 'single' as const,
        visualizations: [viz]
      }));
    }
  }, [section.useTabGroups, section.tabGroups, section.visualizations]);

  const increment = () => {
    if (enableAnimations && animationType !== "none") {
      setIsTransitioning(true);
      setPreviousTabIndex(tabIndex);
      setTimeout(() => {
        setTabIndex((s: number) => (s + 1) % tabsToDisplay.length);
        setTimeout(() => setIsTransitioning(false), animationDuration);
      }, animationDuration / 2);
    } else {
      setTabIndex((s: number) => (s + 1) % tabsToDisplay.length);
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
            {tabsToDisplay.map((tab) => (
              <Tab key={tab.id}>
                <Text noOfLines={1} fontSize="md" maxWidth="150px">
                  {tab.name}
                </Text>
              </Tab>
            ))}
          </TabList>

          {/* Render all tabs with animations */}
          <Box flex={1} h="100%" overflow="hidden" position="relative">
            {tabsToDisplay.map((tab, index) => {
              const isActive = index === tabIndex;
              const isPrevious = index === previousTabIndex;
              const shouldShow = !enableAnimations || animationType === "none" ? isActive : (isActive || (isTransitioning && isPrevious));

              if (!shouldShow) return null;

              const TabContent = (
                <Box
                  w="100%"
                  h="100%"
                  overflow="hidden"
                  p={3}
                  display="flex"
                  flexDirection="column"
                >
                  {tab.visualizations.length === 1 ? (
                    // Single visualization - constrain to available height
                    <Box 
                      w="100%" 
                      flex="1" 
                      minH="0"
                      overflow="hidden"
                      display="flex"
                      flexDirection="column"
                    >
                      <Visualization
                        key={tab.visualizations[0].id}
                        visualization={tab.visualizations[0]}
                        section={section}
                      />
                    </Box>
                  ) : tab.gridEnabled ? (
                    // Grid layout for multiple visualizations - constrain height
                    <Grid
                      w="100%"
                      flex="1"
                      minH="0"
                      templateColumns={`repeat(${tab.gridColumns || 2}, 1fr)`}
                      templateRows={`repeat(${tab.gridRows || 2}, 1fr)`}
                      gap={`${tab.gridSpacing || 4}px`}
                      overflow="hidden"
                    >
                      {tab.visualizations.map((visualization) => (
                        <GridItem
                          key={visualization.id}
                          colSpan={visualization.columns || 1}
                          rowSpan={visualization.rows || 1}
                          w="100%"
                          h="100%"
                          minH="0"
                          overflow="hidden"
                          bg={visualization.properties?.["layout.bg"] || "transparent"}
                          display="flex"
                          flexDirection="column"
                        >
                          <Box
                            flex="1"
                            minH="0"
                            w="100%"
                            overflow="hidden"
                            display="flex"
                            flexDirection="column"
                          >
                            <Visualization
                              visualization={visualization}
                              section={section}
                            />
                          </Box>
                        </GridItem>
                      ))}
                    </Grid>
                  ) : (
                    // Stack layout for multiple visualizations (fallback) - constrain height
                    <Stack
                      direction={tab.visualizations.length > 2 ? "column" : "row"}
                      spacing={4}
                      flex="1"
                      minH="0"
                      w="100%"
                      overflow="hidden"
                    >
                      {tab.visualizations.map((visualization) => (
                        <Box 
                          key={visualization.id}
                          flex="1" 
                          minH="0"
                          w="100%"
                          overflow="hidden"
                          display="flex"
                          flexDirection="column"
                        >
                          <Visualization
                            visualization={visualization}
                            section={section}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              );

              // No animations - simple display toggle
              if (!enableAnimations || animationType === "none") {
                return (
                  <Box
                    key={tab.id}
                    position="absolute"
                    top={0}
                    left={0}
                    w="100%"
                    h="100%"
                    overflow="hidden"
                  >
                    {TabContent}
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
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          overflow="hidden"
                        >
                          {TabContent}
                        </Box>
                      </Fade>
                    );

                  case "scale":
                    return (
                      <ScaleFade
                        in={isActive}
                        initialScale={0.9}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          overflow="hidden"
                        >
                          {TabContent}
                        </Box>
                      </ScaleFade>
                    );

                  case "slide":
                    const isGoingForward = tabIndex > previousTabIndex || (tabIndex === 0 && previousTabIndex === tabsToDisplay.length - 1);
                    const slideDirection = isGoingForward ? "right" : "left";
                    
                    return (
                      <Slide
                        in={isActive}
                        direction={slideDirection}
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          overflow="hidden"
                        >
                          {TabContent}
                        </Box>
                      </Slide>
                    );

                  default:
                    return (
                      <Box
                        key={tab.id}
                        position="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        overflow="hidden"
                        opacity={isActive ? 1 : 0}
                        transition={`opacity ${animationDuration}ms ease-in-out`}
                      >
                        {TabContent}
                      </Box>
                    );
                }
              };

              return (
                <React.Fragment key={tab.id}>
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
