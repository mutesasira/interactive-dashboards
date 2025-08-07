# Public Dashboard System

This document outlines the comprehensive public dashboard system that allows administrators to make selected dashboards publicly accessible without requiring DHIS2 authentication.

## Overview

The public dashboard system provides:
- **Admin Management**: Full control over which dashboards are public
- **Secure Access**: Service account-based authentication with DHIS2
- **Custom URLs**: User-friendly, shareable links with custom slugs
- **Granular Control**: Per-visualization access control
- **Expiration Support**: Time-limited public access
- **Custom Domains**: Organization-specific branding

## Architecture

### Frontend Components

#### Admin Interface
- **`PublicDashboardSettings.tsx`** - Global configuration for public dashboards
- **`PublicDashboardManagement.tsx`** - Management interface for creating and editing public dashboards
- **`PublicDashboardView.tsx`** - Public-facing dashboard viewer (no auth required)
- **`PublicLayout.tsx`** - Standalone layout for public views
- **`PublicNotFound.tsx`** - 404 page for invalid public dashboard URLs

#### Service Layer
- **`publicDashboardService.ts`** - API client for all public dashboard operations

### Backend Components

#### API Routes (`src/api/publicDashboardRoutes.js`)
- **Admin Routes** (require authentication):
  - `GET /api/public-settings` - Get current settings
  - `POST /api/public-settings` - Update settings
  - `POST /api/test-public-connection` - Test service account
  - `GET /api/public-dashboards` - List all public dashboards
  - `POST /api/public-dashboards` - Create new public dashboard
  - `PUT /api/public-dashboards/:id` - Update public dashboard
  - `DELETE /api/public-dashboards/:id` - Delete public dashboard

- **Public Routes** (no authentication required):
  - `GET /api/public-dashboard/:slug` - Get public dashboard data
  - `GET /api/public-dashboard/:slug/data` - Refresh dashboard data
  - `GET /api/public-health` - Health check endpoint

#### Security Features
- Service account credentials stored securely on backend only
- Request validation for public dashboard access
- CORS configuration for embedding
- Expiration date enforcement
- Slug validation and uniqueness checks

## Configuration

### Admin Settings

Navigate to **Settings → Public Settings** to configure:

1. **Enable Public Dashboards**: Master toggle for the entire feature
2. **Base Domain**: Default domain for all public dashboard links (e.g., `https://public.myorg.org`)
3. **Service Account**: DHIS2 credentials with read-only access to approved data
4. **Default Expiration**: Default number of days before public links expire
5. **Allowed Origins**: Domains that can embed public dashboards in iframes

### Service Account Setup

Create a dedicated DHIS2 user account with:
- **Read-only access** to approved organizational units and data elements
- **No admin privileges**
- **Limited to specific dashboard and visualization access**
- **Strong password** and regular rotation schedule

## Creating Public Dashboards

### Step-by-Step Process

1. **Navigate to Public Dashboard Management**
   - Go to Settings → Public Dashboards
   - Click "Add Public Dashboard"

2. **Configure Basic Information**
   - **Name**: Display name for the public dashboard
   - **Description**: Optional description
   - **Dashboard**: Select from existing dashboards
   - **URL Slug**: Unique identifier for the public URL (e.g., `covid-surveillance`)

3. **Set Access Controls**
   - **Allowed Visualizations**: Select specific visualizations to make public (optional)
   - **Expiration Date**: Set when the public link should expire (optional)
   - **Custom Domain**: Override default domain for this dashboard (optional)

4. **Activate**
   - Toggle "Active" to make the dashboard publicly accessible
   - Copy the generated public URL for sharing

### URL Structure

Public dashboards are accessible via:
```
https://your-domain.com/public/{slug}
```

Example:
```
https://public.health.gov/public/covid-dashboard
```

## Data Access Control

### Security Layers

