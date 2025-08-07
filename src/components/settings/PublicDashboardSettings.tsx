import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Textarea,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { FiEye, FiEyeOff, FiSave, FiRefreshCw } from "react-icons/fi";
import { IPublicSettings } from "../../interfaces";
import { useStore } from "effector-react";
import { $store } from "../../Store";

const PublicDashboardSettings: React.FC = () => {
  const store = useStore($store);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<IPublicSettings>({
    enabled: false,
    baseDomain: "",
    serviceAccountUsername: "",
    serviceAccountPassword: "",
    allowedOrigins: [],
    defaultExpiration: 30,
  });
  const [allowedOriginsText, setAllowedOriginsText] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/public-settings");
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned non-JSON response. Check if backend routes are properly configured.");
      }
      
      const data = await response.json();
      setSettings(data);
      setAllowedOriginsText(data.allowedOrigins?.join("\n") || "");
    } catch (error) {
      console.error("Failed to load settings:", error);
      
      // Provide more helpful error messages
      let errorMessage = "Failed to load public dashboard settings";
      if (error.message.includes("non-JSON response")) {
        errorMessage = "Backend API not configured. Please check the setup documentation.";
      } else if (error.message.includes("fetch")) {
        errorMessage = "Unable to connect to API. Please ensure the development server is running.";
      }
      
      toast({
        title: "Configuration Error",
        description: errorMessage,
        status: "warning",
        duration: 10000,
        isClosable: true,
      });
      
      // Set default values for development
      setSettings({
        enabled: false,
        baseDomain: "http://localhost:3000",
        serviceAccountUsername: "",
        serviceAccountPassword: "",
        allowedOrigins: ["http://localhost:3000"],
        defaultExpiration: 30,
      });
      setAllowedOriginsText("http://localhost:3000");
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (settings.enabled) {
      if (!settings.baseDomain.trim()) {
        newErrors.baseDomain = "Base domain is required when public dashboards are enabled";
      } else if (!isValidUrl(settings.baseDomain)) {
        newErrors.baseDomain = "Please enter a valid domain (e.g., https://public.myorg.org)";
      }

      if (!settings.serviceAccountUsername.trim()) {
        newErrors.serviceAccountUsername = "Service account username is required";
      }

      if (!settings.serviceAccountPassword.trim()) {
        newErrors.serviceAccountPassword = "Service account password is required";
      }

      if (settings.defaultExpiration && (settings.defaultExpiration < 1 || settings.defaultExpiration > 365)) {
        newErrors.defaultExpiration = "Default expiration must be between 1 and 365 days";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateSettings()) return;

    try {
      setLoading(true);
      const origins = allowedOriginsText
        .split("\n")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

      const settingsToSave = {
        ...settings,
        allowedOrigins: origins,
      };

      // TODO: Replace with actual API call
      const response = await fetch("/api/public-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToSave),
      });

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Public dashboard settings have been updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save public dashboard settings",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call to test DHIS2 connection
      const response = await fetch("/api/test-public-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: settings.serviceAccountUsername,
          password: settings.serviceAccountPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Service account can successfully connect to DHIS2",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error("Connection failed");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect with the provided service account credentials",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!store.isAdmin) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You need administrator privileges to access public dashboard settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Box p={6} maxW="4xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Public Dashboard Settings
          </Text>
          <Text color="gray.600">
            Configure public access to dashboards and visualizations without requiring DHIS2 login
          </Text>
        </Box>

        <Box bg="white" borderRadius="md" border="1px" borderColor="gray.200" overflow="hidden">
          <Box p={4} borderBottom="1px" borderColor="gray.200">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold">
                Public Dashboard Access
              </Text>
              <Badge colorScheme={settings.enabled ? "green" : "gray"}>
                {settings.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </HStack>
          </Box>
          <Box p={4}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <HStack justify="space-between">
                  <Box>
                    <FormLabel>Enable Public Dashboards</FormLabel>
                    <FormHelperText>
                      Allow public access to selected dashboards without authentication
                    </FormHelperText>
                  </Box>
                  <Switch
                    isChecked={settings.enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, enabled: e.target.checked })
                    }
                    size="lg"
                  />
                </HStack>
              </FormControl>

              {settings.enabled && (
                <>
                  <Divider />
                  
                  <FormControl isInvalid={!!errors.baseDomain}>
                    <FormLabel>Base Domain</FormLabel>
                    <Input
                      value={settings.baseDomain}
                      onChange={(e) =>
                        setSettings({ ...settings, baseDomain: e.target.value })
                      }
                      placeholder="https://public.myorg.org"
                    />
                    {errors.baseDomain ? (
                      <FormErrorMessage>{errors.baseDomain}</FormErrorMessage>
                    ) : (
                      <FormHelperText>
                        Domain that will be used as prefix for all public dashboard links
                      </FormHelperText>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel>Default Expiration (Days)</FormLabel>
                    <Input
                      type="number"
                      value={settings.defaultExpiration || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultExpiration: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="30"
                      min={1}
                      max={365}
                    />
                    <FormHelperText>
                      Default number of days before public links expire (leave empty for no expiration)
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Allowed Origins</FormLabel>
                    <Textarea
                      value={allowedOriginsText}
                      onChange={(e) => setAllowedOriginsText(e.target.value)}
                      placeholder="https://mywebsite.com&#10;https://subdomain.example.org"
                      rows={4}
                    />
                    <FormHelperText>
                      One origin per line. These domains can embed public dashboards in iframes
                    </FormHelperText>
                  </FormControl>
                </>
              )}
            </VStack>
          </Box>
        </Box>

        {settings.enabled && (
          <Box bg="white" borderRadius="md" border="1px" borderColor="gray.200" overflow="hidden">
            <Box p={4} borderBottom="1px" borderColor="gray.200">
              <Text fontSize="lg" fontWeight="semibold">
                Service Account Configuration
              </Text>
            </Box>
            <Box p={4}>
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Security Notice</AlertTitle>
                    <AlertDescription>
                      Create a dedicated DHIS2 user account with read-only access to approved dashboards. 
                      Never use admin credentials here.
                    </AlertDescription>
                  </Box>
                </Alert>

                <FormControl isInvalid={!!errors.serviceAccountUsername}>
                  <FormLabel>Service Account Username</FormLabel>
                  <Input
                    value={settings.serviceAccountUsername}
                    onChange={(e) =>
                      setSettings({ ...settings, serviceAccountUsername: e.target.value })
                    }
                    placeholder="public-dashboard-service"
                  />
                  {errors.serviceAccountUsername && (
                    <FormErrorMessage>{errors.serviceAccountUsername}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.serviceAccountPassword}>
                  <FormLabel>Service Account Password</FormLabel>
                  <HStack>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={settings.serviceAccountPassword}
                      onChange={(e) =>
                        setSettings({ ...settings, serviceAccountPassword: e.target.value })
                      }
                      placeholder="Enter secure password"
                    />
                    <Tooltip label={showPassword ? "Hide password" : "Show password"}>
                      <IconButton
                        aria-label="Toggle password visibility"
                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="outline"
                      />
                    </Tooltip>
                  </HStack>
                  {errors.serviceAccountPassword && (
                    <FormErrorMessage>{errors.serviceAccountPassword}</FormErrorMessage>
                  )}
                </FormControl>

                <HStack>
                  <Button
                    leftIcon={<FiRefreshCw />}
                    variant="outline"
                    onClick={testConnection}
                    isLoading={loading}
                    isDisabled={!settings.serviceAccountUsername || !settings.serviceAccountPassword}
                  >
                    Test Connection
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Box>
        )}

        <HStack justify="flex-end">
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            onClick={handleSave}
            isLoading={loading}
            loadingText="Saving..."
          >
            Save Settings
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default PublicDashboardSettings;