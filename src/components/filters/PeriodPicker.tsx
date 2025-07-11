import { Box, Button, Stack, Text, useDisclosure } from "@chakra-ui/react";

const PeriodPicker = () => {
    const { isOpen, onToggle } = useDisclosure();
    return (
        <Stack position="relative" flex={1}>
            <Button
                onClick={onToggle}
                w="200px"
                size="md"
                variant="outline"
                colorScheme="blue"
                _hover={{ backgroundColor: "none" }}
            >
                <Text>Period</Text>
            </Button>

            {isOpen && (
                <Stack
                    position="absolute"
                    top="48px"
                    backgroundColor="white"
                    boxShadow="xl"
                    minW="800px"
                    minH="660px"
                    maxH="660px"
                    zIndex={9999}
                >
                    <Box px="5px" alignSelf="flex-end" mb="-5px">
                        <Button
                            onClick={() => {
                                onToggle();
                            }}
                        >
                            Update
                        </Button>
                    </Box>
                </Stack>
            )}
        </Stack>
    );
};

export default PeriodPicker;
