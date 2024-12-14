import * as core from '@actions/core'
import * as exec from '@actions/exec'

const ENV_VARS = [
  'personal-access-token',
  'instance',
  'workspace',
  'application',
  'blockchain-network',
  'blockchain-node',
  'load-balancer',
  'hasura',
  'hasura-endpoint',
  'hasura-admin-secret',
  'thegraph',
  'thegraph-subgraph-endpoint',
  'thegraph-subgraph-name',
  'portal',
  'portal-graphql-endpoint',
  'portal-rest-endpoint',
  'hd-private-key',
  'minio',
  'minio-endpoint',
  'minio-access-key',
  'minio-secret-key',
  'ipfs',
  'ipfs-api-endpoint',
  'ipfs-pinning-endpoint',
  'ipfs-gateway-endpoint',
  'auth-secret',
  'custom-deployment',
  'custom-deployment-endpoint',
  'blockscout',
  'blockscout-graphql-endpoint',
  'blockscout-ui-endpoint',
  'new-project-name',
  'nextauth-url',
  'smart-contract-set',
  'smart-contract-set-address',
  'smart-contract-set-deployment-id'
]

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const command = core.getInput('command')
    const version = core.getInput('version')
    const autoLogin = core.getInput('auto-login')
    const autoConnect = core.getInput('auto-connect')

    // Install SettleMint CLI
    core.debug('Installing SettleMint CLI...')
    await exec.exec('npm', ['install', '-g', `@settlemint/sdk-cli@${version}`])

    // Set optional environment variables
    for (const varName of ENV_VARS) {
      const value = core.getInput(varName)
      if (value) {
        process.env[`SETTLEMINT_${varName.replace(/-/g, '_').toUpperCase()}`] = value
      }
    }

    if (autoLogin === 'true') {
      await exec.exec('settlemint', ['login', '-a'])

      if (autoConnect === 'true') {
        await exec.exec('settlemint', ['connect', '-a'])
      }
    }

    await exec.exec('settlemint', command.split(' '))

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
