import React from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Image,
  Container,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiHome } from "react-icons/fi";

const PublicNotFound: React.FC = () => {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="md" py={16}>
        <Box bg={cardBg} borderRadius="lg" p={8} textAlign="center" boxShadow="md">
          <VStack spacing={6}>
            {/* 404 Illustration */}
            <Box fontSize="6xl" color="blue.500">
              🔍
            </Box>
            
            <VStack spacing={3}>
              <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                Dashboard Not Found
              </Text>
              <Text color="gray.600" fontSize="lg">
                The public dashboard you're looking for doesn't exist or is no longer available.
              </Text>
            </VStack>

            <VStack spacing={2} fontSize="sm" color="gray.500">
              <Text>This could happen if:</Text>
              <VStack spacing={1} align="start" pl={4}>
                <Text>• The dashboard link has expired</Text>
                <Text>• The dashboard has been made private</Text>
                <Text>• The URL slug has been changed</Text>
                <Text>• Public dashboards have been disabled</Text>
              </VStack>
            </VStack>

            <Button
              leftIcon={<FiHome />}
              colorScheme="blue"
              onClick={handleGoHome}
              size="lg"
            >
              Go to Main Site
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicNotFound;