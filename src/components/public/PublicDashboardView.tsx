import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useColorModeValue,
  Container,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { useMatch } from "@tanstack/react-location";
import { FiRefreshCw, FiShield, FiArrowLeft } from "react-icons/fi";
import { useStore } from "effector-react";
import { $dashboards, $settings } from "../../Store";
import { useDashboards } from "../../Queries";
import { dashboardsApi } from "../../Events";
import SectionVisualization from "../SectionVisualization";

interface PublicConfig {
  baseDomain: string;
  publicDashboards: {
    [dashboardId: string]: {
      isPublic: boolean;
      slug: string;
      allowedVisualizationIds: string[];
      name: string;
    };
  };
}

const CONFIG_KEY = 'public_dashboards_config';

const PublicDashboardView: React.FC = () => {
  const match = useMatch();
  const slug = match.params.slug;
  const dashboards = useStore($dashboards);
  const settings = useStore($settings);
  const [publicDashboard, setPublicDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  // Load dashboards
  const { data: dashboardsData, isLoading: dashboardsLoading } = useDashboards(settings.storage, settings.systemId);

  useEffect(() => {
    if (dashboardsData && dashboardsData.length > 0 && dashboards.length !== dashboardsData.length) {
      dashboardsApi.setDashboards(dashboardsData);
    }
  }, [dashboardsData]);

  useEffect(() => {
    if (slug && dashboards.length > 0) {
      loadPublicDashboard();
    }
  }, [slug, dashboards]);

  const loadPublicDashboard = () => {
    try {
      setLoading(true);
      setError(null);

      // Get configuration from localStorage
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (!savedConfig) {
        throw new Error('Public dashboard configuration not found');
      }

      const config: PublicConfig = JSON.parse(savedConfig);
      
      // Find the dashboard by slug
      const publicDashboardEntry = Object.entries(config.publicDashboards).find(
        ([_, pd]) => pd.slug === slug && pd.isPublic
      );

      if (!publicDashboardEntry) {
        throw new Error('Dashboard not found or not publicly available');
      }

      const [dashboardId, publicConfig] = publicDashboardEntry;
      const dashboard = dashboards.find(d => d.id === dashboardId);

      if (!dashboard) {
        throw new Error('Dashboard data not found');
      }

      // Filter visualizations if specific ones are allowed
      const filteredDashboard = {
        ...dashboard,
        sections: dashboard.sections?.map(section => ({
          ...section,
          visualizations: publicConfig.allowedVisualizationIds.length > 0
            ? section.visualizations?.filter(viz => 
                publicConfig.allowedVisualizationIds.includes(viz.id)
              ) || []
            : section.visualizations || []
        })) || []
      };

      setPublicDashboard(filteredDashboard);
    } catch (err) {
      console.error('Error loading public dashboard:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadPublicDashboard();
  };

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Container maxW="7xl" py={8}>
          <Flex justify="center" align="center" minH="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text>Loading dashboard...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Container maxW="4xl" py={8}>
          <VStack spacing={6} align="center">
            <Alert status="error" borderRadius="md" maxW="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
            <Button onClick={() => loadPublicDashboard()} colorScheme="blue" variant="outline">
              Try Again
            </Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!publicDashboard) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Container maxW="4xl" py={8}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Dashboard Not Available</AlertTitle>
              <AlertDescription>
                The requested dashboard could not be found or is no longer available.
              </AlertDescription>
            </Box>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Header */}
      <Box bg={cardBg} borderBottom="1px" borderColor="gray.200" py={4} px={6}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <HStack>
                <Text fontSize="2xl" fontWeight="bold">
                  {publicDashboard.name}
                </Text>
                <Badge colorScheme="blue" variant="subtle">
                  <HStack spacing={1}>
                    <FiShield size={12} />
                    <Text fontSize="xs">Public</Text>
                  </HStack>
                </Badge>
              </HStack>
              {publicDashboard.description && (
                <Text color="gray.600" fontSize="sm">
                  {publicDashboard.description}
                </Text>
              )}
            </VStack>
            
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={refreshData}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Dashboard Content */}
      <Container maxW="7xl" py={6}>
        {publicDashboard.sections && publicDashboard.sections.length > 0 ? (
          <VStack spacing={6} align="stretch">
            {publicDashboard.sections.map((section: any) => (
              <Box
                key={section.id}
                bg={cardBg}
                borderRadius="lg"
                border="1px"
                borderColor="gray.200"
                overflow="hidden"
                minH="400px"
              >
                <SectionVisualization section={section} />
              </Box>
            ))}
          </VStack>
        ) : (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>No Content Available</AlertTitle>
              <AlertDescription>
                This dashboard doesn't have any public content configured.
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </Container>

      {/* Footer */}
      <Box bg={cardBg} borderTop="1px" borderColor="gray.200" py={4} px={6} mt={8}>
        <Container maxW="7xl">
          <Flex justify="center" align="center">
            <Text fontSize="sm" color="gray.500">
              Powered by Interactive Dashboards
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicDashboardView;