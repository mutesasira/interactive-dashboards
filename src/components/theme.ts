// import { extendTheme } from "@chakra-ui/react";

// const theme = extendTheme({
//     components: {
//         Button: {
//             baseStyle: {
//                 _focus: {
//                     boxShadow: "none",
//                 },
//             },
//             defaultProps: {
//                 size: "sm",
//             },
//         },
//     },
//     styles: {
//         global: {
//             body: {
//                 // bg: "gray.50",
//                 // boxSizing: "border-box",
//                 // position: "relative",
//                 p: "0",
//                 m: "0",
//             },
//         },
//     },
//     fonts: {
//         heading: `'Open Sans', sans-serif`,
//         body: `'Raleway', sans-serif`,
//     },
// });

// export default theme;

import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    components: {
        Button: {
            baseStyle: {
                _focus: {
                    boxShadow: "none",
                },
            },
            defaultProps: {
                size: "sm",
            },
        },
    },
    styles: {
        global: {
            body: {
                p: "0",
                m: "0",
            },
            // hide resize handles by default
            ".react-resizable-handle": {
                opacity: 0,
                transition: "opacity 0.15s ease-in-out",
            },
            // show them when hovering over the grid item
            ".react-grid-item:hover .react-resizable-handle": {
                opacity: 1,
            },
        },
    },
    fonts: {
        heading: `'Open Sans', sans-serif`,
        body: `'Raleway', sans-serif`,
    },
});

export default theme;
