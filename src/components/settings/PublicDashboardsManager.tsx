import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Tooltip,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Collapse,
  Checkbox,
  CheckboxGroup,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Code,
  Spinner,
} from "@chakra-ui/react";
import {
  FiExternalLink,
  FiCopy,
  FiSettings,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { useStore } from "effector-react";
import { $dashboards, $store } from "../../Store";
import { useDashboards } from "../../Queries";
import { dashboardsApi } from "../../Events";

interface PublicDashboardState {
  [dashboardId: string]: {
    isPublic: boolean;
    slug: string;
    allowedVisualizationIds: string[];
    customDomain?: string;
  };
}

const PublicDashboardsManager: React.FC = () => {
  const dashboards = useStore($dashboards);
  const store = useStore($store);
  const toast = useToast();

  // Load dashboards
  const { data: dashboardsData, isLoading: dashboardsLoading } = useDashboards();
  const [publicDashboards, setPublicDashboards] = useState<PublicDashboardState>({});
  const [expandedDashboards, setExpandedDashboards] = useState<Set<string>>(new Set());
  const [baseDomain, setBaseDomain] = useState("http://localhost:3000");

  // Update store when dashboards are loaded
  useEffect(() => {
    if (dashboardsData && dashboardsData.length > 0) {
      dashboardsApi.setDashboards(dashboardsData);
    }
  }, [dashboardsData]);

  // Generate simple slug from dashboard name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Toggle dashboard public status
  const togglePublicStatus = (dashboardId: string, dashboard: any) => {
    const isCurrentlyPublic = publicDashboards[dashboardId]?.isPublic || false;
    const newSlug = generateSlug(dashboard.name || `dashboard-${dashboardId}`);
    
    setPublicDashboards(prev => ({
      ...prev,
      [dashboardId]: {
        isPublic: !isCurrentlyPublic,
        slug: prev[dashboardId]?.slug || newSlug,
        allowedVisualizationIds: prev[dashboardId]?.allowedVisualizationIds || [],
        customDomain: prev[dashboardId]?.customDomain,
      }
    }));

    toast({
      title: !isCurrentlyPublic ? "Dashboard Made Public" : "Dashboard Made Private",
      description: !isCurrentlyPublic 
        ? `${dashboard.name} is now publicly accessible`
        : `${dashboard.name} is no longer public`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Toggle dashboard expansion
  const toggleExpansion = (dashboardId: string) => {
    setExpandedDashboards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dashboardId)) {
        newSet.delete(dashboardId);
      } else {
        newSet.add(dashboardId);
      }
      return newSet;
    });
  };

  // Update allowed visualizations
  const updateAllowedVisualizations = (dashboardId: string, visualizationIds: string[]) => {
    setPublicDashboards(prev => ({
      ...prev,
      [dashboardId]: {
        ...prev[dashboardId],
        allowedVisualizationIds: visualizationIds,
      }
    }));
  };

  // Copy public link
  const copyPublicLink = (slug: string) => {
    const publicUrl = `${baseDomain}/public/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Link Copied!",
      description: "Public dashboard link copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Get public URL
  const getPublicUrl = (slug: string) => `${baseDomain}/public/${slug}`;

  if (!store.isAdmin) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You need administrator privileges to manage public dashboards.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Public Dashboards
          </Text>
          <Text color="gray.600" mb={4}>
            Make your dashboards publicly accessible with a simple toggle. No complex setup required.
          </Text>
          
          {/* Base Domain Configuration */}
          <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold">Base Domain for Public Links</FormLabel>
              <Input
                value={baseDomain}
                onChange={(e) => setBaseDomain(e.target.value)}
                placeholder="https://your-domain.com"
                size="sm"
                bg="white"
              />
              <Text fontSize="xs" color="gray.600" mt={1}>
                This will be used as the base URL for all public dashboard links
              </Text>
            </FormControl>
          </Box>
        </Box>

        {/* Loading State */}
        {dashboardsLoading && (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" color="blue.500" />
            <Text mt={4} color="gray.600">Loading your dashboards...</Text>
          </Box>
        )}

        {/* No Dashboards */}
        {!dashboardsLoading && dashboards.length === 0 && (
          <Alert status="info">
            <AlertIcon />
            <AlertTitle>No Dashboards Found</AlertTitle>
            <AlertDescription>
              Create some dashboards first to make them publicly accessible.
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard List */}
        {dashboards.length > 0 && (
          <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" overflow="hidden">
            <Box p={4} borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="semibold">
                  Your Dashboards ({dashboards.length})
                </Text>
                <Badge colorScheme="blue" variant="subtle">
                  {Object.values(publicDashboards).filter(pd => pd.isPublic).length} Public
                </Badge>
              </HStack>
            </Box>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th width="40%">Dashboard</Th>
                  <Th width="15%">Status</Th>
                  <Th width="30%">Public Link</Th>
                  <Th width="15%">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {dashboards.map((dashboard) => {
                  const publicState = publicDashboards[dashboard.id];
                  const isPublic = publicState?.isPublic || false;
                  const slug = publicState?.slug || generateSlug(dashboard.name || `dashboard-${dashboard.id}`);
                  const isExpanded = expandedDashboards.has(dashboard.id);
                  const visualizations = dashboard.sections?.flatMap(s => s.visualizations) || [];

                  return (
                    <React.Fragment key={dashboard.id}>
                      <Tr>
                        <Td>
                          <HStack>
                            <IconButton
                              aria-label="Expand"
                              icon={isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpansion(dashboard.id)}
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{dashboard.name}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {visualizations.length} visualizations
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Switch
                              isChecked={isPublic}
                              onChange={() => togglePublicStatus(dashboard.id, dashboard)}
                              colorScheme="green"
                            />
                            <Badge colorScheme={isPublic ? "green" : "gray"} size="sm">
                              {isPublic ? "Public" : "Private"}
                            </Badge>
                          </HStack>
                        </Td>
                        <Td>
                          {isPublic ? (
                            <HStack>
                              <Code fontSize="xs" colorScheme="blue">
                                /public/{slug}
                              </Code>
                              <Tooltip label="Copy link">
                                <IconButton
                                  aria-label="Copy link"
                                  icon={<FiCopy />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => copyPublicLink(slug)}
                                />
                              </Tooltip>
                            </HStack>
                          ) : (
                            <Text fontSize="sm" color="gray.400">
                              Not public
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <HStack>
                            {isPublic && (
                              <Tooltip label="Open public link">
                                <IconButton
                                  aria-label="Open public link"
                                  icon={<FiExternalLink />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(getPublicUrl(slug), '_blank')}
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </Td>
                      </Tr>

                      {/* Expanded Configuration */}
                      <Tr>
                        <Td colSpan={4} p={0}>
                          <Collapse in={isExpanded}>
                            <Box p={4} bg="gray.50" borderTop="1px" borderColor="gray.200">
                              <VStack align="stretch" spacing={4}>
                                {/* URL Slug */}
                                <FormControl>
                                  <FormLabel fontSize="sm">URL Slug</FormLabel>
                                  <HStack>
                                    <Text fontSize="sm" color="gray.600">{baseDomain}/public/</Text>
                                    <Input
                                      value={slug}
                                      onChange={(e) => setPublicDashboards(prev => ({
                                        ...prev,
                                        [dashboard.id]: {
                                          ...prev[dashboard.id],
                                          slug: e.target.value,
                                        }
                                      }))}
                                      size="sm"
                                      placeholder="dashboard-name"
                                    />
                                  </HStack>
                                  <Text fontSize="xs" color="gray.500" mt={1}>
                                    Use letters, numbers, and hyphens only
                                  </Text>
                                </FormControl>

                                {/* Visualization Selection */}
                                {visualizations.length > 0 && (
                                  <FormControl>
                                    <FormLabel fontSize="sm">
                                      Public Visualizations ({publicState?.allowedVisualizationIds?.length || 0} selected)
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.600" mb={2}>
                                      Choose which visualizations to show publicly. Leave empty to show all.
                                    </Text>
                                    <CheckboxGroup
                                      value={publicState?.allowedVisualizationIds || []}
                                      onChange={(values) => updateAllowedVisualizations(dashboard.id, values as string[])}
                                    >
                                      <Stack direction="column" spacing={2} maxH="150px" overflowY="auto">
                                        {visualizations.map((viz) => (
                                          <Checkbox key={viz.id} value={viz.id} size="sm">
                                            <Text fontSize="sm">
                                              {viz.name || "Untitled"} 
                                              <Text as="span" color="gray.500" ml={2}>
                                                ({viz.type})
                                              </Text>
                                            </Text>
                                          </Checkbox>
                                        ))}
                                      </Stack>
                                    </CheckboxGroup>
                                  </FormControl>
                                )}

                                {/* Status Info */}
                                {isPublic && (
                                  <Alert status="success" size="sm">
                                    <AlertIcon />
                                    <Box>
                                      <AlertTitle fontSize="sm">Dashboard is Public!</AlertTitle>
                                      <AlertDescription fontSize="xs">
                                        Share this link: {getPublicUrl(slug)}
                                      </AlertDescription>
                                    </Box>
                                  </Alert>
                                )}
                              </VStack>
                            </Box>
                          </Collapse>
                        </Td>
                      </Tr>
                    </React.Fragment>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Quick Guide */}
        <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
          <Text fontSize="sm" fontWeight="bold" mb={2}>📋 How it works:</Text>
          <VStack align="start" spacing={1} fontSize="sm" color="gray.700">
            <Text>1. <strong>Toggle Switch</strong>: Turn any dashboard public or private instantly</Text>
            <Text>2. <strong>Custom URL</strong>: Click the arrow to customize the public link</Text>
            <Text>3. <strong>Select Visualizations</strong>: Choose which charts to show publicly</Text>
            <Text>4. <strong>Share</strong>: Copy the link and share it with anyone</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default PublicDashboardsManager;