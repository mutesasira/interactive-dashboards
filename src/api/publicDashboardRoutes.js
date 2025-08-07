const express = require('express');
const cors = require('cors');
const router = express.Router();

// Only require these in production
let bcrypt, jwt, axios;
try {
    bcrypt = require('bcryptjs');
    jwt = require('jsonwebtoken');
    axios = require('axios');
} catch (e) {
    console.log('Some dependencies not installed - running in development mode');
}

// In-memory storage for demo purposes - replace with proper database
let publicDashboards = [];
let publicSettings = {
    enabled: false,
    baseDomain: '',
    serviceAccountUsername: '',
    serviceAccountPassword: '',
    allowedOrigins: [],
    defaultExpiration: 30
};

// Middleware for admin authentication (simplified for development)
const requireAdmin = (req, res, next) => {
    // In development, we'll skip strict authentication
    // In production, implement proper JWT validation
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
        // Mock admin user for development
        req.user = { id: 'dev-admin', isAdmin: true };
        return next();
    }
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Admin privileges required' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Validate public dashboard access
const validatePublicAccess = async (slug) => {
    if (!publicSettings.enabled) {
        throw new Error('Public dashboards are disabled');
    }

    const publicDashboard = publicDashboards.find(pd => 
        pd.slug === slug && 
        pd.isActive &&
        (!pd.expiresAt || new Date(pd.expiresAt) > new Date())
    );

    if (!publicDashboard) {
        throw new Error('Dashboard not found or access denied');
    }

    return publicDashboard;
};

// DHIS2 API client with service account
const createDHIS2Client = () => {
    if (!axios) {
        throw new Error('Axios not available - install dependencies for production use');
    }
    
    if (!publicSettings.serviceAccountUsername || !publicSettings.serviceAccountPassword) {
        throw new Error('Service account credentials not configured');
    }

    const auth = Buffer.from(
        `${publicSettings.serviceAccountUsername}:${publicSettings.serviceAccountPassword}`
    ).toString('base64');

    return axios.create({
        baseURL: process.env.DHIS2_BASE_URL || 'http://localhost:8080',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        timeout: 30000
    });
};

// Public Settings Routes (Admin only)
router.get('/public-settings', requireAdmin, (req, res) => {
    // Don't send password in response
    const { serviceAccountPassword, ...safeSettings } = publicSettings;
    res.json({
        ...safeSettings,
        serviceAccountPassword: serviceAccountPassword ? '••••••••' : ''
    });
});

