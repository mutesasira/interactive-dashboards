import React, { useRef } from "react";
import {
    Stack,
    Button,
    Text,
    useDisclosure,
    useOutsideClick,
    Box,
    Flex,
    Badge,
    Tooltip,
} from "@chakra-ui/react";
import { useStore } from "effector-react";
import { useLiveQuery } from "dexie-react-hooks";
import { storeApi } from "../../Events";
import { $store } from "../../Store";
import OUTree from "../OUTree";
import { db } from "../../db";

export default function OrgUnitPicker() {
    const { isOpen, onToggle, onClose } = useDisclosure();
    const store = useStore($store);
    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick({ ref, handler: onClose });

    const selectedIds = store.organisations;

    const selectedNodes =
        useLiveQuery(
            () => db.organisations.where("id").anyOf(selectedIds || []).toArray(),
            [selectedIds]
        ) || [];

    const names = selectedNodes.map((n) =>
        typeof n.title === "string" ? n.title : String(n.title)
    );

    const MAX_VISIBLE = 3;
    const visibleNames = names.slice(0, MAX_VISIBLE);
    const hiddenNames = names.slice(MAX_VISIBLE);
    const hasHidden = hiddenNames.length > 0;
    const hiddenTooltip = hiddenNames.join(", ");

    return (
        <Stack position="relative" flex={1} spacing={1}>
            <Flex align="center">
                <Button
                    onClick={onToggle}
                    w="200px"
                    size="md"
                    variant="outline"
                    colorScheme="blue"
                    _hover={{ bg: "none" }}
                >
                    <Text>Organisation Unit</Text>
                </Button>

                <Flex
                    ml={2}
                    wrap="nowrap"
                    overflow="hidden"
                    align="center"
                    flex="1"
                    minW={0}
                >
                    {visibleNames.map((name, idx) => (
                        <Tooltip key={idx} label={name} hasArrow>
                            <Badge
                                colorScheme="blue"
                                variant="subtle"
                                px={2}
                                py={1}
                                mr={2}
                                maxW="120px"
                                whiteSpace="nowrap"
                                overflow="hidden"
                                textOverflow="ellipsis"
                            >
                                {name}
                            </Badge>
                        </Tooltip>
                    ))}

                    {hasHidden && (
                        <Tooltip label={hiddenTooltip} hasArrow>
                            <Badge
                                colorScheme="gray"
                                variant="outline"
                                px={2}
                                py={1}
                                title={hiddenTooltip}
                            >
                            </Badge>
                        </Tooltip>
                    )}
                </Flex>
            </Flex>

            {isOpen && (
                <Box
                    ref={ref}
                    position="absolute"
                    top="calc(100% + 4px)"
                    right={0}
                    bg="white"
                    boxShadow="xl"
                    minW="300px"
                    zIndex={9999}
                >
                    <OUTree
                        value={selectedIds}
                        onChange={(items) => {
                            storeApi.setOrganisations(items);
                            onClose();
                        }}
                    />
                </Box>
            )}
        </Stack>
    );
}

