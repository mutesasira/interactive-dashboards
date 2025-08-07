import React from "react";
import {
  Box,
  ChakraProvider,
  ColorModeScript,
  theme,
} from "@chakra-ui/react";
import { ReactLocation, Router, Route, createHashHistory } from "@tanstack/react-location";
import PublicDashboardView from "./PublicDashboardView";
import PublicNotFound from "./PublicNotFound";

const history = createHashHistory();
const location = new ReactLocation({ history });

/**
 * Public Layout Component
 * 
 * This layout is used for public dashboard views that don't require DHIS2 authentication.
 * It's completely separate from the main app layout and authentication flow.
 */
const PublicLayout: React.FC = () => {
  const routes: Route[] = [
    {
      path: "/public/:slug",
      element: <PublicDashboardView />,
    },
    {
      path: "/public",
      element: <PublicNotFound />,
    },
    {
      path: "*",
      element: <PublicNotFound />,
    },
  ];

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Box minH="100vh">
          <Router location={location} routes={routes} />
        </Box>
      </ChakraProvider>
    </>
  );
};

export default PublicLayout;