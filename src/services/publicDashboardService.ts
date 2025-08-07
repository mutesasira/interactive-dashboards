import axios, { AxiosInstance } from 'axios';
import { IPublicDashboard, IPublicSettings, IPublicDashboardResponse } from '../interfaces';

/**
 * Public Dashboard Service
 * 
 * Handles all API calls related to public dashboard functionality.
 * This service communicates with the backend API routes that handle
 * authentication with DHIS2 and data fetching.
 */
class PublicDashboardService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: '/api',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include auth token for admin routes
        this.apiClient.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('authToken');
                if (token && this.isAdminRoute(config.url || '')) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Handle unauthorized access
                    console.warn('Unauthorized access to public dashboard API');
                }
                return Promise.reject(error);
            }
        );
    }

    private isAdminRoute(url: string): boolean {
        return !url.startsWith('/public-dashboard/');
    }

    // Admin Settings Management
    async getPublicSettings(): Promise<IPublicSettings> {
        const response = await this.apiClient.get('/public-settings');
        return response.data;
    }

    async updatePublicSettings(settings: Partial<IPublicSettings>): Promise<void> {
        await this.apiClient.post('/public-settings', settings);
    }

    async testServiceAccountConnection(credentials: {
        username: string;
        password: string;
    }): Promise<void> {
        await this.apiClient.post('/test-public-connection', credentials);
    }

    // Public Dashboard Management
    async getPublicDashboards(): Promise<IPublicDashboard[]> {
        const response = await this.apiClient.get('/public-dashboards');
        return response.data;
    }

    async createPublicDashboard(dashboard: Omit<IPublicDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<IPublicDashboard> {
        const response = await this.apiClient.post('/public-dashboards', dashboard);
        return response.data;
    }

    async updatePublicDashboard(id: string, dashboard: Partial<IPublicDashboard>): Promise<IPublicDashboard> {
        const response = await this.apiClient.put(`/public-dashboards/${id}`, dashboard);
        return response.data;
    }

    async deletePublicDashboard(id: string): Promise<void> {
        await this.apiClient.delete(`/public-dashboards/${id}`);
    }

    // Public Dashboard Access (No authentication required)
    async getPublicDashboard(slug: string): Promise<IPublicDashboardResponse> {
        const response = await this.apiClient.get(`/public-dashboard/${slug}`);
        return response.data;
    }

    async refreshPublicDashboardData(slug: string, visualizationIds?: string[]): Promise<any> {
        const params = visualizationIds ? { visualizationIds: visualizationIds.join(',') } : {};
        const response = await this.apiClient.get(`/public-dashboard/${slug}/data`, { params });
        return response.data;
    }

    // Utility Methods
    generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }

    validateSlug(slug: string): boolean {
        return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
    }

    getPublicUrl(slug: string, baseDomain?: string): string {
        const domain = baseDomain || window.location.origin;
        return `${domain}/public/${slug}`;
    }

    // Health Check
    async checkPublicDashboardHealth(): Promise<{
        status: string;
        publicDashboardsEnabled: boolean;
        timestamp: string;
    }> {
        const response = await this.apiClient.get('/public-health');
        return response.data;
    }
}

// Export singleton instance
export const publicDashboardService = new PublicDashboardService();
export default publicDashboardService;