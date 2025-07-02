/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as main from '../src/main';

// Mock the action's main function
const _runMock = jest.spyOn(main, 'run');

// Mock the GitHub Actions core library
let _debugMock: jest.SpiedFunction<typeof core.debug>;
let errorMock: jest.SpiedFunction<typeof core.error>;
let getInputMock: jest.SpiedFunction<typeof core.getInput>;
let _setFailedMock: jest.SpiedFunction<typeof core.setFailed>;
let _setSecretMock: jest.SpiedFunction<typeof core.setSecret>;
let _addPathMock: jest.SpiedFunction<typeof core.addPath>;
let _infoMock: jest.SpiedFunction<typeof core.info>;
let _warningMock: jest.SpiedFunction<typeof core.warning>;
let exportVariableMock: jest.SpiedFunction<typeof core.exportVariable>;

// Mock the exec library
let execMock: jest.SpiedFunction<typeof exec.exec>;

// Mock the tool-cache library
let _findMock: jest.SpiedFunction<typeof tc.find>;
let cacheDirMock: jest.SpiedFunction<typeof tc.cacheDir>;

// Mock the cache library
let _restoreCacheMock: jest.SpiedFunction<typeof cache.restoreCache>;
let _saveCacheMock: jest.SpiedFunction<typeof cache.saveCache>;

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    _debugMock = jest.spyOn(core, 'debug').mockImplementation();
    errorMock = jest.spyOn(core, 'error').mockImplementation();
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation();
    _setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation();
    _setSecretMock = jest.spyOn(core, 'setSecret').mockImplementation();
    _addPathMock = jest.spyOn(core, 'addPath').mockImplementation();
    _infoMock = jest.spyOn(core, 'info').mockImplementation();
    _warningMock = jest.spyOn(core, 'warning').mockImplementation();
    exportVariableMock = jest.spyOn(core, 'exportVariable').mockImplementation();
    execMock = jest.spyOn(exec, 'exec').mockImplementation(() => Promise.resolve(0));
    _findMock = jest.spyOn(tc, 'find').mockImplementation();
    cacheDirMock = jest.spyOn(tc, 'cacheDir').mockImplementation();
    _restoreCacheMock = jest.spyOn(cache, 'restoreCache').mockImplementation();
    _saveCacheMock = jest.spyOn(cache, 'saveCache').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up environment variables
    process.env.SETTLEMINT_ACCESS_TOKEN = undefined;
    process.env.SETTLEMINT_PERSONAL_ACCESS_TOKEN = undefined;
    process.env.SETTLEMINT_INSTANCE = undefined;
    process.env.SETTLEMINT_WORKSPACE = undefined;
  });

  it('installs CLI and runs command', async () => {
    // Mock tool cache to simulate CLI not found
    cacheDirMock.mockResolvedValue('/cached/path');

    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'auto-connect':
          return 'false';
        case 'access-token':
          return 'sm_app_1234567890';
        default:
          return '';
      }
    });

    await main.run();

    // Check that we ran the command using npx
    expect(execMock).toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['status']);

    expect(errorMock).not.toHaveBeenCalled();
  }, 30_000);

  it('handles auto-connect when using a personal access token', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'auto-connect':
          return 'true';
        case 'access-token':
          return 'sm_pat_1234567890';
        default:
          return '';
      }
    });

    await main.run();

    // Personal access token should be set as environment variable
    expect(process.env.SETTLEMINT_PERSONAL_ACCESS_TOKEN).toBe('sm_pat_1234567890');

    // Access token should be masked
    expect(_setSecretMock).toHaveBeenCalledWith('sm_pat_1234567890');

    // Should login (because of personal access token) and connect (because auto-connect is true)
    expect(execMock).toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['login', '-a']);
    expect(execMock).toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['connect', '-a']);
    expect(execMock).toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['status']);
  }, 30_000);

  it('does not login but still connects when using an application access token with auto-connect', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'auto-connect':
          return 'true';
        case 'access-token':
          return 'sm_app_1234567890';
        default:
          return '';
      }
    });

    await main.run();

    // Application token should be set as environment variable
    expect(process.env.SETTLEMINT_ACCESS_TOKEN).toBe('sm_app_1234567890');

    // Access token should be masked
    expect(_setSecretMock).toHaveBeenCalledWith('sm_app_1234567890');

    // Should NOT login with app token, but should still connect because auto-connect is true
    expect(execMock).not.toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['login', '-a']);
    expect(execMock).toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['connect', '-a']);
    expect(execMock).toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['status']);
  }, 30_000);

  it('sets environment variables when provided', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'access-token':
          return 'sm_app_1234567890';
        case 'instance':
          return 'test-instance';
        case 'workspace':
          return 'test-workspace';
        default:
          return '';
      }
    });

    await main.run();

    expect(process.env.SETTLEMINT_INSTANCE).toBe('test-instance');
    expect(process.env.SETTLEMINT_WORKSPACE).toBe('test-workspace');
    expect(process.env.SETTLEMINT_ACCESS_TOKEN).toBe('sm_app_1234567890');
  }, 30_000);

  it('validates version format', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'version':
          return 'invalid-version';
        case 'access-token':
          return 'sm_app_1234567890';
        default:
          return '';
      }
    });

    await main.run();
    expect(_setFailedMock).toHaveBeenCalledWith(
      "Invalid version format: invalid-version. Must be a valid semver version or 'latest'"
    );
  }, 30_000);

  it('handles command injection attempts', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status && rm -rf /';
        case 'version':
          return 'latest';
        case 'access-token':
          return 'sm_app_1234567890';
        default:
          return '';
      }
    });

    await main.run();
    expect(_setFailedMock).toHaveBeenCalledWith(
      'Failed to execute command: Error: Command contains potentially dangerous characters. Please use simple commands only.'
    );
  }, 30_000);

  it('supports standalone mode without access token', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'instance':
          return 'standalone';
        case 'access-token':
          return ''; // No access token for standalone
        default:
          return '';
      }
    });

    await main.run();

    // Should NOT try to login or connect in standalone mode
    expect(execMock).not.toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['login', '-a']);
    expect(execMock).not.toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['connect', '-a']);
    expect(execMock).toHaveBeenCalledWith('npx -y @settlemint/sdk-cli@latest', ['status']);
  }, 30_000);

  it('requires access token when not in standalone mode', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'instance':
          return 'production';
        case 'access-token':
          return ''; // No access token
        default:
          return '';
      }
    });

    await main.run();
    expect(_setFailedMock).toHaveBeenCalledWith('access-token is required when not in standalone or local mode');
  }, 30_000);

  it('processes dotEnvFile content', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return '';
        case 'version':
          return 'latest';
        case 'access-token':
          return 'sm_app_1234567890';
        case 'dotEnvFile':
          return 'TEST_VAR=test_value\n# Comment\nQUOTED="quoted value"\nVAR_WITH_EQUALS=key=value';
        default:
          return '';
      }
    });

    await main.run();

    // Check that environment variables were set correctly
    expect(exportVariableMock).toHaveBeenCalledWith('TEST_VAR', 'test_value');
    expect(exportVariableMock).toHaveBeenCalledWith('QUOTED', 'quoted value');
    expect(exportVariableMock).toHaveBeenCalledWith('VAR_WITH_EQUALS', 'key=value');
  }, 30_000);
});
