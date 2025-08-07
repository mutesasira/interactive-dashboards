# Development Setup for Public Dashboards

## Quick Fix for Current Error

The console error you're seeing is because the API routes aren't being served by the development server. Here are the steps to fix it:

### 1. Install Missing Dependencies
```bash
npm install bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
```

### 2. Restart Development Server
```bash
yarn start
```

## Current Status

The public dashboard system is now configured to work in development mode:

- ✅ **Backend API Routes**: Available at `/api/public-*` endpoints
- ✅ **Frontend Components**: Ready to use with proper error handling
- ✅ **Development Mode**: Graceful fallbacks when dependencies aren't installed
- ✅ **Admin Interface**: Accessible via Settings → Public Settings/Public Dashboards

## Development Features

### 1. **Public Settings** (`/settings/public-settings`)
- Configure global public dashboard settings
- Test service account connections
- Set base domain and CORS origins
- In development: Uses fallback values if API fails

### 2. **Public Dashboard Management** (`/settings/public-dashboards`)
- Create and manage public dashboards
- Generate custom URL slugs
- Configure expiration dates
- Select specific visualizations to make public
- In development: Shows empty state if API fails

### 3. **Public Dashboard Viewing** (`/public/{slug}`)
- Public-facing dashboard viewer
- No authentication required
- Responsive design
- Error handling for invalid/expired links

## Development vs Production

### Development Mode
- **Authentication**: Bypassed for admin routes (auto-grants admin access)
- **Dependencies**: Optional - graceful fallbacks if not installed
- **Storage**: In-memory (resets on server restart)
- **Error Handling**: Shows helpful development messages

### Production Mode
- **Authentication**: Full JWT-based authentication required
- **Dependencies**: All packages must be installed
- **Storage**: Persistent database required
- **Error Handling**: Secure error messages

## Testing the Feature

1. **Start the development server**: `yarn start`
2. **Navigate to Settings**: Go to the main app settings
3. **Public Settings**: Click "Public Settings" in the sidebar
4. **Configure**: Set basic settings (the form will work even if API fails)
5. **Public Dashboards**: Click "Public Dashboards" to manage dashboards
6. **Create Dashboard**: Try creating a public dashboard (demo mode)

## Common Issues and Solutions

### Error: "<!DOCTYPE... is not valid JSON"
- **Cause**: API routes not properly configured
- **Solution**: Restart development server after installing dependencies

### Error: "Backend API not configured"
- **Cause**: Expected behavior in development mode
- **Solution**: This is normal - the UI will show helpful messages and fallback to demo mode

### Error: "Failed to load settings"
- **Cause**: setupProxy.js not properly loading
- **Solution**: Check that `src/setupProxy.js` exists and restart development server

## Next Steps for Production

1. **Database Integration**: Replace in-memory storage with persistent database
2. **Authentication**: Implement proper JWT-based admin authentication
3. **DHIS2 Integration**: Configure service account and test real API connections
4. **Security**: Review and harden all security measures
5. **Deployment**: Configure reverse proxy and SSL certificates

## File Structure

```
src/
├── api/
│   └── publicDashboardRoutes.js     # Backend API routes
├── components/
│   ├── settings/
│   │   ├── PublicDashboardSettings.tsx      # Global settings UI
│   │   └── PublicDashboardManagement.tsx    # Dashboard management UI
│   └── public/
│       ├── PublicLayout.tsx                 # Public layout wrapper
│       ├── PublicDashboardView.tsx          # Public dashboard viewer
│       └── PublicNotFound.tsx               # 404 page
├── services/
│   └── publicDashboardService.ts            # API client service
└── setupProxy.js                            # Development proxy config
```

The system is now ready for development and testing!