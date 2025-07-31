import { Stack, Text } from "@chakra-ui/react";
import { IVisualization } from "../../interfaces";
import ColorProperty from "./ColorProperty";
import NumberProperty from "./NumberProperty";
import SelectProperty from "./SelectProperty";
import SwitchProperty from "./SwitchProperty";
import TextProperty from "./TextProperty";

export default function MultiTitleGaugeProperties({
    visualization,
}: {
    visualization: IVisualization;
}) {
    return (
        <Stack spacing="20px">
            {/* Title Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Title Settings</Text>
            
            <TextProperty
                title="Title"
                attribute="data.title"
                visualization={visualization}
            />

            <TextProperty
                title="Subtitle" 
                attribute="data.subTitle"
                visualization={visualization}
            />

            <ColorProperty
                title="Title Color"
                attribute="data.title.color"
                visualization={visualization}
            />

            <NumberProperty
                title="Title Font Size"
                attribute="data.title.fontSize"
                visualization={visualization}
                min={10}
                max={36}
                step={1}
            />

            <SelectProperty
                title="Title Font Weight"
                attribute="data.title.fontWeight"
                visualization={visualization}
                options={[
                    { label: "Normal", value: "normal" },
                    { label: "Bold", value: "bold" },
                    { label: "Bolder", value: "bolder" },
                    { label: "Lighter", value: "lighter" }
                ]}
            />

            {/* Layout Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Layout Settings</Text>
            
            <ColorProperty
                title="Background Color"
                attribute="layout.backgroundColor"
                visualization={visualization}
            />

            {/* Gauge Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Gauge Settings</Text>
            
            <TextProperty
                title="Gauge Radius"
                attribute="data.gauge.radius"
                visualization={visualization}
            />

            <NumberProperty
                title="Start Angle"
                attribute="data.gauge.startAngle"
                visualization={visualization}
                min={0}
                max={360}
                step={1}
            />

            <NumberProperty
                title="End Angle"
                attribute="data.gauge.endAngle"
                visualization={visualization}
                min={-360}
                max={360}
                step={1}
            />

            <SwitchProperty
                title="Clockwise"
                attribute="data.gauge.clockwise"
                visualization={visualization}
            />

            <NumberProperty
                title="Minimum Value"
                attribute="data.gauge.min"
                visualization={visualization}
                min={-1000}
                max={1000}
                step={1}
            />

            <NumberProperty
                title="Maximum Value"
                attribute="data.gauge.max"
                visualization={visualization}
                min={0}
                max={10000}
                step={1}
            />

            <NumberProperty
                title="Split Number"
                attribute="data.gauge.splitNumber"
                visualization={visualization}
                min={1}
                max={50}
                step={1}
            />

            {/* Axis Line Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Axis Line Settings</Text>
            
            <SwitchProperty
                title="Show Axis Line"
                attribute="data.axisLine.show"
                visualization={visualization}
            />

            <NumberProperty
                title="Axis Line Width"
                attribute="data.axisLine.lineStyle.width"
                visualization={visualization}
                min={1}
                max={100}
                step={1}
            />

            {/* Split Line Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Split Line Settings</Text>
            
            <SwitchProperty
                title="Show Split Lines"
                attribute="data.splitLine.show"
                visualization={visualization}
            />

            <NumberProperty
                title="Split Line Length"
                attribute="data.splitLine.length"
                visualization={visualization}
                min={1}
                max={100}
                step={1}
            />

            <NumberProperty
                title="Split Line Width"
                attribute="data.splitLine.lineStyle.width"
                visualization={visualization}
                min={1}
                max={20}
                step={1}
            />

            <ColorProperty
                title="Split Line Color"
                attribute="data.splitLine.lineStyle.color"
                visualization={visualization}
            />

            {/* Axis Tick Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Axis Tick Settings</Text>
            
            <SwitchProperty
                title="Show Axis Ticks"
                attribute="data.axisTick.show"
                visualization={visualization}
            />

            <NumberProperty
                title="Tick Length"
                attribute="data.axisTick.length"
                visualization={visualization}
                min={1}
                max={50}
                step={1}
            />

            <NumberProperty
                title="Tick Width"
                attribute="data.axisTick.lineStyle.width"
                visualization={visualization}
                min={1}
                max={10}
                step={1}
            />

            <ColorProperty
                title="Tick Color"
                attribute="data.axisTick.lineStyle.color"
                visualization={visualization}
            />

            {/* Axis Label Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Axis Label Settings</Text>
            
            <SwitchProperty
                title="Show Axis Labels"
                attribute="data.axisLabel.show"
                visualization={visualization}
            />

            <ColorProperty
                title="Label Color"
                attribute="data.axisLabel.color"
                visualization={visualization}
            />

            <NumberProperty
                title="Label Font Size"
                attribute="data.axisLabel.fontSize"
                visualization={visualization}
                min={8}
                max={24}
                step={1}
            />

            <NumberProperty
                title="Label Distance"
                attribute="data.axisLabel.distance"
                visualization={visualization}
                min={0}
                max={100}
                step={1}
            />

            {/* Pointer Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Pointer Settings</Text>
            
            <SwitchProperty
                title="Show Pointer"
                attribute="data.pointer.show"
                visualization={visualization}
            />

            <TextProperty
                title="Pointer Length"
                attribute="data.pointer.length"
                visualization={visualization}
            />

            <NumberProperty
                title="Pointer Width"
                attribute="data.pointer.width"
                visualization={visualization}
                min={1}
                max={20}
                step={1}
            />

            <ColorProperty
                title="Pointer Color"
                attribute="data.pointer.itemStyle.color"
                visualization={visualization}
            />

            {/* Progress Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Progress Settings</Text>
            
            <SwitchProperty
                title="Show Progress"
                attribute="data.progress.show"
                visualization={visualization}
            />

            <NumberProperty
                title="Progress Width"
                attribute="data.progress.width"
                visualization={visualization}
                min={1}
                max={50}
                step={1}
            />

            <ColorProperty
                title="Progress Color"
                attribute="data.progress.itemStyle.color"
                visualization={visualization}
            />

            {/* Anchor Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Anchor Settings</Text>
            
            <SwitchProperty
                title="Show Anchor"
                attribute="data.anchor.show"
                visualization={visualization}
            />

            <NumberProperty
                title="Anchor Size"
                attribute="data.anchor.size"
                visualization={visualization}
                min={1}
                max={20}
                step={1}
            />

            <ColorProperty
                title="Anchor Color"
                attribute="data.anchor.itemStyle.color"
                visualization={visualization}
            />

            {/* Detail Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Detail Settings</Text>
            
            <SwitchProperty
                title="Show Detail"
                attribute="data.detail.show"
                visualization={visualization}
            />

            <NumberProperty
                title="Detail Font Size"
                attribute="data.detail.fontSize"
                visualization={visualization}
                min={8}
                max={60}
                step={1}
            />

            <SelectProperty
                title="Detail Font Weight"
                attribute="data.detail.fontWeight"
                visualization={visualization}
                options={[
                    { label: "Normal", value: "normal" },
                    { label: "Bold", value: "bold" },
                    { label: "Bolder", value: "bolder" },
                    { label: "Lighter", value: "lighter" }
                ]}
            />

            <ColorProperty
                title="Detail Color"
                attribute="data.detail.color"
                visualization={visualization}
            />

            <TextProperty
                title="Detail Format"
                attribute="data.detail.formatter"
                visualization={visualization}
            />

            {/* Animation Properties */}
            <Text fontWeight="bold" fontSize="md" color="blue.600">Animation Settings</Text>
            
            <NumberProperty
                title="Animation Duration (ms)"
                attribute="data.animation.duration"
                visualization={visualization}
                min={0}
                max={5000}
                step={100}
            />

            <SelectProperty
                title="Animation Easing"
                attribute="data.animation.easing"
                visualization={visualization}
                options={[
                    { label: "Linear", value: "linear" },
                    { label: "Cubic Out", value: "cubicOut" },
                    { label: "Cubic In", value: "cubicIn" },
                    { label: "Cubic In Out", value: "cubicInOut" },
                    { label: "Quad Out", value: "quadOut" },
                    { label: "Quad In", value: "quadIn" },
                    { label: "Bounce Out", value: "bounceOut" },
                    { label: "Elastic Out", value: "elasticOut" }
                ]}
            />
        </Stack>
    );
}