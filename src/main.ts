import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as os from 'node:os';
import * as path from 'node:path';
import * as semver from 'semver';

process.env.CI = 'true';

const ENV_VARS = [
  'access-token',
  'instance',
  'workspace',
  'application',
  'blockchain-network',
  'blockchain-node',
  'load-balancer',
  'hasura',
  'thegraph',
  'portal',
  'hd-private-key',
  'minio',
  'ipfs',
  'custom-deployment',
  'blockscout',
];

const ENV_VAR_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*=/;
const QUOTE_PATTERN = /^["'](.*)["']$/;

/**
 * Sanitizes input to prevent command injection
 */
function sanitizeInput(input: string): string {
  // Remove any shell metacharacters that could be used for injection
  return input.replace(/[;&|`$()<>\\]/g, '');
}

/**
 * Validates and parses command arguments safely
 */
function parseCommand(command: string): string[] {
  // Basic validation to prevent obvious injection attempts
  if (
    command.includes('&&') ||
    command.includes('||') ||
    command.includes(';') ||
    command.includes('|') ||
    command.includes('`') ||
    command.includes('$(') ||
    command.includes('>') ||
    command.includes('<')
  ) {
    throw new Error('Command contains potentially dangerous characters. Please use simple commands only.');
  }

  // Split by spaces but respect quoted strings
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if ((char === '"' || char === "'") && (i === 0 || command[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else {
        current += char;
      }
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  if (inQuotes) {
    throw new Error('Unclosed quote in command');
  }

  return args;
}

/**
 * Processes environment file content and sets environment variables
 */
function processEnvContent(content: string): void {
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // Remove trailing comments and trim
    const lineWithoutComments = trimmedLine.split('#')[0].trim();

    // Check if line matches env var pattern
    if (ENV_VAR_PATTERN.test(lineWithoutComments)) {
      const [key, ...valueParts] = lineWithoutComments.split('=');
      let value = valueParts.join('='); // Rejoin in case value contains =

      // Remove surrounding quotes if they exist
      value = value.replace(QUOTE_PATTERN, '$1');

      // Sanitize the value before setting it
      const sanitizedKey = sanitizeInput(key.trim());
      const sanitizedValue = sanitizeInput(value.trim());

      // Set in GitHub environment
      core.exportVariable(sanitizedKey, sanitizedValue);
    }
  }
}

/**
 * Validates the version format
 */
function validateVersion(version: string): void {
  if (version === 'latest') {
    return;
  }

  if (!semver.valid(version)) {
    throw new Error(`Invalid version format: ${version}. Must be a valid semver version or 'latest'`);
  }
}

/**
 * Sets up output masking for sensitive values
 */
function setupOutputMasking(accessToken: string): void {
  if (accessToken) {
    core.setSecret(accessToken);
  }

  // Mask common sensitive patterns
  const _sensitivePatterns = [
    /sm_pat_[a-zA-Z0-9]+/g, // Personal access tokens
    /sm_app_[a-zA-Z0-9]+/g, // Application tokens
    /0x[a-fA-F0-9]{40}/g, // Ethereum addresses
    /0x[a-fA-F0-9]{64}/g, // Private keys
  ];

  // Note: GitHub Actions automatically masks values set with setSecret
  // Additional masking would need to be done at the exec level
}

/**
 * Checks if the token is a personal access token
 */
function isPersonalAccessToken(token: string): boolean {
  return token?.startsWith('sm_pat_');
}

/**
 * Handles cache operations
 */
async function handleCache(operation: 'restore' | 'save', cacheKey: string, npmCache: string): Promise<void> {
  try {
    if (operation === 'restore') {
      await cache.restoreCache([npmCache], cacheKey);
    } else {
      core.debug(`Caching npm packages from: ${npmCache}`);
      await cache.saveCache([npmCache], cacheKey);
    }
  } catch (error) {
    core.warning(`Cache ${operation} failed${operation === 'restore' ? ', proceeding with download' : ''}: ${error}`);
  }
}

/**
 * Processes environment files if provided
 */
function processEnvFiles(dotEnvFile: string, dotEnvLocalFile: string): void {
  if (dotEnvFile) {
    try {
      processEnvContent(dotEnvFile);
    } catch (error) {
      core.warning(`Failed to process dotEnvFile: ${error}`);
    }
  }

  if (dotEnvLocalFile) {
    try {
      processEnvContent(dotEnvLocalFile);
    } catch (error) {
      core.warning(`Failed to process dotEnvLocalFile: ${error}`);
    }
  }
}

/**
 * Collects input variables into a map
 */
function collectInputs(): Map<string, string> {
  const inputs = new Map<string, string>();
  for (const varName of ENV_VARS) {
    const value = core.getInput(varName);
    if (value) {
      inputs.set(varName, value);
    }
  }
  return inputs;
}

/**
 * Sets environment variables from inputs
 */
function setEnvironmentVariables(inputs: Map<string, string>): void {
  for (const varName of ENV_VARS) {
    const value = inputs.get(varName);
    if (value) {
      const sanitizedValue = sanitizeInput(value);

      if (varName === 'access-token') {
        if (isPersonalAccessToken(sanitizedValue)) {
          process.env.SETTLEMINT_PERSONAL_ACCESS_TOKEN = sanitizedValue;
        } else {
          process.env.SETTLEMINT_ACCESS_TOKEN = sanitizedValue;
        }
      } else {
        process.env[`SETTLEMINT_${varName.replace(/-/g, '_').toUpperCase()}`] = sanitizedValue;
      }
    }
  }
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const command = core.getInput('command');
    const version = core.getInput('version');
    const accessToken = core.getInput('access-token');
    const autoConnect = core.getInput('auto-connect');
    const instance = core.getInput('instance');

    // Validate version
    validateVersion(version);

    // Validate inputs for non-standalone mode
    const isStandalone = instance === 'standalone';
    if (!isStandalone && !accessToken) {
      throw new Error('access-token is required when not in standalone mode');
    }

    // Setup output masking for sensitive values
    setupOutputMasking(accessToken);

    // Setup cache
    const npmCache = path.join(os.homedir(), '.npm');
    const cacheKey = `settlemint-cli-${version}-${os.platform()}-${os.arch()}`;

    // Restore cache
    await handleCache('restore', cacheKey, npmCache);

    // Use SettleMint CLI
    core.debug('Using SettleMint CLI...');
    const settlemintCmd = `npx -y @settlemint/sdk-cli@${version}`;

    // Process .env files
    const dotEnvFile = core.getInput('dotEnvFile');
    const dotEnvLocalFile = core.getInput('dotEnvLocalFile');
    processEnvFiles(dotEnvFile, dotEnvLocalFile);

    // Collect and set environment variables
    const inputs = collectInputs();
    setEnvironmentVariables(inputs);

    // Execute SettleMint commands
    // Only login if not in standalone mode and have a personal access token
    if (!isStandalone && isPersonalAccessToken(accessToken)) {
      await exec.exec(settlemintCmd, ['login', '-a']);
    }

    // Only connect if not in standalone mode and auto-connect is enabled
    if (!isStandalone && autoConnect === 'true') {
      await exec.exec(settlemintCmd, ['connect', '-a']);
    }

    if (command) {
      try {
        const args = parseCommand(command);
        await exec.exec(settlemintCmd, args);
      } catch (error) {
        throw new Error(`Failed to execute command: ${error}`);
      }
    }

    // Save cache after successful execution
    await handleCache('save', cacheKey, npmCache);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}
