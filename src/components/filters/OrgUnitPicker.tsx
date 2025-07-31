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
    const buttonRef = useRef<HTMLButtonElement>(null);

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

    const getModalPosition = () => {
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const modalWidth = 500;
            const modalHeight = 400;
            
            let top = buttonRect.bottom + 8;
            let left = buttonRect.left;
            
            // Adjust if modal would go off the right edge of screen
            if (left + modalWidth > window.innerWidth) {
                left = window.innerWidth - modalWidth - 16;
            }
            
            // Adjust if modal would go off the bottom edge of screen
            if (top + modalHeight > window.innerHeight) {
                top = buttonRect.top - modalHeight - 8;
            }
            
            // Ensure minimum margins
            left = Math.max(16, left);
            top = Math.max(16, top);
            
            return { top, left };
        }
        return { top: "50%", left: "50%" };
    };

    return (
        <Stack position="relative" flex={1} spacing={1}>
            <Flex align="center">
                <Button
                    ref={buttonRef}
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
                                +{hiddenNames.length} more
                            </Badge>
                        </Tooltip>
                    )}
                </Flex>
            </Flex>

            {isOpen && (
                <Box
                    ref={ref}
                    position="fixed"
                    top={`${getModalPosition().top}px`}
                    left={`${getModalPosition().left}px`}
                    bg="white"
                    boxShadow="2xl"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    w="500px"
                    maxH="400px"
                    zIndex={10000}
                    overflow="hidden"
                >
                    <Box px="3" py="2" textAlign="right" borderBottom="1px solid" borderColor="gray.200" bg="gray.50">
                        <Text fontSize="md" fontWeight="semibold" float="left" mt="1">
                            Select Organization Units
                        </Text>
                        <Button
                            size="xs"
                            colorScheme="gray"
                            variant="ghost"
                            onClick={onClose}
                        >
                            ✕
                        </Button>
                    </Box>
                    <Box p="3" overflow="auto" maxH="340px">
                        <OUTree
                            value={selectedIds}
                            onChange={(items) => {
                                storeApi.setOrganisations(items);
                                // Don't auto-close to allow multiple selections
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Stack>
    );
}

