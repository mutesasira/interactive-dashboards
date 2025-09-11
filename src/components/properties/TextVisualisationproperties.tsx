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
    const currentMarginTop = (props["data.marginTop"] as number) || 0;
    const currentMarginRight = (props["data.marginRight"] as number) || 0;
    const currentMarginBottom = (props["data.marginBottom"] as number) || 0;
    const currentMarginLeft = (props["data.marginLeft"] as number) || 0;

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

            {/* 6) Margins */}
            <Stack>
                <Text>Margins (px)</Text>
                
                {/* Top Margin */}
                <Stack>
                    <Text fontSize="sm">Top</Text>
                    <NumberInput
                        value={currentMarginTop}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(_, val) =>
                            sectionApi.changeVisualizationProperties({
                                visualization: visualization.id,
                                attribute: "data.marginTop",
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

                {/* Right Margin */}
                <Stack>
                    <Text fontSize="sm">Right</Text>
                    <NumberInput
                        value={currentMarginRight}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(_, val) =>
                            sectionApi.changeVisualizationProperties({
                                visualization: visualization.id,
                                attribute: "data.marginRight",
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

                {/* Bottom Margin */}
                <Stack>
                    <Text fontSize="sm">Bottom</Text>
                    <NumberInput
                        value={currentMarginBottom}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(_, val) =>
                            sectionApi.changeVisualizationProperties({
                                visualization: visualization.id,
                                attribute: "data.marginBottom",
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

                {/* Left Margin */}
                <Stack>
                    <Text fontSize="sm">Left</Text>
                    <NumberInput
                        value={currentMarginLeft}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(_, val) =>
                            sectionApi.changeVisualizationProperties({
                                visualization: visualization.id,
                                attribute: "data.marginLeft",
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
            </Stack>
        </Stack>
    );
}
