import { Box, Button, Stack, Text, useDisclosure, Badge, Flex, Tooltip, useOutsideClick } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
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

    // Function to resolve period to exact dates/years
    const getExactPeriod = (period: Period) => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const currentDate = new Date();
        
        // Handle relative periods
        if (period.type === "relative") {
            switch (period.value) {
                case "THIS_YEAR":
                    return `${currentYear}`;
                case "LAST_YEAR":
                    return `${currentYear - 1}`;
                case "LAST_2_YEARS":
                    return `${currentYear - 2}-${currentYear - 1}`;
                case "LAST_3_YEARS":
                    return `${currentYear - 3}-${currentYear - 1}`;
                case "LAST_5_YEARS":
                    return `${currentYear - 5}-${currentYear - 1}`;
                case "LAST_10_YEARS":
                    return `${currentYear - 10}-${currentYear - 1}`;
                case "THIS_MONTH":
                    return `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
                case "LAST_MONTH":
                    const lastMonth = new Date(currentYear, currentMonth - 2);
                    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
                case "LAST_3_MONTHS":
                    const threeMonthsAgo = new Date(currentYear, currentMonth - 4);
                    const lastMonthEnd = new Date(currentYear, currentMonth - 2);
                    return `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')} to ${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, '0')}`;
                case "LAST_6_MONTHS":
                    const sixMonthsAgo = new Date(currentYear, currentMonth - 7);
                    const lastMonthEnd6 = new Date(currentYear, currentMonth - 2);
                    return `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')} to ${lastMonthEnd6.getFullYear()}-${String(lastMonthEnd6.getMonth() + 1).padStart(2, '0')}`;
                case "LAST_12_MONTHS":
                    const twelveMonthsAgo = new Date(currentYear, currentMonth - 13);
                    const lastMonthEnd12 = new Date(currentYear, currentMonth - 2);
                    return `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')} to ${lastMonthEnd12.getFullYear()}-${String(lastMonthEnd12.getMonth() + 1).padStart(2, '0')}`;
                case "THIS_QUARTER":
                    const currentQuarter = Math.ceil(currentMonth / 3);
                    return `Q${currentQuarter} ${currentYear}`;
                case "LAST_QUARTER":
                    const lastQuarter = currentMonth <= 3 ? 4 : Math.ceil((currentMonth - 3) / 3);
                    const lastQuarterYear = currentMonth <= 3 ? currentYear - 1 : currentYear;
                    return `Q${lastQuarter} ${lastQuarterYear}`;
                case "THIS_WEEK":
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    return `${startOfWeek.toISOString().split('T')[0]} to ${endOfWeek.toISOString().split('T')[0]}`;
                case "LAST_WEEK":
                    const lastWeekEnd = new Date(currentDate);
                    lastWeekEnd.setDate(currentDate.getDate() - currentDate.getDay() - 1);
                    const lastWeekStart = new Date(lastWeekEnd);
                    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
                    return `${lastWeekStart.toISOString().split('T')[0]} to ${lastWeekEnd.toISOString().split('T')[0]}`;
                default:
                    return period.label;
            }
        }
        
        // Handle fixed periods - use startDate and endDate if available
        if (period.type === "fixed" && period.startDate && period.endDate) {
            if (period.startDate === period.endDate) {
                return period.startDate;
            }
            return `${period.startDate} to ${period.endDate}`;
        }
        
        // Fallback to label
        return period.label;
    };

    // Get button label with exact periods
    const getButtonLabel = () => {
        if (selectedPeriods.length === 0) {
            return "Select Period";
        } else if (selectedPeriods.length === 1) {
            const period = selectedPeriods[0];
            const exactPeriod = getExactPeriod(period);
            return period.label === exactPeriod ? period.label : `${period.label} (${exactPeriod})`;
        } else if (selectedPeriods.length <= 2) {
            return selectedPeriods.map(p => {
                const exactPeriod = getExactPeriod(p);
                return p.label === exactPeriod ? p.label : `${p.label} (${exactPeriod})`;
            }).join(", ");
        } else {
            return `${selectedPeriods.length} periods selected`;
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
                minW="250px"
                maxW="500px"
                size="sm"
                variant="outline"
                colorScheme={selectedPeriods.length > 0 ? "green" : "blue"}
                _hover={{ 
                    bg: selectedPeriods.length > 0 ? "green.50" : "blue.50",
                    borderColor: selectedPeriods.length > 0 ? "green.300" : "blue.300"
                }}
                _active={{
                    bg: selectedPeriods.length > 0 ? "green.100" : "blue.100"
                }}
                justifyContent="space-between"
                textAlign="left"
                pr={2}
                rightIcon={
                    <ChevronDownIcon 
                        transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"} 
                        transition="transform 0.2s"
                        color={selectedPeriods.length > 0 ? "green.600" : "blue.600"}
                    />
                }
            >
                <Flex align="center" flex={1} minW={0}>
                    {selectedPeriods.length > 0 && (
                        <Badge
                            colorScheme="green"
                            size="sm"
                            mr={2}
                            borderRadius="full"
                            px={2}
                        >
                            {selectedPeriods.length}
                        </Badge>
                    )}
                    <Text 
                        fontSize="sm"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        flex={1}
                        fontWeight={selectedPeriods.length > 0 ? "medium" : "normal"}
                    >
                        {getButtonLabel()}
                    </Text>
                </Flex>
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