router.post('/public-settings', requireAdmin, (req, res) => {
    try {
        const {
            enabled,
            baseDomain,
            serviceAccountUsername,
            serviceAccountPassword,
            allowedOrigins,
            defaultExpiration
        } = req.body;

        // Validate required fields if enabling
        if (enabled) {
            if (!baseDomain || !serviceAccountUsername || !serviceAccountPassword) {
                return res.status(400).json({ 
                    error: 'Base domain and service account credentials are required when enabling public dashboards' 
                });
            }

            // Validate domain format
            try {
                new URL(baseDomain);
            } catch {
                return res.status(400).json({ error: 'Invalid base domain format' });
            }
        }

        publicSettings = {
            enabled: Boolean(enabled),
            baseDomain: baseDomain || '',
            serviceAccountUsername: serviceAccountUsername || '',
            serviceAccountPassword: serviceAccountPassword === '••••••••' ? 
                publicSettings.serviceAccountPassword : (serviceAccountPassword || ''),
            allowedOrigins: Array.isArray(allowedOrigins) ? allowedOrigins : [],
            defaultExpiration: defaultExpiration || 30
        };

        res.json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving public settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

router.post('/test-public-connection', requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (!axios) {
            // In development mode without axios, simulate success
            return res.json({ message: 'Connection test successful (development mode)' });
        }

        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        const testClient = axios.create({
            baseURL: process.env.DHIS2_BASE_URL || 'http://localhost:8080',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        // Test connection with a simple API call
        await testClient.get('/api/me');
        res.json({ message: 'Connection successful' });
    } catch (error) {
        console.error('Connection test failed:', error);
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Invalid credentials' });
        } else {
            res.status(500).json({ error: 'Connection failed' });
        }
    }
});

// Public Dashboard Management Routes (Admin only)
router.get('/public-dashboards', requireAdmin, (req, res) => {
    res.json(publicDashboards);
});

router.post('/public-dashboards', requireAdmin, (req, res) => {
    try {
        const {
            name,
            description,
            dashboardId,
            slug,
            isActive,
            allowedVisualizationIds,
            customDomain,
            expiresAt
        } = req.body;

        // Validate required fields
        if (!name || !dashboardId || !slug) {
            return res.status(400).json({ error: 'Name, dashboard, and slug are required' });
        }

        // Check slug uniqueness
        if (publicDashboards.some(pd => pd.slug === slug)) {
            return res.status(400).json({ error: 'Slug already exists' });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({ 
                error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
            });
        }

        // Validate expiration date
        if (expiresAt && new Date(expiresAt) <= new Date()) {
            return res.status(400).json({ error: 'Expiration date must be in the future' });
        }

        const newPublicDashboard = {
            id: Date.now().toString(),
            name,
            description: description || '',
            dashboardId,
            slug,
            isActive: Boolean(isActive),
            allowedVisualizationIds: allowedVisualizationIds || [],
            customDomain: customDomain || '',
            expiresAt: expiresAt || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        publicDashboards.push(newPublicDashboard);
        res.status(201).json(newPublicDashboard);
    } catch (error) {
        console.error('Error creating public dashboard:', error);
        res.status(500).json({ error: 'Failed to create public dashboard' });
    }
});

router.put('/public-dashboards/:id', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const index = publicDashboards.findIndex(pd => pd.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Public dashboard not found' });
        }

        const {
            name,
            description,
            dashboardId,
            slug,
            isActive,
            allowedVisualizationIds,
            customDomain,
            expiresAt
        } = req.body;

        // Validate slug uniqueness (excluding current dashboard)
        if (publicDashboards.some(pd => pd.slug === slug && pd.id !== id)) {
            return res.status(400).json({ error: 'Slug already exists' });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({ 
                error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
            });
        }

        // Validate expiration date
        if (expiresAt && new Date(expiresAt) <= new Date()) {
            return res.status(400).json({ error: 'Expiration date must be in the future' });
        }

        publicDashboards[index] = {
            ...publicDashboards[index],
            name,
            description: description || '',
            dashboardId,
            slug,
            isActive: Boolean(isActive),
            allowedVisualizationIds: allowedVisualizationIds || [],
            customDomain: customDomain || '',
            expiresAt: expiresAt || null,
            updatedAt: new Date().toISOString()
        };

        res.json(publicDashboards[index]);
    } catch (error) {
        console.error('Error updating public dashboard:', error);
        res.status(500).json({ error: 'Failed to update public dashboard' });
    }
});

router.delete('/public-dashboards/:id', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const index = publicDashboards.findIndex(pd => pd.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Public dashboard not found' });
        }

        publicDashboards.splice(index, 1);
        res.json({ message: 'Public dashboard deleted successfully' });
    } catch (error) {
        console.error('Error deleting public dashboard:', error);
        res.status(500).json({ error: 'Failed to delete public dashboard' });
    }
});

