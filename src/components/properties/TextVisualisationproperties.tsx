import React, { ChangeEvent, useRef } from "react";
import { IVisualization } from "../../interfaces";
import {
    Stack,
    Text,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Button
} from "@chakra-ui/react";
import { sectionApi } from "../../Events";
import ColorProperty from "./ColorProperty";

export default function TextVisualisationProperties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    const textRef = useRef<HTMLInputElement>(null);

    const props = visualization.properties || {};
    const currentText = (props["data.text"] as string) || "";
    const currentSize = (props["data.height"] as number) || 20;
    const currentWeight = (props["data.fontWeight"] as number) || 400;
    const currentAlign = (props["data.align"] as string) || "left";

    return (
        <Stack spacing={4}>

            {/* 1) Text Content */}
            <Stack>
                <Text>Text Content</Text>
                <Input
                    ref={textRef}
                    value={currentText}
                    placeholder="Enter your message..."
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.text",
                            value: e.target.value,
                        })
                    }
                />
            </Stack>

            {/* 2) Font Size */}
            <Stack>
                <Text>Font Size (px)</Text>
                <NumberInput
                    value={currentSize}
                    min={8}
                    max={200}
                    step={1}
                    onChange={(_, val) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.height",
                            value: val,
                        })
                    }
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Stack>

            {/* 3) Font Weight */}
            <Stack>
                <Text>Font Weight</Text>
                <NumberInput
                    value={currentWeight}
                    min={100}
                    max={900}
                    step={100}
                    onChange={(_, val) =>
                        sectionApi.changeVisualizationProperties({
                            visualization: visualization.id,
                            attribute: "data.fontWeight",
                            value: val,
                        })
                    }
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Stack>

            {/* 4) Text Color */}
            <Stack>
                <Text>Text Color</Text>
                <ColorProperty
                    visualization={visualization}
                    title=""
                    attribute="data.color"
                />
            </Stack>

            {/* 5) Alignment */}
            <Stack>
                <Text>Alignment</Text>
                <Stack direction="row" spacing={2}>
                    {["left", "center", "right"].map((align) => (
                        <Button
                            key={align}
                            size="sm"
                            variant={currentAlign === align ? "solid" : "outline"}
                            onClick={() =>
                                sectionApi.changeVisualizationProperties({
                                    visualization: visualization.id,
                                    attribute: "data.align",
                                    value: align,
                                })
                            }
                        >
                            {align.charAt(0).toUpperCase() + align.slice(1)}
                        </Button>
                    ))}
                </Stack>
            </Stack>
        </Stack>
    );
}
