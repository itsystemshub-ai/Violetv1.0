# Changelog

All notable changes to Violet ERP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-28

### 🏗️ Major Changes - Monorepo Restructuring

#### Added
- **Monorepo Structure** with npm workspaces
- **New Apps Directory** (`apps/`)
  - `@violet/web` - React web application (Vite)
  - `@violet/server` - Backend server (Express/Node.js)
  - `@violet/electron` - Electron desktop application
- **New Shared Packages** (`packages/`)
  - `@violet/types` - Shared TypeScript type definitions
  - `@violet/utils` - Utility functions and helpers
  - `@violet/config` - Configuration management
- Root `README.md` with monorepo documentation
- New `.env.example` with comprehensive documentation
- Updated `.gitignore` for monorepo structure

#### Changed
- Moved frontend code from root to `apps/web/`
- Moved backend code from `backend/` and `server/` to `apps/server/`
- Moved Electron code from `electron/` to `apps/electron/`
- Updated `package.json` to use workspaces
- Updated `tsconfig.json` with project references
- Reorganized path aliases for monorepo

#### Removed
- Obsolete scripts and utility files
- Duplicate configuration files
- Old analysis documents
- Temporary files and test artifacts
- Redundant build scripts

### 📦 Technical Updates
- Updated to npm workspaces for package management
- Configured TypeScript project references
- Standardized configuration across all packages
- Improved build performance with shared dependencies

### 📝 Documentation
- Added comprehensive README.md
- Updated environment variable documentation
- Added monorepo structure documentation
- Improved development workflow documentation

---

## [0.0.1] - Previous Version

### Initial Release
- Original monolithic structure
- React frontend with Vite
- Express backend server
- Electron desktop application
- SQLite local database
- Supabase integration
