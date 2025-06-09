import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as os from 'node:os';
import * as path from 'node:path';

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
    if (isPersonalAccessToken(accessToken)) {
      await exec.exec(settlemintCmd, ['login', '-a']);
    }

    if (autoConnect === 'true') {
      await exec.exec(settlemintCmd, ['connect', '-a']);
    }

    if (command) {
      await exec.exec(settlemintCmd, command.split(' '));
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
