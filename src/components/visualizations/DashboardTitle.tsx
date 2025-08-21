import { useStore } from "effector-react";
import React from "react";
import { $dashboard } from "../../Store";
import { Stack, Text } from "@chakra-ui/react";
import { ChartProps } from "../../interfaces";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function DashboardTitle({ visualization }: ChartProps) {
    const dashboard = useStore($dashboard);
    const { data: currentUser, isLoading } = useCurrentUser();
    
    const titleType = visualization.properties.titleType || "manual";
    const customTitle = visualization.properties.customTitle || "";
    const dynamicText = visualization.properties.dynamicText || "";
    const textPosition = visualization.properties.textPosition || "before";
    
    const getTitleText = () => {
        if (titleType === "dynamic" && currentUser) {
            const userName = currentUser.displayName || `${currentUser.firstName || ''} ${currentUser.surname || ''}`.trim() || currentUser.name;
            
            if (dynamicText) {
                if (textPosition === "after") {
                    return `${userName} ${dynamicText}`;
                } else {
                    // Default to "before"
                    return `${dynamicText} ${userName}`;
                }
            }
            
            return userName;
        }
        
        if (titleType === "manual" && customTitle) {
            return customTitle;
        }
        
        // Fallback to dashboard name
        return dashboard.name;
    };
    
    const titleText = getTitleText();
    
    return (
        <Stack justifyContent="center">
            {(titleText || isLoading) && (
                <Text
                    // fontSize="4xl"
                    // fontWeight="bold"
                    // color="blue.400"
                    {...visualization.properties}
                >
                    {isLoading && titleType === "dynamic" ? "Loading..." : titleText}
                </Text>
            )}
            {dashboard.tag && (
                <Text fontSize="2xl" color="blue.400">
                    {dashboard.tag}
                </Text>
            )}
        </Stack>
    );
}
