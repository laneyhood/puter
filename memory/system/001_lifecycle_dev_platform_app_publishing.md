# App Development & Publishing Platform Lifecycle

## Use Case: Cloud-Based Development Platform
**User Story**: As a web developer, I want to create, develop, and publish web applications through Puter's Dev Center so I can build and distribute apps without traditional hosting setup.

## Layer 1: User Journey Flow

```mermaid
flowchart TD
    A[Developer opens Dev Center] --> B[Create new app project]
    B --> C[Upload/develop app files]
    C --> D[Configure app metadata]
    D --> E[Deploy to subdomain]
    E --> F[Test deployed app]
    F --> G[Publish to App Center]
    G --> H[Users discover and launch app]
```

## Layer 2: Component Architecture

```mermaid
graph TB
    subgraph "UI Layer"
        DC[Dev Center App]
        FE[File Explorer]
        EM[Editor Modal]
    end
    
    subgraph "State Layer"
        AS[App State]
        FS[File State]
        DS[Deploy State]
    end
    
    subgraph "Service Layer"
        APS[Apps Service]
        HSS[Hosting Service]
        FSS[FileSystem Service]
        PS[Process Service]
    end
    
    subgraph "External Layer"
        API[Puter API]
        DB[(Database)]
        CDN[Static Hosting]
    end
    
    DC --> AS
    FE --> FS
    EM --> DS
    
    AS --> APS
    FS --> FSS
    DS --> HSS
    
    APS --> API
    HSS --> API
    FSS --> API
    
    API --> DB
    API --> CDN
    
    PS --> DC
```

### Component Mapping Table

| Component | Implementation | File:Line |
|-----------|---------------|-----------|
| Dev Center App | `create_app()` function | `src/dev-center/js/dev-center.js:259` |
| Apps Service | `Apps` class | `src/puter-js/src/modules/Apps.js:3` |
| Hosting Service | `Hosting` class | `src/puter-js/src/modules/Hosting.js:4` |
| FileSystem Service | `PuterJSFileSystemModule` | `src/puter-js/src/modules/FileSystem/index.js:22` |
| Process Service | `ProcessService` class | `src/gui/src/services/ProcessService.js:24` |
| App Entity Storage | `AppES` class | `src/backend/src/om/entitystorage/AppES.js:32` |
| Apps Router | Express router | `src/backend/src/routers/apps.js:31` |
| Hosting Middleware | `PuterSiteMiddleware` | `src/backend/src/routers/hosting/puter-site.js:33` |

## Layer 3: Detailed Sequence Flow

```mermaid
sequenceDiagram
    participant D as Developer
    participant DC as Dev Center
    participant SDK as Puter SDK
    participant API as Backend API
    participant DB as Database
    participant CDN as Static Hosting
    
    D->>DC: Click "Create New App"
    DC->>DC: Generate app name from title
    DC->>SDK: puter.apps.create()
    SDK->>API: POST /drivers/call (puter-apps)
    API->>DB: INSERT INTO apps
    API->>DB: Create app directory in AppData
    DB-->>API: App created with UID
    API-->>SDK: App object
    SDK-->>DC: App creation success
    
    DC->>SDK: puter.hosting.create(subdomain, app_dir)
    SDK->>API: POST /drivers/call (puter-subdomains)
    API->>CDN: Create subdomain mapping
    CDN-->>API: Subdomain ready
    API-->>SDK: Hosting created
    
    DC->>SDK: puter.apps.update() with indexURL
    SDK->>API: POST /drivers/call (puter-apps)
    API->>DB: UPDATE apps SET index_url
    DB-->>API: App updated
    API-->>SDK: Update success
    
    D->>DC: Upload files to app directory
    DC->>SDK: puter.fs.write() operations
    SDK->>API: File system operations
    API->>DB: Store files in app directory
    DB-->>API: Files stored
    API-->>SDK: File operations complete
    
    D->>DC: Click "Deploy"
    DC->>SDK: puter.hosting.create() with new hostname
    SDK->>API: Create fresh subdomain
    API->>CDN: Deploy files to new subdomain
    CDN-->>API: Deployment complete
    API-->>SDK: Hosting updated
    SDK-->>DC: Deployment success
    
    Note over D,CDN: App is now live and accessible via subdomain
```

### Key Design Patterns

