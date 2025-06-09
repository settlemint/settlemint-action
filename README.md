<p align="center">
  <img src="https://github.com/settlemint/sdk/blob/main/logo.svg" width="200px" align="center" alt="SettleMint logo" />
  <h1 align="center">SettleMint Github Action</h1>
  <p align="center">
    ✨ <a href="https://settlemint.com">https://settlemint.com</a> ✨
    <br/>
    Integrate SettleMint into your application with ease.
  </p>
</p>
<br/>
<p align="center">
<a href="https://github.com/settlemint/settlemint-action/actions?query=branch%3Amain"><img src="https://github.com/settlemint/settlemint-action/actions/workflows/ci.yml/badge.svg?event=push&branch=main" alt="CI status" /></a>
<a href="https://github.com/settlemint/settlemint-action" rel="nofollow"><img src="https://img.shields.io/github/stars/settlemint/settlemint-action" alt="stars"></a>
</p>

<div align="center">
  <a href="https://console.settlemint.com/documentation/">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/settlemint/settlemint-action/issues">Issues</a>
  <br />
</div>

## Description

This GitHub Action allows you to execute SettleMint CLI commands in your GitHub Actions workflow. It handles installation, authentication, and execution of CLI commands with proper environment configuration.

## Features

- 🚀 Automatic installation of SettleMint CLI
- 🔐 Built-in authentication handling
- 🌍 Support for all SettleMint environment variables
- 📦 Version control for CLI installation
- 🔌 Automatic workspace connection

## Usage

### Basic Example

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Run SettleMint CLI
    uses: settlemint/settlemint-action@main
    with:
      command: "platform list workspaces"
      access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

### Advanced Example

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Deploy Smart Contract
    uses: settlemint/settlemint-action@main
    with:
      command: "scs hardhat deploy remote --accept-defaults"
      access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
      version: "1.0.0"
      workspace: "my-workspace-ae70"
      blockchain-node: "my-node-3b8e"
      auto-connect: "true"
```

## Inputs

### Required

| Input        | Description                                                                | Required |
| ------------ | -------------------------------------------------------------------------- | -------- |
| access-token | SettleMint Access Token (can be a personal or an application access token) | Yes      |

### Optional

| Input              | Description                        | Default                                                             |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------- |
| command            | CLI command to execute             | -                                                                   |
| version            | CLI version to install             | 'latest'                                                            |
| auto-connect       | Automatically connect to workspace | 'true' (only executed when access-token is a personal access token) |
| instance           | SettleMint instance URL            | 'https://console.settlemint.com'                                    |
| workspace          | Workspace unique name              | -                                                                   |
| application        | Application unique name            | -                                                                   |
| blockchain-network | Blockchain network unique name     | -                                                                   |
| blockchain-node    | Blockchain node unique name        | -                                                                   |
| load-balancer      | Load balancer unique name          | -                                                                   |
| hasura             | Hasura unique name                 | -                                                                   |
| thegraph           | TheGraph unique name               | -                                                                   |
| portal             | Portal unique name                 | -                                                                   |
| hd-private-key     | HD private key                     | -                                                                   |
| minio              | MinIO unique name                  | -                                                                   |
| ipfs               | IPFS unique name                   | -                                                                   |
| custom-deployment  | Custom deployment unique name      | -                                                                   |
| blockscout         | Blockscout unique name             | -                                                                   |
| dotEnvFile         | .env file content (store in secrets) | -                                                                 |
| dotEnvLocalFile    | .env.local file content (store in secrets) | -                                                           |

## Common Use Cases

### Deploying Smart Contracts

```yaml
- name: Deploy Contract
  uses: settlemint/settlemint-action@main
  with:
    command: scs hardhat deploy remote --accept-defaults
    access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
    workspace: ${{ vars.WORKSPACE_UNIQUE_NAME }}
```

### Managing Workspaces

```yaml
- name: List Workspaces
  uses: settlemint/settlemint-action@main
  with:
    command: platform list workspaces
    access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

### Custom Version Installation

