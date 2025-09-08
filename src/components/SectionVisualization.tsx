import {
  Box,
  Grid,
  GridItem,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { useStore } from "effector-react";
import { Item, Menu, Separator, useContextMenu } from "react-contexify";
import "react-contexify/dist/ReactContexify.css";
import {
  AiOutlineBarChart,
  AiOutlineLineChart,
  AiOutlineNumber,
} from "react-icons/ai";
import { FaGlobeAfrica } from "react-icons/fa";
import { FaBrain } from "react-icons/fa";
import Marquee from "react-marquee-slider";
import { useElementSize } from "usehooks-ts";
import { dashboardApi, sectionApi } from "../Events";
import { ISection } from "../interfaces";
import { $dashboard, $store, isOpenApi } from "../Store";
import FullScreen from "./FullScreen";
import SectionTitle from "./SectionTitle";
import Carousel from "./visualizations/Carousel";
import TabPanelVisualization from "./visualizations/TabPanelVisualization";
import Visualization from "./visualizations/Visualization";

// Helper function to check if visualization is a map type
const isMapVisualization = (visualization: any) => {
  return visualization.type === 'map' || visualization.type === 'map2';
};

// Helper function to get container styles for visualization
const getVisualizationContainerStyles = (visualization: any, layoutMode: string) => {
  const isMap = isMapVisualization(visualization);
  const isSingleValue = visualization.type === 'single';
  const isImage = visualization.type === 'image';
  
  // Base styles for backward compatibility
  const baseStyles = {
    maxW: "100%",
    maxH: "100%",
    overflow: "hidden" as const,
  };

  // Enhanced styles for maps to fit sections properly
  if (isMap) {
    // Check for custom sizing properties (backward compatibility)
    const customWidth = visualization.properties?.["layout.width"];
    const customHeight = visualization.properties?.["layout.height"];
    const fitToSection = visualization.properties?.["layout.fitToSection"] !== false;
    
    // If custom dimensions are specified and fitToSection is disabled, use them
    if (!fitToSection && (customWidth || customHeight)) {
      return {
        ...baseStyles,
        w: customWidth || "auto",
        h: customHeight || "auto",
        display: "flex",
        alignItems: "center" as const,
        justifyContent: "center" as const,
      };
    }
    
    // Default responsive behavior for maps
    return {
      ...baseStyles,
      w: "100%",
      h: "100%",
      flex: layoutMode === 'normal' ? "1" : undefined,
      display: "flex",
      alignItems: "stretch" as const,
      justifyContent: "stretch" as const,
    };
  }

  // Special handling for single values to ensure they display properly
  if (isSingleValue) {
    return {
      ...baseStyles,
      w: "100%",
      h: "100%",
      display: "flex",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    };
  }

  // Special handling for images to ensure they display properly and maintain aspect ratio
  if (isImage) {
    return {
      ...baseStyles,
      w: "100%",
      h: "100%",
      display: "flex",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    };
  }

  return baseStyles;
};

const SectionVisualization = ({ section }: { section: ISection }) => {
  const dashboard = useStore($dashboard);
  const { show } = useContextMenu({
    id: section.id,
  });
  const [squareRef, { height }] = useElementSize();
  const store = useStore($store);


  function displayMenu(e: any) {
    show({
      event: e,
    });
  }

  const displays = {
    carousel: (
      <Stack h="100%" w="100%" spacing={0} overflow="hidden">
        <SectionTitle section={section} />
        <Box flex={1} overflow="hidden">
          <Carousel section={section} height={height} />
        </Box>
      </Stack>
    ),
    marquee: (
      <Stack
        key={section.id}
        bg={section.bg}
        w="100%"
        h="100%"
        spacing={0}
        overflow="hidden"
        borderRadius={section.cornerStyle || (section.borderRadius ? `${section.borderRadius}px` : "0px")}
        onDoubleClick={() => {
          if (store.isAdmin) {
            sectionApi.setCurrentSection(section);
            isOpenApi.onOpen();
          }
        }}
      >
        <SectionTitle section={section} />
        <Stack
          flex={1}
          alignContent="center"
          alignItems="center"
          justifyContent="center"
          justifyItems="center"
          w="100%"
          overflow="hidden"
        >
          <Stack w="100%" overflow="hidden">
            <Marquee
              velocity={section.marqueeSpeed || 50}
              direction={(() => {
                const dir = section.marqueeDirection || "left";
                // Convert our direction to marquee library format
                switch (dir) {
                  case "left": return "rtl" as any;
                  case "right": return "ltr" as any;
                  case "up": return "ttb" as any;
                  case "down": return "btt" as any;
                  default: return "rtl" as any;
                }
              })()}
              onFinish={() => { }}
              resetAfterTries={section.marqueeLoop !== false ? 200 : 1}
              scatterRandomly={false}
              onInit={() => { }}
{...(section.marqueePauseOnHover !== false ? { pauseOnHover: true } : {}) as any}
            >
              {section.visualizations.map((visualization) => {
                const gapSize = `${section.marqueeGap || 20}px`;
                return (
                  <Stack 
                    direction={section.marqueeDirection === "up" || section.marqueeDirection === "down" ? "column" : "row"} 
                    key={visualization.id}
                  >
                    <Box 
                      {...getVisualizationContainerStyles(visualization, 'marquee')}
                    >
                      <Visualization
                        section={section}
                        key={visualization.id}
                        visualization={visualization}
                      />
                    </Box>
                    <Box 
                      w={section.marqueeDirection === "up" || section.marqueeDirection === "down" ? "100%" : gapSize}
                      h={section.marqueeDirection === "up" || section.marqueeDirection === "down" ? gapSize : "auto"}
                    >
                      &nbsp;
                    </Box>
                  </Stack>
                );
              })}
            </Marquee>
          </Stack>
        </Stack>
      </Stack>
    ),
    grid: (
      <Stack
        h="100%"
        w="100%"
        bg={section.bg}
        spacing={0}
        overflow="hidden"
        borderRadius={section.cornerStyle || (section.borderRadius ? `${section.borderRadius}px` : "0px")}
      >
        <SectionTitle section={section} />
        <Grid
          flex={1}
          w="100%"
          key={section.id}
          templateColumns={`repeat(${dashboard.columns}, 1fr)`}
          templateRows={`repeat(${dashboard.rows}, 1fr)`}
          gap={`${dashboard.spacing}px`}
          overflow="hidden"
        >
          {section.visualizations.map((visualization) => {
            return (
              <GridItem
                colSpan={visualization.columns}
                rowSpan={visualization.rows}
                w="100%"
                h="100%"
                key={visualization.id}
                bgColor={visualization.properties["layout.bg"]}
                overflow="hidden"
              >
                <Box
                  {...getVisualizationContainerStyles(visualization, 'grid')}
                >
                  <Visualization
                    key={visualization.id}
                    visualization={visualization}
                    section={section}
                  />
                </Box>
              </GridItem>
            );
          })}
        </Grid>
      </Stack>
    ),
    normal: (
      <Stack
        h="100%"
        w="100%"
        spacing={0}
        key={section.id}
        flex={1}
        bg={section.bg}
        overflow="hidden"
        borderRadius={section.cornerStyle || (section.borderRadius ? `${section.borderRadius}px` : "0px")}
      >
        <SectionTitle section={section} />
        <Stack
          flex={1}
          alignItems={section.alignItems}
          justifyContent={section.justifyContent || "space-around"}
          justifyItems="center"
          direction={section.direction}
          w="100%"
          spacing={section.spacing}
          p={section.padding}
          overflow="hidden"
        >
          {section.visualizations.map((visualization) => (
            <Box 
              key={visualization.id} 
              {...getVisualizationContainerStyles(visualization, 'normal')}
            >
              <Visualization
                key={visualization.id}
                visualization={visualization}
                section={section}
              />
            </Box>
          ))}
        </Stack>
      </Stack>
    ),
    tabs: <TabPanelVisualization section={section} />,
  };

  const { isOpen: isFull, onOpen: onFull, onClose: onUnFull } = useDisclosure();
  const displayFull = () => {
    onFull();
  };

  // @ts-ignore - Complex JSX union type issue, but compiles successfully
  return (
    <Stack
      as="div"
      onContextMenu={displayMenu}
      w="100%"
      h="100%"
      spacing={0}
      ref={squareRef}
      id={section.id}
      data-testid="viz"
    >
      {displays[section.display] || displays.normal}
      <Menu id={section.id}>
        <Item
          onClick={() => {
            sectionApi.setCurrentSection(section);
            isOpenApi.onOpen();
          }}
        >
          Edit({height})
        </Item>
        <Separator />
        <Item onClick={() => displayFull()}>Full Screen</Item>
        <Separator />
        <Item
          onClick={() =>
            dashboardApi.changeVisualizationType({
              section,
              visualization: "line",
            })
          }
          icon={<AiOutlineLineChart />}
        >
          View as Line
        </Item>
        <Separator />
        <Item
          onClick={() =>
            dashboardApi.changeVisualizationType({
              section,
              visualization: "bar",
            })
          }
          icon={<AiOutlineBarChart />}
        >
          View as Column
        </Item>
        <Separator />
        <Item
          onClick={() =>
            dashboardApi.changeVisualizationType({
              section,
              visualization: "map",
            })
          }
          icon={<FaGlobeAfrica />}
        >
          View as Map
        </Item>
        <Separator />
        <Item
          onClick={() =>
            dashboardApi.changeVisualizationType({
              section,
              visualization: "single",
            })
          }
          icon={<AiOutlineNumber />}
        >
          View as Single
        </Item>
        <Separator />
        <Item
          onClick={() =>
            dashboardApi.changeVisualizationType({
              section,
              visualization: "insights2",
            })
          }
          icon={<FaBrain />}
        >
          View as AI Insights 2
        </Item>
        <Separator />
        <Item onClick={() => dashboardApi.deleteSection(section.id)}>
          Delete Section
        </Item>
        {/* <Submenu label="Submenu">
                    <Item onClick={handleItemClick}>Sub Item 1</Item>
                    <Item onClick={handleItemClick}>Sub Item 2</Item>
                </Submenu> */}
      </Menu>

      <FullScreen section={section} onUnFull={onUnFull} isFull={isFull} />
    </Stack>
  );
};

export default SectionVisualization;