1. **Repository Pattern**: `AppES` class abstracts database operations for apps
2. **Service Layer Pattern**: SDK modules provide clean API abstractions
3. **Event-Driven Architecture**: IPC system handles app-to-GUI communication

## Data Structures

```typescript
// App creation request
interface AppCreateRequest {
  title: string;           // Display name
  name: string;            // URL-safe identifier
  indexURL?: string;       // Entry point URL
  description?: string;    // App description
  icon?: string;          // Base64 encoded icon
  maximizeOnStart?: boolean;
  background?: boolean;
  filetypeAssociations?: string[];
  metadata?: Record<string, any>;
  dedupeName?: boolean;    // Auto-rename if name exists
}

// App entity in database
interface AppEntity {
  id: number;
  uid: string;            // app-{uuid} format
  owner_user_id: number;
  icon?: string;
  name: string;           // Unique identifier
  title: string;          // Display name
  description?: string;
  godmode: boolean;
  maximize_on_start: boolean;
  index_url: string;      // Entry point
  approved_for_listing: boolean;
  approved_for_opening_items: boolean;
  approved_for_incentive_program: boolean;
  timestamp: Date;
  last_review?: Date;
  tags?: string;
  app_owner?: number;
}

// Hosting configuration
interface HostingConfig {
  subdomain: string;      // Generated subdomain name
  root_dir: string;       // App directory path
  associated_app_id?: string;
}

// Deployment response
interface DeploymentResponse {
  success: boolean;
  subdomain: string;
  indexURL: string;       // Final deployed URL
  hostname: string;       // Generated hostname
}
```

## Quick Reference

### Event Triggers
- **App Creation**: `puter.apps.create()` call from Dev Center
- **File Upload**: Drag & drop or file picker in Dev Center
- **Deployment**: `puter.hosting.create()` with fresh hostname
- **App Launch**: User clicks app in App Center or desktop

### API Formats
- **Apps API**: `/drivers/call` with `puter-apps` interface
- **Hosting API**: `/drivers/call` with `puter-subdomains` interface
- **File System**: Standard Puter FS API operations
- **Authentication**: Bearer token in Authorization header

### Error Handling
- **Name Conflicts**: Auto-rename with `-{number}` suffix
- **Subdomain Conflicts**: Generate random suffix
- **File Upload Errors**: Show specific error messages
- **Deployment Failures**: Rollback to previous version
- **Permission Errors**: Redirect to authentication

## Related Lifecycles

1. **File Management & Sharing** (`002_lifecycle_file_management_sharing.md`)
   - Uses same FileSystem Service and API patterns
   - Shares authentication and permission models

2. **User Authentication & Account Management** (`003_lifecycle_auth_account.md`)
   - Apps require user authentication for creation
   - Shares session management and user context

3. **App Discovery & Launch** (`004_lifecycle_app_discovery_launch.md`)
   - Published apps become available in App Center
   - Uses Process Service for app launching

4. **Cross-Device File Synchronization** (`005_lifecycle_cross_device_sync.md`)
   - App files sync across devices via FileSystem Service
   - Shares same storage and sync mechanisms

5. **Self-Hosting & Customization** (`006_lifecycle_self_hosting.md`)
   - Self-hosted instances use same app creation patterns
   - Shares deployment and hosting infrastructure

## Component Overview

### Key Components and Services

| Component | Role | Key Methods |
|-----------|------|-------------|
| **Dev Center** | UI for app development and management | `create_app()`, `deploy_app()` |
| **Apps SDK** | Client-side app management API | `create()`, `update()`, `list()`, `delete()` |
| **Hosting SDK** | Static hosting and subdomain management | `create()`, `update()`, `list()` |
| **FileSystem SDK** | File operations for app development | `write()`, `read()`, `mkdir()`, `stat()` |
| **AppES** | Database abstraction for apps | `select()`, `upsert()`, name validation |
| **ProcessService** | App lifecycle management in GUI | `register()`, `launchApp()`, `unregister()` |
| **PuterSiteMiddleware** | Subdomain routing and static hosting | `run()`, subdomain resolution |
| **ExecService** | App launching and IPC management | `launchApp()`, process communication |

This lifecycle demonstrates how Puter provides a complete development platform from creation to deployment, with clean separation of concerns across UI, services, and infrastructure layers.
