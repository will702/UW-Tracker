# Contributing to UW Tracker

Thank you for your interest in contributing to UW Tracker! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 20+ (use `.nvmrc` for version management)
- npm or yarn
- MongoDB (for backend development)
- Expo CLI (for frontend development)

### Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/UW-Tracker.git
   cd UW-Tracker
   ```

2. **Install Node.js version** (if using nvm)

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   - Backend: Copy `backend/env.example` to `backend/.env` and configure
   - Frontend: Create `frontend/.env` with required variables (see frontend docs)

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions/updates

### Making Changes

1. Create a new branch from `main`

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards

3. Test your changes locally

4. Format and lint your code

   ```bash
   # Backend
   cd backend
   npm run format
   npm run lint

   # Frontend
   cd frontend
   npm run format
   npm run lint
   ```

5. Commit your changes (see [Commit Guidelines](#commit-guidelines))

6. Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types; use proper types or `unknown`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Formatting

- Use Prettier for code formatting (configured in `.prettierrc`)
- Use EditorConfig for consistent indentation (configured in `.editorconfig`)
- Run `npm run format` before committing

### Linting

- Follow ESLint rules (configured in `.eslintrc.json`)
- Fix all linting errors before submitting PRs
- Run `npm run lint` to check for issues

### File Organization

- Keep files focused and single-purpose
- Use consistent naming conventions (camelCase for files, PascalCase for components)
- Group related functionality together

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(backend): add authentication middleware

fix(frontend): resolve navigation issue on iOS

docs: update README with setup instructions

refactor(backend): improve error handling in routes
```

## Pull Request Process

1. **Update documentation** if needed
2. **Ensure all tests pass** (if applicable)
3. **Update CHANGELOG.md** if applicable
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Keep PRs focused** - one feature/fix per PR

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated (if applicable)
- [ ] All tests pass locally

## Testing

### Backend Testing

```bash
cd backend
npm run test  # If tests are set up
npm run lint
```

### Frontend Testing

```bash
cd frontend
npm run lint
npm start  # Test in development
```

## Project Structure

```
UW-Tracker/
├── backend/          # Express API server
│   ├── src/         # Source code
│   ├── data/        # Sample data
│   └── dist/        # Compiled output
├── frontend/         # Expo React Native app
│   ├── src/         # Source code
│   ├── android/     # Android native code
│   └── ios/         # iOS native code
└── docs/            # Documentation
```

## Questions?

If you have questions, please:

- Open an issue for bugs or feature requests
- Check existing documentation
- Ask in discussions (if enabled)

Thank you for contributing! 🎉
