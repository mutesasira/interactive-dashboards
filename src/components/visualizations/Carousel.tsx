import Slider, { Settings } from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { ISection } from "../../interfaces";
import Visualization from "./Visualization";
import { Stack } from "@chakra-ui/react";

const Carousel = ({
    section,
    height,
}: {
    section: ISection;
    height: number;
}) => {
    const settings: Settings = {
        dots: false,
        infinite: true,
        speed: 1000,
        slidesToShow: 1,
        autoplay: true,
        slidesToScroll: 1,
        centerMode: true,
        centerPadding: "0",
        fade: true,
        pauseOnHover: false,
        easing: "cubic-bezier",
        lazyLoad: "ondemand",
    };
    return (
        <Stack
            bg={section.bg}
            borderRadius={section?.cornerStyle || (section?.borderRadius ? `${section.borderRadius}px` : "0px")}
            w="100%"
            h="100%"
            overflow="hidden"
        >
            <Slider {...settings}>
                {section.visualizations.map((visualization) => (
                    <Stack 
                        h={`${height}px`} 
                        key={visualization.id}
                        alignItems="center"
                        justifyContent="center"
                        w="100%"
                    >
                        <Visualization
                            key={visualization.id}
                            visualization={visualization}
                            section={section}
                        />
                    </Stack>
                ))}
            </Slider>
        </Stack>
    );
};

export default Carousel;
