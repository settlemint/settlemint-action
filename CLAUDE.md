# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that executes SettleMint CLI commands in GitHub Actions workflows. It provides seamless integration with the SettleMint platform for blockchain development and deployment automation. The action uses Node.js 20 runtime and is packaged with @vercel/ncc for distribution.

## Key Commands

### Development Workflow
```bash
# Complete build pipeline (recommended before commits)
npm run all

# Individual commands
npm run format        # Format code with Biome
npm run lint          # Lint code with Biome (auto-fix with --unsafe)
npm run test          # Run all tests with Jest
npm run ci-test       # Run tests in CI mode
npm run coverage      # Generate coverage reports and badges
npm run package       # Build distributable with ncc

# Development helpers
npm run package:watch # Build in watch mode
npm run bundle        # Format and package in one command
npm run local-action  # Test the action locally

# Testing
npx jest __tests__/main.test.ts  # Run a single test file
npx jest --watch                 # Run tests in watch mode
```

### Build Requirements
**IMPORTANT**: Always run `npm run package` before committing. The `dist/` folder must be updated with compiled JavaScript for GitHub Actions to work.

## Architecture

### Core Components

1. **src/main.ts** - Main action logic containing:
   - `run()` - Entry point that orchestrates the action
   - `validateVersion()` - Validates semver versions
   - `parseCommand()` - Security-critical command parser that prevents injection
   - `setupOutputMasking()` - Masks sensitive values in logs
   - `isPersonalAccessToken()` - Determines token type (sm_pat_ vs sm_app_)
   - Environment variable processing for SettleMint configuration

2. **src/index.ts** - Simple wrapper that imports and executes main.run()

3. **action.yml** - GitHub Action metadata defining all inputs

### Security Features

The action implements several security measures:
- Command injection prevention via `parseCommand()` that blocks shell metacharacters
- Output masking for tokens and private keys via `core.setSecret()`
- Input sanitization removing dangerous characters
- Version validation to ensure only valid semver or 'latest'

### Standalone Mode

When `instance: 'standalone'` is set:
- Access token becomes optional
- Login and connect steps are skipped
- Allows local/self-hosted SettleMint instances

### Token Types

Two token types behave differently:
- **Personal Access Tokens** (sm_pat_*): Can use auto-login functionality
- **Application Tokens** (sm_app_*): Skip login, only used for authentication

### Environment Variables

All inputs are converted to `SETTLEMINT_*` environment variables:
- `access-token` → `SETTLEMINT_ACCESS_TOKEN` or `SETTLEMINT_PERSONAL_ACCESS_TOKEN`
- `instance` → `SETTLEMINT_INSTANCE`
- `workspace` → `SETTLEMINT_WORKSPACE`
- etc.

### Testing

Tests use Jest with TypeScript and mock all GitHub Actions core functions. Key test scenarios:
- Version validation
- Command injection prevention
- Standalone mode support
- Token type handling
- Environment variable processing

## Performance & Caching

### NPM Package Caching
The action implements intelligent caching using GitHub Actions cache API:
- **Cache Key**: `settlemint-cli-${version}-${os.platform()}-${os.arch()}`
- **Cache Path**: Uses npm's default cache directory (`~/.npm`)
- **Non-blocking**: Cache failures are logged as warnings but don't block execution

### CLI Execution Optimization
- Uses `npx -y @settlemint/sdk-cli@${version}` for optimal performance
- No global installation (avoids polluting runner environment)
- Version pinning ensures consistency across runs

### Build Optimization
- **Bundle**: Single file output with @vercel/ncc
- **Tree shaking**: Eliminates unused code
- **Target**: ES2022 for modern JavaScript features
- **Module**: Node16 for optimal Node.js compatibility

## Development Standards

### TypeScript Configuration
- Strict mode enabled for all type checking
- Target ES2022, Module Node16
- Source maps included for debugging

### Code Quality
- **Formatter/Linter**: Biome (extends "ultracite" configuration)
- **Test Coverage**: Aim for >90% coverage
- **Security**: All inputs sanitized, command injection prevention

### Testing Requirements
- Mock all external dependencies (@actions/core, @actions/exec)
- Test both success and error scenarios
- Validate input sanitization and security measures
- Test environment variable processing

## Important Development Notes

1. **Always run `npm run package` before committing** - GitHub Actions requires dist/ folder
2. **Node 21+ required** for development (action runtime uses Node 20)
3. **Coverage badge** auto-generated in badges/coverage.svg
4. **Security first** - Always use `sanitizeInput()` and `parseCommand()` for user inputs
5. **Test comprehensively** - New features need corresponding tests

## Cursor Rules Summary

Key requirements from .cursorrules and .cursor/rules/:
- Use npx for CLI execution with version control
- Support all SettleMint environment variables as optional inputs
- Process .env files from secrets securely
- Implement npm cache for performance
- Maintain comprehensive test coverage
- Follow strict TypeScript configuration
- Ensure security through input validation and sanitization