1. **Backend Validation**: All requests validated against approved public dashboards
2. **Service Account**: Limited DHIS2 access using dedicated service account
3. **Visualization Filtering**: Only approved visualizations are accessible
4. **Expiration Enforcement**: Expired links automatically blocked
5. **CORS Protection**: Embedding restricted to allowed origins

### Data Flow

```
Public User → Frontend → Backend API → DHIS2 (via Service Account) → Filtered Data → Public User
```

### What Data is Accessible

- **Dashboard Structure**: Layout, sections, and configuration
- **Approved Visualizations**: Only visualizations explicitly marked as public
- **DHIS2 Analytics**: Data fetched using service account permissions
- **App Data**: Custom visualizations and indicators from app database

### What Data is Protected

- **Private Visualizations**: Non-approved visualizations are filtered out
- **User Information**: No user data or personal information exposed
- **System Configuration**: Backend settings and credentials never exposed
- **Audit Data**: Access logs and admin activities remain private

## Deployment Considerations

### Backend Requirements

1. **Install Dependencies**:
   ```bash
   npm install bcryptjs jsonwebtoken
   ```

2. **Environment Variables**:
   ```env
   DHIS2_BASE_URL=https://your-dhis2-instance.com
   JWT_SECRET=your-secure-jwt-secret
   ```

3. **Database Setup**:
   - Replace in-memory storage with persistent database
   - Implement proper data models for public dashboards and settings

### Production Setup

1. **Reverse Proxy Configuration**:
   ```nginx
   # Public dashboard routes
   location /public/ {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   
   # API routes
   location /api/public-dashboard/ {
       proxy_pass http://localhost:3002;
       add_header Access-Control-Allow-Origin *;
   }
   ```

2. **SSL Certificates**: Ensure HTTPS for all public dashboard URLs

3. **Monitoring**: Set up logging and monitoring for public dashboard access

### Security Best Practices

1. **Service Account Management**:
   - Use dedicated service account with minimal permissions
   - Rotate credentials regularly
   - Monitor service account usage

2. **Access Control**:
   - Regularly audit public dashboards
   - Set appropriate expiration dates
   - Monitor public dashboard access logs

3. **Data Governance**:
   - Review approved visualizations periodically
   - Ensure public data complies with privacy policies
   - Document public data disclosure procedures

## API Reference

### Public Dashboard Object
```typescript
interface IPublicDashboard {
    id: string;
    name: string;
    description?: string;
    dashboardId: string;
    slug: string;
    isActive: boolean;
    allowedVisualizationIds?: string[];
    customDomain?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}
```

### Public Settings Object
```typescript
interface IPublicSettings {
    enabled: boolean;
    baseDomain: string;
    serviceAccountUsername: string;
    serviceAccountPassword: string;
    allowedOrigins: string[];
    defaultExpiration?: number;
}
```

## Troubleshooting

### Common Issues

1. **Dashboard Not Loading**
   - Check if public dashboards are enabled in settings
   - Verify the slug exists and is active
   - Check expiration date

2. **Data Not Displaying**
   - Verify service account credentials
   - Check DHIS2 API connectivity
   - Review visualization permissions

3. **Access Denied Errors**
   - Confirm dashboard is marked as active
   - Check if specific visualizations are approved
   - Verify expiration date hasn't passed

### Debug Endpoints

- `GET /api/public-health` - Check system status
- Browser developer tools network tab - Monitor API requests
- Server logs - Check for authentication and permission errors

## Support and Maintenance

### Regular Maintenance

1. **Monthly**: Review active public dashboards and expiration dates
2. **Quarterly**: Audit service account permissions and rotate credentials
3. **Annually**: Review public data governance policies

### Support Resources

- Check server logs for detailed error messages
- Use browser developer tools to debug frontend issues
- Monitor DHIS2 API logs for backend connectivity issues
- Review public dashboard access analytics

## Future Enhancements

Potential improvements to consider:
- Analytics and usage tracking for public dashboards
- Email notifications for expiring public dashboards
- Bulk management operations
- Public dashboard templates
- Advanced access controls (IP restrictions, geographic limitations)
- Integration with external authentication providers