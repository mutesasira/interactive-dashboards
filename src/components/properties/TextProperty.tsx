import { Input, Stack, Text } from "@chakra-ui/react";
import { ChangeEvent } from "react";
import { sectionApi } from "../../Events";
import { VizProps } from "../../interfaces";

export default function TextProperty({
    visualization,
    attribute,
    title,
    disabled,
    placeholder,
}: VizProps & { disabled?: boolean; placeholder?: string }) {
    return (
        <Stack>
            <Text>{title}</Text>
            <Input
                value={visualization.properties[attribute] || ""}
                placeholder={placeholder}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    sectionApi.changeVisualizationProperties({
                        visualization: visualization.id,
                        attribute: attribute,
                        value: e.target.value,
                    })
                }
                isDisabled={disabled}
                size="sm"
            />
        </Stack>
    );
}
