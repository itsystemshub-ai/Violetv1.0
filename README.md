# Violet ERP Monorepo

> Next Generation Enterprise Resource Planning System

## 🏗️ Monorepo Structure

This project uses a **monorepo** architecture with npm workspaces to manage multiple packages and applications in a single repository.

```
violet-erp-monorepo/
├── apps/                      # Application packages
│   ├── web/                   # React web application (Vite)
│   ├── server/                # Backend server (Express/Node.js)
│   └── electron/              # Desktop application (Electron)
├── packages/                  # Shared packages
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Shared utility functions
│   └── config/                # Shared configuration
├── docs/                      # Documentation
├── assets/                    # Shared assets
└── database/                  # Database schemas and migrations
```

## 📦 Packages

### Applications

| Package | Description | Port |
|---------|-------------|------|
| `@violet/web` | React web application with Vite | 5173 |
| `@violet/server` | Express backend server | 3001 |
| `@violet/electron` | Electron desktop app | - |

### Shared Libraries

| Package | Description |
|---------|-------------|
| `@violet/types` | Shared TypeScript types and interfaces |
| `@violet/utils` | Utility functions and helpers |
| `@violet/config` | Configuration management |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install all dependencies for all packages
npm install
```

### Development

```bash
# Run all apps in development mode
npm run dev:all

# Run web app only
npm run dev:web

# Run server only
npm run dev:server

# Run Electron desktop app
npm run dev:electron
```

### Building

```bash
# Build all packages
npm run build

# Build web app only
npm run build:web

# Build Electron desktop app
npm run build:electron
```

## 📁 Module Structure

Each application follows a consistent module structure:

```
src/
├── modules/           # Feature modules
│   ├── sales/
│   ├── purchases/
│   ├── inventory/
│   ├── finance/
│   ├── hr/
│   └── settings/
├── components/        # Shared components
├── hooks/            # Custom React hooks
├── services/         # API services
├── stores/           # State management (Zustand)
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## 🛠️ Technology Stack

### Frontend (Web)

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **React Router** - Routing
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **React Hook Form** - Forms
- **Zod** - Validation

### Backend (Server)

- **Node.js** - Runtime
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **Socket.IO** - Real-time communication
- **Better SQLite3** - Local database
- **Supabase** - Cloud database (optional)

### Desktop (Electron)

- **Electron** - Desktop framework
- **better-sqlite3** - Local database
- **electron-updater** - Auto updates

## 📝 Scripts

### Root Level

| Script | Description |
|--------|-------------|
| `npm run dev` | Run web and server in dev mode |
| `npm run dev:all` | Run all apps in dev mode |
| `npm run build` | Build all packages |
| `npm run build:all` | Build everything including Electron |
| `npm run test` | Run tests |
| `npm run lint` | Run linter |
| `npm run typecheck` | Type check |

### App Level

Each app has its own scripts:

```bash
# Web app
npm run dev -w @violet/web
npm run build -w @violet/web
npm run test -w @violet/web

# Server
npm run dev -w @violet/server
npm run start -w @violet/server

# Electron
npm run dev -w @violet/electron
npm run build -w @violet/electron
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for available configuration options.

### TypeScript

TypeScript configuration is set up with project references for better monorepo support:

- Root `tsconfig.json` - Base configuration and project references
- Each package has its own `tsconfig.json` extending the root

### Path Aliases

```json
{
  "@violet/types": ["./packages/types/src"],
  "@violet/utils": ["./packages/utils/src"],
  "@violet/config": ["./packages/config/src"]
}
```

## 📚 Documentation

- [Architecture](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Development Guide](./docs/development.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

UNLICENSED - Proprietary software

## 👥 Team

Violet ERP Team

---

**Built with ❤️ using React, TypeScript, and Node.js**
