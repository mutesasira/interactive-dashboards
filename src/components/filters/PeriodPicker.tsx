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

    // Get button label based on selected periods
    const getButtonLabel = () => {
        if (selectedPeriods.length === 0) {
            return "Select Period";
        } else if (selectedPeriods.length === 1) {
            return selectedPeriods[0].label;
        } else if (selectedPeriods.length <= 3) {
            return selectedPeriods.map(p => p.label).join(", ");
        } else {
            return `${selectedPeriods.slice(0, 2).map(p => p.label).join(", ")} +${selectedPeriods.length - 2}`;
        }
    };

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
        <Stack position="relative" flex={1} spacing={1} alignItems="center">
            <Button
                ref={buttonRef}
                onClick={onToggle}
                minW="200px"
                maxW="400px"
                size="sm"
                variant="outline"
                colorScheme={selectedPeriods.length > 0 ? "green" : "blue"}
                _hover={{ bg: "none" }}
                justifyContent="center"
                textAlign="center"
            >
                <Text 
                    fontSize="sm"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    w="100%"
                >
                    {getButtonLabel()}
                </Text>
            </Button>

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