// Public Dashboard Access Routes (No authentication required)
router.get('/public-dashboard/:slug', cors(), async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Validate public access
        const publicDashboard = await validatePublicAccess(slug);
        
        // TODO: Fetch dashboard data from your app's database
        // This would typically involve querying your dashboard storage
        const dashboardData = {
            id: publicDashboard.dashboardId,
            name: publicDashboard.name,
            description: publicDashboard.description,
            sections: [], // Fetch actual sections
            // ... other dashboard properties
        };

        // Filter visualizations if specific ones are allowed
        if (publicDashboard.allowedVisualizationIds.length > 0) {
            dashboardData.sections = dashboardData.sections.map(section => ({
                ...section,
                visualizations: section.visualizations.filter(viz =>
                    publicDashboard.allowedVisualizationIds.includes(viz.id)
                )
            }));
        }

        // TODO: Fetch data for DHIS2 visualizations using service account
        const dhis2Data = {};
        if (publicSettings.serviceAccountUsername) {
            try {
                const dhis2Client = createDHIS2Client();
                // Fetch required data from DHIS2 API
                // Example: const analyticsData = await dhis2Client.get('/api/analytics?...');
                // dhis2Data.analytics = analyticsData.data;
            } catch (dhis2Error) {
                console.error('DHIS2 data fetch error:', dhis2Error);
                // Continue without DHIS2 data - app-specific visualizations can still work
            }
        }

        const response = {
            dashboard: dashboardData,
            visualizations: dashboardData.sections.flatMap(s => s.visualizations),
            data: dhis2Data,
            metadata: {},
            isPublic: true,
            expiresAt: publicDashboard.expiresAt
        };

        // Set CORS headers for allowed origins
        if (publicSettings.allowedOrigins.length > 0) {
            const origin = req.headers.origin;
            if (publicSettings.allowedOrigins.includes(origin)) {
                res.header('Access-Control-Allow-Origin', origin);
            }
        }

        res.json(response);
    } catch (error) {
        console.error('Public dashboard access error:', error);
        if (error.message === 'Public dashboards are disabled') {
            res.status(503).json({ error: 'Public dashboards are currently disabled' });
        } else if (error.message === 'Dashboard not found or access denied') {
            res.status(404).json({ error: 'Dashboard not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Public Dashboard Data Route (for fetching fresh data)
router.get('/public-dashboard/:slug/data', cors(), async (req, res) => {
    try {
        const { slug } = req.params;
        const { visualizationIds } = req.query;
        
        // Validate public access
        const publicDashboard = await validatePublicAccess(slug);
        
        // Validate requested visualization IDs
        const requestedVizIds = visualizationIds ? visualizationIds.split(',') : [];
        const allowedVizIds = publicDashboard.allowedVisualizationIds;
        
        if (allowedVizIds.length > 0) {
            const unauthorizedVizIds = requestedVizIds.filter(id => !allowedVizIds.includes(id));
            if (unauthorizedVizIds.length > 0) {
                return res.status(403).json({ 
                    error: 'Access denied to some visualizations',
                    unauthorized: unauthorizedVizIds
                });
            }
        }

        // Fetch data from DHIS2 and app database
        const data = {};
        
        if (publicSettings.serviceAccountUsername) {
            try {
                const dhis2Client = createDHIS2Client();
                
                // Fetch analytics data for requested visualizations
                for (const vizId of requestedVizIds) {
                    // TODO: Build analytics query based on visualization configuration
                    // const analyticsQuery = buildAnalyticsQuery(vizId);
                    // const result = await dhis2Client.get(`/api/analytics?${analyticsQuery}`);
                    // data[vizId] = result.data;
                }
            } catch (dhis2Error) {
                console.error('DHIS2 data fetch error:', dhis2Error);
                // Return error but don't crash
                data.error = 'Failed to fetch some data';
            }
        }

        // Set CORS headers
        if (publicSettings.allowedOrigins.length > 0) {
            const origin = req.headers.origin;
            if (publicSettings.allowedOrigins.includes(origin)) {
                res.header('Access-Control-Allow-Origin', origin);
            }
        }

        res.json({
            data,
            timestamp: new Date().toISOString(),
            expiresAt: publicDashboard.expiresAt
        });
    } catch (error) {
        console.error('Public dashboard data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Health check route
router.get('/public-health', (req, res) => {
    res.json({
        status: 'ok',
        publicDashboardsEnabled: publicSettings.enabled,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;