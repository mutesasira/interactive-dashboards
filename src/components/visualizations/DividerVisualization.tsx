import React from "react";
import { Divider as ChakraDivider } from "@chakra-ui/react";

interface DividerProps {
    color?: string;
    thickness?: number;
    length?: number;
}

const DividerVisualization: React.FC<DividerProps> = ({
    color = "gray.300",
    thickness = 1,
    length = 100,
}) => (
        <ChakraDivider
            borderColor={color}
            borderWidth={`${thickness}px`}
            width={`${length}%`}
            orientation="horizontal"
            my={2}
        />
    );

export default DividerVisualization;
