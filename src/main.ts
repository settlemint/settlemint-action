import * as core from '@actions/core';
import * as exec from '@actions/exec';

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

      // Set in GitHub environment
      core.exportVariable(key.trim(), value.trim());
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
    const autoLogin = isPersonalAccessToken(accessToken);
    const autoConnect = core.getInput('auto-connect');

    // Install SettleMint CLI
    core.debug('Installing SettleMint CLI...');
    await exec.exec('npm', ['install', '-g', `@settlemint/sdk-cli@${version}`]);

    // Process .env files
    const dotEnvFile = core.getInput('dotEnvFile');
    if (dotEnvFile) {
      processEnvContent(dotEnvFile);
    }

    const dotEnvLocalFile = core.getInput('dotEnvLocalFile');
    if (dotEnvLocalFile) {
      processEnvContent(dotEnvLocalFile);
    }

    // Set optional environment variables
    for (const varName of ENV_VARS) {
      const value = core.getInput(varName);
      if (value) {
        if (varName === 'access-token' && isPersonalAccessToken(value)) {
          process.env.SETTLEMINT_PERSONAL_ACCESS_TOKEN = value;
        } else {
          process.env[`SETTLEMINT_${varName.replace(/-/g, '_').toUpperCase()}`] = value;
        }
      }
    }

    if (autoLogin) {
      await exec.exec('settlemint', ['login', '-a']);

      if (autoConnect === 'true') {
        await exec.exec('settlemint', ['connect', '-a']);
      }
    }

    if (command) {
      await exec.exec('settlemint', command.split(' '));
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

function isPersonalAccessToken(token: string): boolean {
  return token?.startsWith('sm_pat_');
}
