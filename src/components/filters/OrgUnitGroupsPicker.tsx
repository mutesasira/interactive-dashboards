import { Box, Button, Stack, Text, useDisclosure, Badge, Flex, useOutsideClick } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { GroupBase, Select } from "chakra-react-select";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "effector-react";
import { useRef } from "react";
import { db } from "../../db";
import { storeApi } from "../../Events";
import { Option } from "../../interfaces";
import { $store } from "../../Store";

const OrgUnitGroupsPicker = () => {
    const { isOpen, onToggle, onClose } = useDisclosure();
    const store = useStore($store);
    const organisations = useLiveQuery(() => db.groups.toArray()) || [];
    const ref = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useOutsideClick({ ref, handler: onClose });

    const selectedGroups = store.groups || [];
    const selectedOptions = organisations.filter(
        (pt) => selectedGroups.indexOf(String(pt.value)) !== -1
    );

    const onChangeGroups = (groups: Option[] | null) => {
        storeApi.setGroups(groups?.map((ex) => String(ex.value)) || []);
    };

    const getButtonLabel = () => {
        if (selectedOptions.length === 0) {
            return "Select Organization Unit Groups";
        } else if (selectedOptions.length === 1) {
            return selectedOptions[0].label;
        } else if (selectedOptions.length <= 2) {
            return selectedOptions.map(o => o.label).join(", ");
        } else {
            return `${selectedOptions.length} groups selected`;
        }
    };

    const getModalPosition = () => {
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const modalWidth = 400;
            const modalHeight = 300;
            
            let top = buttonRect.bottom + 8;
            let left = buttonRect.left;
            
            if (left + modalWidth > window.innerWidth) {
                left = window.innerWidth - modalWidth - 16;
            }
            
            if (top + modalHeight > window.innerHeight) {
                top = buttonRect.top - modalHeight - 8;
            }
            
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
                maxW="350px"
                size="sm"
                variant="outline"
                colorScheme={selectedOptions.length > 0 ? "green" : "blue"}
                _hover={{ 
                    bg: selectedOptions.length > 0 ? "green.50" : "blue.50",
                    borderColor: selectedOptions.length > 0 ? "green.300" : "blue.300"
                }}
                _active={{
                    bg: selectedOptions.length > 0 ? "green.100" : "blue.100"
                }}
                justifyContent="space-between"
                textAlign="left"
                pr={2}
                rightIcon={
                    <ChevronDownIcon 
                        transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"} 
                        transition="transform 0.2s"
                        color={selectedOptions.length > 0 ? "green.600" : "blue.600"}
                    />
                }
            >
                <Flex align="center" flex={1} minW={0}>
                    {selectedOptions.length > 0 && (
                        <Badge
                            colorScheme="green"
                            size="sm"
                            mr={2}
                            borderRadius="full"
                            px={2}
                        >
                            {selectedOptions.length}
                        </Badge>
                    )}
                    <Text 
                        fontSize="sm"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        flex={1}
                        fontWeight={selectedOptions.length > 0 ? "medium" : "normal"}
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
                    w="400px"
                    maxH="300px"
                    zIndex={10000}
                    overflow="hidden"
                >
                    <Box px="3" py="2" textAlign="right" borderBottom="1px solid" borderColor="gray.200" bg="gray.50">
                        <Text fontSize="md" fontWeight="semibold" float="left" mt="1">
                            Select Organization Unit Groups
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
                    <Box p="3" overflow="auto" maxH="240px">
                        <Select<Option, true, GroupBase<Option>>
                            value={selectedOptions}
                            onChange={onChangeGroups}
                            options={organisations}
                            isClearable
                            isMulti
                            placeholder="Select organization unit groups..."
                            menuIsOpen={false}
                            components={{
                                DropdownIndicator: () => null,
                                IndicatorSeparator: () => null,
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Stack>
    );
};

export default OrgUnitGroupsPicker;