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
  Code,
  Spinner,
} from "@chakra-ui/react";
import {
  FiExternalLink,
  FiCopy,
  FiChevronDown,
  FiChevronRight,
  FiSave,
  FiCheck,
} from "react-icons/fi";
import { useStore } from "effector-react";
import { $dashboards, $store, $settings } from "../../Store";
import { useDashboards } from "../../Queries";
import { dashboardsApi } from "../../Events";

// Configuration interface
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

// Local storage key
const CONFIG_KEY = 'public_dashboards_config';

const WorkingPublicDashboards: React.FC = () => {
  const dashboards = useStore($dashboards);
  const store = useStore($store);
  const settings = useStore($settings);
  const toast = useToast();

  // Load dashboards
  const { data: dashboardsData, isLoading: dashboardsLoading } = useDashboards(settings.storage, settings.systemId);
  
  // Configuration state
  const [config, setConfig] = useState<PublicConfig>({
    baseDomain: window.location.origin,
    publicDashboards: {}
  });
  
  const [expandedDashboards, setExpandedDashboards] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        console.log("Loaded configuration:", parsed);
      } catch (error) {
        console.error("Error loading configuration:", error);
      }
    }
  }, []);

  // Update store when dashboards are loaded - avoid infinite loops
  useEffect(() => {
    if (dashboardsData && dashboardsData.length > 0 && dashboards.length !== dashboardsData.length) {
      dashboardsApi.setDashboards(dashboardsData);
    }
  }, [dashboardsData]);

  // Save configuration to localStorage and backend
  const saveConfiguration = async () => {
    try {
      // Save to localStorage immediately
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      console.log("Configuration saved:", config);
      
      // TODO: Also save to backend API
      // await fetch('/api/public-config', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // });

      setHasUnsavedChanges(false);
      toast({
        title: "Configuration Saved",
        description: "Your public dashboard settings have been saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Save Error",
        description: "Failed to save configuration. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Generate simple slug from dashboard name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'dashboard';
  };

  // Update configuration and mark as unsaved
  const updateConfig = (updates: Partial<PublicConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Toggle dashboard public status
  const togglePublicStatus = (dashboardId: string, dashboard: any) => {
    const currentPublic = config.publicDashboards[dashboardId];
    const isCurrentlyPublic = currentPublic?.isPublic || false;
    const newSlug = currentPublic?.slug || generateSlug(dashboard.name || `dashboard-${dashboardId}`);
    
    updateConfig({
      publicDashboards: {
        ...config.publicDashboards,
        [dashboardId]: {
          isPublic: !isCurrentlyPublic,
          slug: newSlug,
          allowedVisualizationIds: currentPublic?.allowedVisualizationIds || [],
          name: dashboard.name || `Dashboard ${dashboardId}`,
        }
      }
    });

    toast({
      title: !isCurrentlyPublic ? "Dashboard Made Public" : "Dashboard Made Private",
      description: !isCurrentlyPublic 
        ? `${dashboard.name} will be publicly accessible after saving`
        : `${dashboard.name} will no longer be public after saving`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Update dashboard slug
  const updateSlug = (dashboardId: string, newSlug: string) => {
    const current = config.publicDashboards[dashboardId];
    if (current) {
      updateConfig({
        publicDashboards: {
          ...config.publicDashboards,
          [dashboardId]: {
            ...current,
            slug: newSlug,
          }
        }
      });
    }
  };

  // Update allowed visualizations
  const updateAllowedVisualizations = (dashboardId: string, visualizationIds: string[]) => {
    const current = config.publicDashboards[dashboardId];
    if (current) {
      updateConfig({
        publicDashboards: {
          ...config.publicDashboards,
          [dashboardId]: {
            ...current,
            allowedVisualizationIds: visualizationIds,
          }
        }
      });
    }
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

  // Copy public link
  const copyPublicLink = (slug: string) => {
    const publicUrl = `${config.baseDomain}/public/${slug}`;
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
  const getPublicUrl = (slug: string) => `${config.baseDomain}/public/${slug}`;

  // Count public dashboards
  const publicCount = Object.values(config.publicDashboards).filter(pd => pd.isPublic).length;

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
        <HStack justify="space-between">
          <Box>
            <Text fontSize="2xl" fontWeight="bold" mb={2}>
              Public Dashboard Configuration
            </Text>
            <Text color="gray.600">
              Configure your domain and select which dashboards to make public
            </Text>
          </Box>
          
          {/* Save Button */}
          <VStack>
            <Button
              leftIcon={<FiSave />}
              colorScheme={hasUnsavedChanges ? "blue" : "green"}
              onClick={saveConfiguration}
              isDisabled={!hasUnsavedChanges}
              size="lg"
            >
              {hasUnsavedChanges ? "Save Changes" : "Saved"}
            </Button>
            {hasUnsavedChanges && (
              <Text fontSize="xs" color="orange.500" textAlign="center">
                You have unsaved changes
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Domain Configuration */}
        <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" overflow="hidden">
          <Box p={4} borderBottom="1px" borderColor="gray.200">
            <Text fontSize="lg" fontWeight="semibold">🌐 Public Domain Configuration</Text>
          </Box>
          <Box p={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Base Domain for Public Links</FormLabel>
              <Input
                value={config.baseDomain}
                onChange={(e) => updateConfig({ baseDomain: e.target.value })}
                placeholder="https://your-domain.com"
                size="lg"
              />
              <Text fontSize="sm" color="gray.600" mt={2}>
                This domain will be used for all public dashboard links. 
                Example: <Code>{config.baseDomain}/public/dashboard-name</Code>
              </Text>
            </FormControl>
          </Box>
        </Box>

        {/* Configuration Summary */}
        <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" p={4}>
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Badge colorScheme="blue" fontSize="md" p={2}>
                📊 {dashboards.length} Total Dashboards
              </Badge>
              <Badge colorScheme="green" fontSize="md" p={2}>
                🌐 {publicCount} Public
              </Badge>
              <Badge colorScheme="gray" fontSize="md" p={2}>
                🔒 {dashboards.length - publicCount} Private
              </Badge>
            </HStack>
            {publicCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiExternalLink />}
                onClick={() => {
                  const firstPublic = Object.values(config.publicDashboards).find(pd => pd.isPublic);
                  if (firstPublic) {
                    window.open(getPublicUrl(firstPublic.slug), '_blank');
                  }
                }}
              >
                Test Public Link
              </Button>
            )}
          </HStack>
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
              <Text fontSize="lg" fontWeight="semibold">📋 Dashboard Configuration</Text>
            </Box>
            <Box>
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
                    const publicState = config.publicDashboards[dashboard.id];
                    const isPublic = publicState?.isPublic || false;
                    const slug = publicState?.slug || generateSlug(dashboard.name || `dashboard-${dashboard.id}`);
                    const isExpanded = expandedDashboards.has(dashboard.id);
                    const visualizations = dashboard.sections?.flatMap(s => s.visualizations) || [];

                    return (
                      <React.Fragment key={dashboard.id}>
                        <Tr bg={isPublic ? "green.50" : "transparent"}>
                          <Td>
                            <HStack>
                              <IconButton
                                aria-label="Configure"
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
                                <Code fontSize="xs" colorScheme="blue" p={1}>
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
                                <Tooltip label="Test public link">
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
                              <Box p={6} bg="gray.50" borderTop="1px" borderColor="gray.200">
                                <VStack align="stretch" spacing={4}>
                                  {/* URL Slug Configuration */}
                                  <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">🔗 Public URL</FormLabel>
                                    <HStack>
                                      <Text fontSize="sm" color="gray.600" minW="fit-content">
                                        {config.baseDomain}/public/
                                      </Text>
                                      <Input
                                        value={slug}
                                        onChange={(e) => updateSlug(dashboard.id, e.target.value)}
                                        size="sm"
                                        placeholder="dashboard-name"
                                        bg="white"
                                      />
                                    </HStack>
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                      Use letters, numbers, and hyphens only. This will be your shareable link.
                                    </Text>
                                  </FormControl>

                                  {/* Visualization Selection */}
                                  {visualizations.length > 0 && (
                                    <FormControl>
                                      <FormLabel fontSize="sm" fontWeight="bold">
                                        📊 Public Visualizations ({publicState?.allowedVisualizationIds?.length || 0}/{visualizations.length} selected)
                                      </FormLabel>
                                      <Text fontSize="xs" color="gray.600" mb={3}>
                                        Choose which charts/visualizations to show publicly. If none selected, all will be shown.
                                      </Text>
                                      <CheckboxGroup
                                        value={publicState?.allowedVisualizationIds || []}
                                        onChange={(values) => updateAllowedVisualizations(dashboard.id, values as string[])}
                                      >
                                        <Stack direction="column" spacing={3} maxH="200px" overflowY="auto" bg="white" p={3} borderRadius="md">
                                          {visualizations.map((viz) => (
                                            <Checkbox key={viz.id} value={viz.id} size="sm">
                                              <HStack justify="space-between" w="full">
                                                <VStack align="start" spacing={0}>
                                                  <Text fontSize="sm" fontWeight="medium">
                                                    {viz.name || "Untitled Visualization"}
                                                  </Text>
                                                  <Text fontSize="xs" color="gray.500">
                                                    Type: {viz.type || "Unknown"} • ID: {viz.id.slice(0, 8)}...
                                                  </Text>
                                                </VStack>
                                              </HStack>
                                            </Checkbox>
                                          ))}
                                        </Stack>
                                      </CheckboxGroup>
                                    </FormControl>
                                  )}

                                  {/* Status Display */}
                                  {isPublic && (
                                    <Alert status="success" size="sm">
                                      <AlertIcon />
                                      <Box>
                                        <AlertTitle fontSize="sm">✅ Ready to Share!</AlertTitle>
                                        <AlertDescription fontSize="xs">
                                          <strong>Public URL:</strong> {getPublicUrl(slug)}
                                          <br />
                                          <strong>Visualizations:</strong> {publicState?.allowedVisualizationIds?.length || visualizations.length} will be shown
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
          </Box>
        )}

        {/* Instructions */}
        <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" p={4}>
          <Text fontSize="sm" fontWeight="bold" mb={3}>📋 How to Use:</Text>
          <VStack align="start" spacing={2} fontSize="sm" color="gray.700">
            <Text><strong>1. Set Domain:</strong> Enter your public domain URL at the top</Text>
            <Text><strong>2. Toggle Dashboards:</strong> Use switches to make dashboards public/private</Text>
            <Text><strong>3. Configure:</strong> Click arrows to customize URLs and select visualizations</Text>
            <Text><strong>4. Save:</strong> Click "Save Changes" to apply your configuration</Text>
            <Text><strong>5. Share:</strong> Copy the public links and share them with anyone</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default WorkingPublicDashboards;