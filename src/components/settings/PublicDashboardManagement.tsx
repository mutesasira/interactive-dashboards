import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  Spinner,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Select,
  Textarea,
  useToast,
  Badge,
  IconButton,
  Tooltip,
  Checkbox,
  CheckboxGroup,
  Stack,
  Divider,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiCopy,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useStore } from "effector-react";
import { $dashboards, $store } from "../../Store";
import { dashboardsApi } from "../../Events";
import { IPublicDashboard, IDashboard, IVisualization } from "../../interfaces";
import { useDashboards } from "../../Queries";

interface PublicDashboardFormData {
  id?: string;
  name: string;
  description: string;
  dashboardId: string;
  slug: string;
  isActive: boolean;
  allowedVisualizationIds: string[];
  customDomain: string;
  expiresAt: string;
}

const PublicDashboardManagement: React.FC = () => {
  const dashboards = useStore($dashboards);
  const store = useStore($store);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Load dashboards using the existing query hook
  const { data: dashboardsData, isLoading: dashboardsLoading, error: dashboardsError } = useDashboards();

  // Update store when dashboards are loaded
  useEffect(() => {
    if (dashboardsData && dashboardsData.length > 0) {
      dashboardsApi.setDashboards(dashboardsData);
    }
  }, [dashboardsData]);

  // Debug: Log dashboard data
  useEffect(() => {
    console.log("Available dashboards from store:", dashboards);
    console.log("Dashboards from query:", dashboardsData);
    console.log("Dashboard count:", dashboards?.length || 0);
    console.log("Loading dashboards:", dashboardsLoading);
    if (dashboardsError) {
      console.log("Dashboard loading error:", dashboardsError);
    }
  }, [dashboards, dashboardsData, dashboardsLoading, dashboardsError]);

  const [publicDashboards, setPublicDashboards] = useState<IPublicDashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<IPublicDashboard | null>(null);
  const [formData, setFormData] = useState<PublicDashboardFormData>({
    name: "",
    description: "",
    dashboardId: "",
    slug: "",
    isActive: true,
    allowedVisualizationIds: [],
    customDomain: "",
    expiresAt: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPublicDashboards();
  }, []);

  const loadPublicDashboards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/public-dashboards");
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned non-JSON response. Backend may not be configured.");
      }
      
      const data = await response.json();
      setPublicDashboards(data);
    } catch (error) {
      console.error("Failed to load public dashboards:", error);
      
      // Provide helpful error message and set empty state
      let errorMessage = "Failed to load public dashboards";
      if (error.message.includes("non-JSON response")) {
        errorMessage = "Backend API not configured. Using demo mode.";
      }
      
      toast({
        title: "Info",
        description: errorMessage,
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      
      // Set empty array for development
      setPublicDashboards([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (dashboard?: IPublicDashboard) => {
    if (dashboard) {
      setSelectedDashboard(dashboard);
      setFormData({
        id: dashboard.id,
        name: dashboard.name || "",
        description: dashboard.description || "",
        dashboardId: dashboard.dashboardId,
        slug: dashboard.slug,
        isActive: dashboard.isActive,
        allowedVisualizationIds: dashboard.allowedVisualizationIds || [],
        customDomain: dashboard.customDomain || "",
        expiresAt: dashboard.expiresAt || "",
      });
    } else {
      setSelectedDashboard(null);
      setFormData({
        name: "",
        description: "",
        dashboardId: "",
        slug: "",
        isActive: true,
        allowedVisualizationIds: [],
        customDomain: "",
        expiresAt: "",
      });
    }
    setErrors({});
    onOpen();
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.dashboardId) {
      newErrors.dashboardId = "Please select a dashboard";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "URL slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    } else if (
      publicDashboards.some(
        (pd) => pd.slug === formData.slug && pd.id !== formData.id
      )
    ) {
      newErrors.slug = "This slug is already in use";
    }

    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      newErrors.expiresAt = "Expiration date must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const url = selectedDashboard
        ? `/api/public-dashboards/${selectedDashboard.id}`
        : "/api/public-dashboards";
      const method = selectedDashboard ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: selectedDashboard ? "Updated" : "Created",
          description: `Public dashboard ${
            selectedDashboard ? "updated" : "created"
          } successfully`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onClose();
        loadPublicDashboards();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save public dashboard",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this public dashboard?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/public-dashboards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Public dashboard deleted successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        loadPublicDashboards();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete public dashboard",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const getSelectedDashboard = (dashboardId: string): IDashboard | undefined => {
    return dashboards.find((d) => d.id === dashboardId);
  };

  if (!store.isAdmin) {
    return (
      <Alert status="warning">
        <AlertIcon />
        You need administrator privileges to manage public dashboards.
      </Alert>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              Public Dashboard Management
            </Text>
            <Text color="gray.600">
              Manage public access to dashboards and create shareable links
            </Text>
            {dashboardsLoading && (
              <HStack spacing={2} mt={2}>
                <Spinner size="sm" />
                <Text fontSize="sm" color="blue.500">Loading dashboards...</Text>
              </HStack>
            )}
          </Box>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            onClick={() => openModal()}
            isDisabled={dashboards.length === 0 && !dashboardsLoading}
          >
            Add Public Dashboard
          </Button>
        </HStack>

        <Box bg="white" borderRadius="md" border="1px" borderColor="gray.200" overflow="hidden">
          <Box p={4} borderBottom="1px" borderColor="gray.200">
            <Text fontSize="lg" fontWeight="semibold">
              Public Dashboards ({publicDashboards.length})
            </Text>
          </Box>
          <Box p={4}>
            {publicDashboards.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" mb={4}>
                  No public dashboards configured yet
                </Text>
                <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => openModal()}>
                  Create First Public Dashboard
                </Button>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Dashboard</Th>
                    <Th>URL Slug</Th>
                    <Th>Status</Th>
                    <Th>Public Link</Th>
                    <Th>Expires</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {publicDashboards.map((pd) => {
                    const dashboard = getSelectedDashboard(pd.dashboardId);
                    const publicUrl = `${store.instanceBaseUrl || window.location.origin}/public/${pd.slug}`;
                    
                    return (
                      <Tr key={pd.id}>
                        <Td>
                          <Text fontWeight="medium">{pd.name}</Text>
                          {pd.description && (
                            <Text fontSize="sm" color="gray.600">
                              {pd.description}
                            </Text>
                          )}
                        </Td>
                        <Td>{dashboard?.name || "Unknown"}</Td>
                        <Td>
                          <Text fontFamily="mono" fontSize="sm">
                            /{pd.slug}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={pd.isActive ? "green" : "red"}>
                            {pd.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack>
                            <Tooltip label="Copy link">
                              <IconButton
                                aria-label="Copy link"
                                icon={<FiCopy />}
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(publicUrl)}
                              />
                            </Tooltip>
                            <Tooltip label="Open in new tab">
                              <IconButton
                                aria-label="Open in new tab"
                                icon={<FiExternalLink />}
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(publicUrl, "_blank")}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                        <Td>
                          {pd.expiresAt ? (
                            <Text fontSize="sm">
                              {new Date(pd.expiresAt).toLocaleDateString()}
                            </Text>
                          ) : (
                            <Text fontSize="sm" color="gray.500">
                              Never
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <HStack>
                            <Tooltip label="Edit">
                              <IconButton
                                aria-label="Edit"
                                icon={<FiEdit2 />}
                                size="sm"
                                variant="ghost"
                                onClick={() => openModal(pd)}
                              />
                            </Tooltip>
                            <Tooltip label="Delete">
                              <IconButton
                                aria-label="Delete"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(pd.id)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </Box>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedDashboard ? "Edit Public Dashboard" : "Create Public Dashboard"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter public dashboard name"
                />
                {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.dashboardId}>
                <FormLabel>Dashboard</FormLabel>
                <Select
                  value={formData.dashboardId}
                  onChange={(e) => setFormData({ ...formData, dashboardId: e.target.value })}
                  placeholder={
                    dashboardsLoading 
                      ? "Loading dashboards..." 
                      : dashboards.length === 0 
                        ? "No dashboards available" 
                        : "Select a dashboard"
                  }
                  disabled={dashboardsLoading || dashboards.length === 0}
                >
                  {dashboards.map((dashboard) => (
                    <option key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </option>
                  ))}
                </Select>
                {errors.dashboardId ? (
                  <FormErrorMessage>{errors.dashboardId}</FormErrorMessage>
                ) : dashboards.length === 0 && !dashboardsLoading ? (
                  <FormHelperText color="orange.500">
                    No dashboards found. Please create a dashboard first.
                  </FormHelperText>
                ) : (
                  <FormHelperText>
                    Choose which dashboard to make publicly accessible
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.slug}>
                <FormLabel>URL Slug</FormLabel>
                <InputGroup>
                  <InputLeftAddon>/public/</InputLeftAddon>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="dashboard-name"
                  />
                </InputGroup>
                {errors.slug ? (
                  <FormErrorMessage>{errors.slug}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    URL-friendly identifier (lowercase letters, numbers, hyphens only)
                  </FormHelperText>
                )}
              </FormControl>

              {formData.dashboardId && (
                <FormControl>
                  <FormLabel>Allowed Visualizations</FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Select which visualizations from the dashboard should be publicly accessible
                  </Text>
                  
                  {(() => {
                    const selectedDashboard = getSelectedDashboard(formData.dashboardId);
                    const visualizations = selectedDashboard?.sections
                      ?.flatMap((section) => section.visualizations) || [];
                    
                    if (!selectedDashboard) {
                      return (
                        <Alert status="warning" size="sm">
                          <AlertIcon />
                          Dashboard not found
                        </Alert>
                      );
                    }
                    
                    if (visualizations.length === 0) {
                      return (
                        <Alert status="info" size="sm">
                          <AlertIcon />
                          This dashboard has no visualizations
                        </Alert>
                      );
                    }
                    
                    return (
                      <CheckboxGroup
                        value={formData.allowedVisualizationIds}
                        onChange={(values) =>
                          setFormData({ ...formData, allowedVisualizationIds: values as string[] })
                        }
                      >
                        <Stack>
                          {visualizations.map((viz) => (
                            <Checkbox key={viz.id} value={viz.id}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {viz.name || "Untitled Visualization"}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  Type: {viz.type || "Unknown"} • ID: {viz.id}
                                </Text>
                              </VStack>
                            </Checkbox>
                          ))}
                        </Stack>
                      </CheckboxGroup>
                    );
                  })()}
                  
                  <FormHelperText>
                    Leave empty to allow all visualizations from the dashboard
                  </FormHelperText>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Custom Domain</FormLabel>
                <Input
                  value={formData.customDomain}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  placeholder="https://custom.domain.com"
                />
                <FormHelperText>
                  Optional custom domain to override the default base domain
                </FormHelperText>
              </FormControl>

              <FormControl isInvalid={!!errors.expiresAt}>
                <FormLabel>Expiration Date</FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
                {errors.expiresAt ? (
                  <FormErrorMessage>{errors.expiresAt}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Leave empty for no expiration
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl>
                <HStack justify="space-between">
                  <Box>
                    <FormLabel mb={0}>Active</FormLabel>
                    <FormHelperText>
                      Dashboard will only be publicly accessible when active
                    </FormHelperText>
                  </Box>
                  <Switch
                    isChecked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={loading}
              loadingText={selectedDashboard ? "Updating..." : "Creating..."}
            >
              {selectedDashboard ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PublicDashboardManagement;