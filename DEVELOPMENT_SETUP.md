# Development Environment Setup

This document describes the development environment configuration for UW Tracker.

## Quick Start

1. **Install Node.js 20+**

   ```bash
   # If using nvm
   nvm use
   # Or install Node.js 20+ from nodejs.org
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   - Backend: Copy `backend/env.example` to `backend/.env`
   - Frontend: Create `frontend/.env` with required variables

4. **Install VS Code extensions** (recommended)
   - Open VS Code in the project root
   - VS Code will prompt to install recommended extensions
   - Or manually install from `.vscode/extensions.json`

## Code Quality Tools

### ESLint

ESLint is configured for both backend and frontend with TypeScript support.

**Backend ESLint Config**: `backend/.eslintrc.json`

- TypeScript-specific rules
- Node.js environment
- Recommended TypeScript ESLint rules

**Frontend ESLint Config**: `frontend/.eslintrc.json`

- Expo/React Native rules
- React Hooks rules
- TypeScript support

**Usage:**

```bash
# Backend
cd backend
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Frontend
cd frontend
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Prettier

Prettier is configured for consistent code formatting across the project.

**Config**: `.prettierrc`

- Single quotes
- 2-space indentation
- Semicolons enabled
- 80 character line width

**Usage:**

```bash
# Backend
cd backend
npm run format        # Format all files
npm run format:check  # Check formatting

# Frontend
cd frontend
npm run format        # Format all files
npm run format:check  # Check formatting
```

### EditorConfig

EditorConfig ensures consistent coding styles across different editors and IDEs.

**Config**: `.editorconfig`

- UTF-8 encoding
- LF line endings
- 2-space indentation for most files
- 4-space indentation for Kotlin

Most modern editors support EditorConfig via plugins.

## Git Configuration

### .gitignore

Comprehensive `.gitignore` file at the root level covers:

- Node modules
- Environment files
- Build outputs
- IDE files
- OS-specific files
- Platform-specific files (Android, iOS)

### Git Hooks (Optional)

A pre-commit hook template is provided in `.husky/pre-commit`. To use it:

1. Install husky:

   ```bash
   npm install --save-dev husky
   ```

2. Initialize husky:

   ```bash
   npx husky install
   ```

3. Make the hook executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

The hook will run linting and format checks before each commit.

## VS Code Configuration

### Settings

VS Code settings are configured in `.vscode/settings.json`:

- Format on save enabled
- Prettier as default formatter
- ESLint auto-fix on save
- Consistent line endings (LF)

### Recommended Extensions

Extensions are listed in `.vscode/extensions.json`:

- Prettier - Code formatter
- ESLint - JavaScript/TypeScript linting
- EditorConfig - EditorConfig support
- TypeScript - Enhanced TypeScript support

## CI/CD

### GitHub Actions

CI workflow is configured in `.github/workflows/ci.yml`:

- Runs on push to `main`/`develop` branches
- Runs on pull requests
- Lints backend and frontend
- Checks code formatting
- Builds backend
- Type checks frontend

### Dependabot

Dependabot configuration (optional) in `.github/workflows/dependabot.yml`:

- Auto-merge for patch and minor updates
- Requires manual review for major updates

## Project Structure

```
UW-Tracker/
├── .editorconfig          # Editor configuration
├── .gitignore             # Git ignore rules
├── .nvmrc                 # Node version
├── .prettierrc            # Prettier config
├── .prettierignore        # Prettier ignore rules
├── .dockerignore          # Docker ignore rules
├── .github/
│   ├── workflows/
│   │   ├── ci.yml         # CI/CD workflow
│   │   └── dependabot.yml # Dependabot config
│   ├── ISSUE_TEMPLATE/    # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── .husky/                # Git hooks (optional)
├── .vscode/               # VS Code settings
├── backend/
│   ├── .eslintrc.json     # Backend ESLint config
│   └── package.json       # Backend dependencies
├── frontend/
│   ├── .eslintrc.json     # Frontend ESLint config
│   └── package.json       # Frontend dependencies
├── CONTRIBUTING.md        # Contribution guidelines
├── CHANGELOG.md           # Changelog
└── DEVELOPMENT_SETUP.md   # This file
```

## Best Practices

1. **Before committing:**

   - Run `npm run lint` to check for issues
   - Run `npm run format` to format code
   - Run `npm run type-check` to verify types

2. **Before pushing:**

   - Ensure all tests pass (if applicable)
   - Update documentation if needed
   - Follow commit message conventions (see CONTRIBUTING.md)

3. **Code style:**
   - Follow ESLint rules
   - Use Prettier for formatting
   - Write meaningful commit messages
   - Add comments for complex logic

## Troubleshooting

### ESLint errors

If you see ESLint errors:

1. Run `npm run lint:fix` to auto-fix issues
2. Check `.eslintrc.json` for rule configuration
3. Some rules may need manual fixes

### Prettier conflicts

If Prettier and ESLint conflict:

- ESLint configs include `eslint-config-prettier` to disable conflicting rules
- Format with Prettier first, then lint with ESLint

### Type errors

If TypeScript shows errors:

1. Run `npm run type-check` to see all errors
2. Check `tsconfig.json` for configuration
3. Ensure all dependencies are installed

## Next Steps

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
2. Set up your development environment
3. Start coding!

For questions or issues, please open an issue on GitHub.
