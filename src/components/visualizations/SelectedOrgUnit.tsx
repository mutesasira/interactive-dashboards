import React from "react";
import { Badge, Box, Text } from "@chakra-ui/react";
import { useStore } from "effector-react";
import { $store } from "../../Store";

export default function SelectedOrgUnit() {
    const store = useStore($store);

    if (!store.selectedOrgUnitName) {
        return null;
    }

    return (
        <Box>
            {/* <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                Selected Organization
            </Text> */}
            <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                {store.selectedOrgUnitName}
            </Badge>
        </Box>
    );
}