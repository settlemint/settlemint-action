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
      command: 'workspace list'
      access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

### Advanced Example

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Deploy Smart Contract
    uses: settlemint/settlemint-action@main
    with:
      command: 'contract deploy MyContract'
      access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
      version: '1.0.0'
      workspace: 'my-workspace-id'
      blockchain-network: 'my-network-id'
      auto-login: 'true'
      auto-connect: 'true'
```

## Inputs

### Required

| Input            | Description                    | Required |
|------------------|--------------------------------|----------|
| personal-access-token | SettleMint Personal Access Token | Yes      |
| access-token     | SettleMint ApplicationAccess Token       | Yes      |

### Optional

| Input              | Description                                      | Default                           |
|--------------------|--------------------------------------------------|----------------------------------|
| command            | CLI command to execute                           | -                                |
| version            | CLI version to install                           | 'latest'                         |
| auto-login         | Automatically login to SettleMint                | 'true'                           |
| auto-connect       | Automatically connect to workspace               | 'true'                           |
| instance           | SettleMint instance URL                         | 'https://console.settlemint.com' |
| workspace          | Workspace ID                                     | -                                |
| application        | Application ID                                   | -                                |
| blockchain-network | Blockchain network ID                           | -                                |
| blockchain-node    | Blockchain node ID                              | -                                |
| load-balancer      | Load balancer ID                                | -                                |
| hasura             | Hasura ID                                       | -                                |
| thegraph           | TheGraph ID                                     | -                                |
| portal             | Portal ID                                       | -                                |
| hd-private-key     | HD private key                                  | -                                |
| minio              | MinIO ID                                        | -                                |
| ipfs               | IPFS ID                                         | -                                |
| custom-deployment  | Custom deployment ID                            | -                                |
| blockscout         | Blockscout ID                                   | -                                |
| smart-contract-set | Smart contract set ID                           | -                                |

## Common Use Cases

### Deploying Smart Contracts

```yaml
- name: Deploy Contract
  uses: settlemint/settlemint-action@main
  with:
    command: |
      contract compile
      contract deploy MyContract
    access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
    workspace: ${{ vars.WORKSPACE_ID }}
```

### Managing Workspaces

```yaml
- name: List Workspaces
  uses: settlemint/settlemint-action@main
  with:
    command: workspace list
    access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

### Custom Version Installation

```yaml
- name: Use Specific CLI Version
  uses: settlemint/settlemint-action@main
  with:
    command: --version
    version: '1.0.0'
    access-token: ${{ secrets.SETTLEMINT_ACCESS_TOKEN }}
```

## Environment Variables

All inputs are automatically converted to environment variables with the `SETTLEMINT_` prefix. For example:

- `workspace` → `SETTLEMINT_WORKSPACE`
- `blockchain-network` → `SETTLEMINT_BLOCKCHAIN_NETWORK`

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

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the FSL-1.1-MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [SettleMint Documentation](https://console.settlemint.com/documentation)
- 📧 [Support Email](mailto:support@settlemint.com)