```yaml
- name: Use Specific CLI Version
  uses: settlemint/settlemint-action@main
  with:
    command: --version
    version: "1.0.0"
    access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

## Environment Variables

All inputs are automatically converted to environment variables with the `SETTLEMINT_` prefix. For example:

- `workspace` → `SETTLEMINT_WORKSPACE`
- `blockchain-network` → `SETTLEMINT_BLOCKCHAIN_NETWORK`

### Environment Files

The action supports loading environment variables from `.env` files. You can provide the content of your env files through the following inputs:

- `dotEnvFile`: Content of your main `.env` file
- `dotEnvLocalFile`: Content of your `.env.local` file

⚠️ **Important**: Always store env file contents in GitHub Secrets:

```yaml
steps:
  - uses: settlemint/settlemint-action@main
    with:
      dotEnvFile: ${{ secrets.MY_ENV_FILE }}
      dotEnvLocalFile: ${{ secrets.MY_ENV_LOCAL }}
      access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

The action will process these files and add all variables to the GitHub Actions environment. It handles:

- Comments (lines starting with #)
- Empty lines
- Quoted values
- Values containing = signs
- Trailing comments

## Error Handling

The action will fail if:

- Invalid access token is provided
- Required inputs are missing
- CLI command execution fails
- Network connectivity issues occur

## Security

- Never commit your access token directly in workflows
- Use GitHub Secrets for sensitive information
- Consider using OIDC for token management in production

## Security Best Practices

### Handling Secrets 🔒

- **NEVER** commit access tokens, private keys or any secrets directly in your workflow files or repository
- **ALWAYS** use GitHub Secrets for sensitive information:

  ```yaml
  # ✅ CORRECT - Using GitHub Secrets
  access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}

  # ❌ WRONG - NEVER do this
  access-token: "your-token-here"  # This is a security risk!
  ```

- Use GitHub's OIDC (OpenID Connect) for token management in production environments
- Regularly rotate your access tokens and secrets
- Limit secret access to only the necessary workflows and repositories

### Environment Variables

When using .env files:

```yaml
steps:
  - uses: settlemint/settlemint-action@main
    with:
      dotEnvFile: ${{ secrets.ENV_FILE_CONTENT }} # Store as a secret!
      access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

## Troubleshooting

### Common Issues

#### Invalid Access Token
**Error**: `Failed to authenticate with SettleMint: Error: Process completed with exit code 1. Please check your access token.`

**Solution**: 
- Ensure your access token is correctly stored in GitHub Secrets
- Verify the token hasn't expired
- Check that you're using the correct token format:
  - Personal Access Tokens: `sm_pat_xxxxx`
  - Application Tokens: `sm_app_xxxxx`

#### Command Injection Prevention
**Error**: `Command contains potentially dangerous characters. Please use simple commands only.`

**Solution**:
- Avoid using shell operators like `&&`, `||`, `;`, `|`, or backticks
- Use simple, direct commands
- If you need to run multiple commands, use multiple action steps

#### Version Installation Failures
**Error**: `Invalid version format: x.x.x. Must be a valid semver version or 'latest'`

**Solution**:
- Use valid semantic version numbers (e.g., `1.0.0`, `2.1.3`)
- Use `latest` for the most recent version
- Don't use version ranges or npm tags other than `latest`

#### Environment Variable Issues
**Problem**: Environment variables from `.env` files aren't being loaded

**Solution**:
- Ensure the env file content is stored in GitHub Secrets
- Check that the file content follows the correct format:
  ```
  KEY=value
  # Comments are supported
  QUOTED_VALUE="value with spaces"
  ```
- Verify no shell metacharacters are in your values

#### CLI Not Found
**Error**: `settlemint: command not found`

**Solution**:
- The action should automatically install the CLI
- If using a self-hosted runner, ensure npm is available
- Check the action logs for installation errors

### Debugging Tips

1. **Enable Debug Logging**:
   ```yaml
   - name: Run SettleMint CLI
     uses: settlemint/settlemint-action@main
     env:
       ACTIONS_STEP_DEBUG: true
     with:
       command: "your-command"
       access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
   ```

2. **Check Token Format**:
   Personal access tokens start with `sm_pat_`, while application tokens start with `sm_app_`. The action behaves differently based on the token type.

3. **Verify Workspace Connection**:
   If auto-connect fails, try connecting manually first:
   ```yaml
   - name: Connect to Workspace
     uses: settlemint/settlemint-action@main
     with:
       command: "connect -w your-workspace-id"
       access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
   ```

4. **Cache Issues**:
   The action caches CLI installations. If you experience issues, the cache will be automatically invalidated when changing versions.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the FSL-1.1-MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [SettleMint Documentation](https://console.settlemint.com/documentation)
- 💬 [GitHub Issues](https://github.com/settlemint/settlemint-action/issues)
- 📧 [Support Email](mailto:support@settlemint.com)
