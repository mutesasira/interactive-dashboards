import { Box, SimpleGrid, Stack, useDisclosure } from "@chakra-ui/react";
import { useStore } from "effector-react";
import { MouseEvent } from "react";
import Marquee from "react-marquee-slider";
import {
    Menu,
    Item,
    Separator,
    Submenu,
    useContextMenu,
} from "react-contexify";
import { sectionApi } from "../Events";
import { ISection } from "../interfaces";
import { $store, isOpenApi, $dashboard } from "../Store";
import Carousel from "./visualizations/Carousel";
import TabPanelVisualization from "./visualizations/TabPanelVisualization";
import VisualizationSection from "./visualizations/Visualization";
import { useState, useEffect } from "react";
import VisualizationTitle from "./visualizations/VisualizationTitle";
import VisualizationMenu from "./visualizations/VisualizationMenu";
import ListMenu from "./visualizations/ListMenu";

import "react-contexify/dist/ReactContexify.css";
import FullScreen from "./FullScreen";
import DHIS2Viz from "./visualizations/DHIS2Viz";
// import { FullScreen } from "react-full-screen";

const SectionVisualization = (section: ISection) => {
    const { show } = useContextMenu({
        id: section.id,
    });
    const store = useStore($store);

    function handleItemClick({ event, props, triggerEvent, data }: any) {
        console.log(event, props, triggerEvent, data);
    }

    function displayMenu(e: any) {
        show({
            event: e,
        });
    }
    const displays = {
        carousel: <Carousel {...section} />,
        marquee: (
            <Stack
                key={section.id}
                bg={section.bg}
                alignContent="center"
                alignItems="center"
                justifyContent="center"
                justifyItems="center"
                w="100%"
                h="100%"
                onClick={(e: MouseEvent<HTMLElement>) => {
                    if (e.detail === 2 && store.isAdmin) {
                        sectionApi.setCurrentSection(section);
                        isOpenApi.onOpen();
                    }
                }}
            >
                <Stack w="100%">
                    <Marquee
                        velocity={60}
                        direction="rtl"
                        onFinish={() => {}}
                        resetAfterTries={200}
                        scatterRandomly={false}
                        onInit={() => {}}
                    >
                        {section.visualizations.map((visualization) => (
                            <Stack direction="row" key={visualization.id}>
                                <VisualizationSection
                                    section={section}
                                    key={visualization.id}
                                    visualization={visualization}
                                />
                                <Box w="70px">&nbsp;</Box>
                            </Stack>
                        ))}
                    </Marquee>
                </Stack>
            </Stack>
        ),
        grid: (
            <Stack
                h="100%"
                w="100%"
                bg={section.bg}
                spacing={0}
                alignItems="center"
                alignContent="center"
                justifyContent="center"
                justifyItems="center"
                key={section.id}
            >
                {section.title && (
                    <VisualizationTitle
                        section={section}
                        title={section.title}
                    />
                )}
                <SimpleGrid columns={2} h="100%" w="100%" flex={1} spacing="0">
                    {section.visualizations.map((visualization, i) => (
                        <VisualizationSection
                            key={visualization.id}
                            visualization={visualization}
                            section={section}
                        />
                    ))}
                </SimpleGrid>
            </Stack>
        ),
        normal: (
            <Stack h="100%" w="100%" spacing={0} key={section.id} flex={1}>
                {section.title && (
                    <VisualizationTitle
                        section={section}
                        title={section.title}
                    />
                )}
                <Stack
                    alignItems={section.alignItems}
                    justifyContent={section.justifyContent || "space-around"}
                    direction={section.direction}
                    w="100%"
                    h="100%"
                    bg={section.bg}
                    spacing={section.spacing}
                    p={section.padding}
                >
                    {section.visualizations.map((visualization) => (
                        <VisualizationSection
                            key={visualization.id}
                            visualization={visualization}
                            section={section}
                        />
                    ))}
                </Stack>
            </Stack>
        ),
        tab: <TabPanelVisualization {...section} />,
    };

    const {
        isOpen: isFull,
        onOpen: onFull,
        onClose: onUnFull,
    } = useDisclosure();
    const displayFull = () => {
        onFull();
    };

    return (
        <Stack onContextMenu={displayMenu} w="100%" h="100%">
            {displays[section.display] || displays.normal}
            <Menu id={section.id}>
                <Item
                    onClick={() => {
                        sectionApi.setCurrentSection(section);
                        isOpenApi.onOpen();
                    }}
                >
                    Edit
                </Item>
                <Item onClick={() => displayFull()}>Expand</Item>
                <Separator />
                <Item disabled>Disabled</Item>
                <Separator />
                <Submenu label="Submenu">
                    <Item onClick={handleItemClick}>Sub Item 1</Item>
                    <Item onClick={handleItemClick}>Sub Item 2</Item>
                </Submenu>
            </Menu>

            <FullScreen section={section} onUnFull={onUnFull} isFull={isFull} />
        </Stack>
    );
};

export default SectionVisualization;
