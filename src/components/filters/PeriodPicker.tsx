import { Box, Button, Stack, Text, useDisclosure, Badge, Flex, Tooltip, useOutsideClick } from "@chakra-ui/react";
import { useStore } from "effector-react";
import { useRef } from "react";
import { storeApi } from "../../Events";
import { $store } from "../../Store";
import { Period } from "../../interfaces";
import PeriodSelector from "./PeriodSelector";

const PeriodPicker = () => {
    const { isOpen, onToggle, onClose } = useDisclosure();
    const store = useStore($store);
    const ref = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useOutsideClick({ ref, handler: onClose });

    const selectedPeriods = store.periods || [];

    const onChangePeriods = (periods: Period[]) => {
        storeApi.changePeriods(periods);
    };

    const MAX_VISIBLE = 3;
    const visiblePeriods = selectedPeriods.slice(0, MAX_VISIBLE);
    const hiddenPeriods = selectedPeriods.slice(MAX_VISIBLE);
    const hasHidden = hiddenPeriods.length > 0;
    const hiddenTooltip = hiddenPeriods.map(p => p.label).join(", ");

    const getModalPosition = () => {
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const modalWidth = 850;
            const modalHeight = 500;
            
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
                    <Text>Period</Text>
                </Button>

                <Flex
                    ml={2}
                    wrap="nowrap"
                    overflow="hidden"
                    align="center"
                    flex="1"
                    minW={0}
                >
                    {visiblePeriods.map((period, idx) => (
                        <Tooltip key={idx} label={period.label} hasArrow>
                            <Badge
                                colorScheme="green"
                                variant="subtle"
                                px={2}
                                py={1}
                                mr={2}
                                maxW="120px"
                                whiteSpace="nowrap"
                                overflow="hidden"
                                textOverflow="ellipsis"
                            >
                                {period.label}
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
                                +{hiddenPeriods.length} more
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
                    backgroundColor="white"
                    boxShadow="2xl"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    w="850px"
                    maxH="500px"
                    zIndex={10000}
                    overflow="hidden"
                >
                    <Box px="3" py="2" textAlign="right" borderBottom="1px solid" borderColor="gray.200" bg="gray.50">
                        <Text fontSize="md" fontWeight="semibold" float="left" mt="1">
                            Select Periods
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
                    <Box p="3" overflow="auto" maxH="440px">
                        <PeriodSelector
                            selectedPeriods={selectedPeriods}
                            onChange={onChangePeriods}
                        />
                    </Box>
                </Box>
            )}
        </Stack>
    );
};

export default PeriodPicker;
