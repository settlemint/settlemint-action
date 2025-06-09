/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as main from '../src/main';

// Mock the action's main function
const runMock = jest.spyOn(main, 'run');

// Mock the GitHub Actions core library
let _debugMock: jest.SpiedFunction<typeof core.debug>;
let errorMock: jest.SpiedFunction<typeof core.error>;
let getInputMock: jest.SpiedFunction<typeof core.getInput>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;
let setSecretMock: jest.SpiedFunction<typeof core.setSecret>;
let addPathMock: jest.SpiedFunction<typeof core.addPath>;
let _infoMock: jest.SpiedFunction<typeof core.info>;
let warningMock: jest.SpiedFunction<typeof core.warning>;

// Mock the exec library
let execMock: jest.SpiedFunction<typeof exec.exec>;

// Mock the tool-cache library
let findMock: jest.SpiedFunction<typeof tc.find>;
let cacheDirMock: jest.SpiedFunction<typeof tc.cacheDir>;

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    _debugMock = jest.spyOn(core, 'debug').mockImplementation();
    errorMock = jest.spyOn(core, 'error').mockImplementation();
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation();
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation();
    setSecretMock = jest.spyOn(core, 'setSecret').mockImplementation();
    addPathMock = jest.spyOn(core, 'addPath').mockImplementation();
    _infoMock = jest.spyOn(core, 'info').mockImplementation();
    warningMock = jest.spyOn(core, 'warning').mockImplementation();
    execMock = jest.spyOn(exec, 'exec').mockImplementation();
    findMock = jest.spyOn(tc, 'find').mockImplementation();
    cacheDirMock = jest.spyOn(tc, 'cacheDir').mockImplementation();
  });

  it('installs CLI and runs command', async () => {
    // Mock tool cache to simulate CLI not found
    findMock.mockReturnValue('');
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
    expect(runMock).toHaveReturned();

    // Check that we tried to find cached version
    expect(findMock).toHaveBeenCalledWith('settlemint-cli', 'latest');

    // Check that we installed the CLI
    expect(execMock).toHaveBeenCalledWith(
      'mkdir',
      expect.arrayContaining(['-p', expect.stringContaining('settlemint-cli-')])
    );
    expect(execMock).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['install', '--prefix', expect.any(String), '@settlemint/sdk-cli'])
    );

    // Check that we cached the installation
    expect(cacheDirMock).toHaveBeenCalled();

    // Check that we added to PATH
    expect(addPathMock).toHaveBeenCalled();

    // Check that we ran the command
    expect(execMock).toHaveBeenCalledWith('settlemint', ['status']);

    expect(errorMock).not.toHaveBeenCalled();
  });

  it('handles auto-connect when using a personal access token', async () => {
    findMock.mockReturnValue('/cached/path');

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
    expect(runMock).toHaveReturned();

<<<<<<< Updated upstream
    // Should use cached version
    expect(findMock).toHaveBeenCalledWith('settlemint-cli', 'latest');
    expect(addPathMock).toHaveBeenCalled();

    // Should mask the access token
    expect(setSecretMock).toHaveBeenCalledWith('sm_pat_1234567890');

    // Should login and connect
    expect(execMock).toHaveBeenCalledWith('settlemint', ['login', '-a']);
    expect(execMock).toHaveBeenCalledWith('settlemint', ['connect', '-a']);
    expect(execMock).toHaveBeenCalledWith('settlemint', ['status']);
=======
    expect(execMock).toHaveBeenNthCalledWith(1, 'npm', ['install', '-g', '@settlemint/sdk-cli@latest']);
    expect(execMock).toHaveBeenNthCalledWith(2, 'settlemint', ['login', '-a']);
    expect(execMock).toHaveBeenNthCalledWith(3, 'settlemint', ['connect', '-a']);
>>>>>>> Stashed changes
  });

  it('does not auto-connect when using an application access token', async () => {
    findMock.mockReturnValue('/cached/path');

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
    expect(runMock).toHaveReturned();

    // Should mask the access token
    expect(setSecretMock).toHaveBeenCalledWith('sm_app_1234567890');

    // Should NOT login or connect with app token
    expect(execMock).not.toHaveBeenCalledWith('settlemint', ['login', '-a']);
    expect(execMock).not.toHaveBeenCalledWith('settlemint', ['connect', '-a']);
    expect(execMock).toHaveBeenCalledWith('settlemint', ['status']);
  });

  it('sets environment variables when provided', async () => {
    findMock.mockReturnValue('/cached/path');

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
    expect(runMock).toHaveReturned();

    expect(process.env.SETTLEMINT_INSTANCE).toBe('test-instance');
    expect(process.env.SETTLEMINT_WORKSPACE).toBe('test-workspace');
    expect(process.env.SETTLEMINT_ACCESS_TOKEN).toBe('sm_app_1234567890');
  });

  it('validates version format', async () => {
    findMock.mockReturnValue('');

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
    expect(runMock).toHaveReturned();

    expect(setFailedMock).toHaveBeenCalledWith(
      "Invalid version format: invalid-version. Must be a valid semver version or 'latest'"
    );
  });

  it('handles command injection attempts', async () => {
    findMock.mockReturnValue('/cached/path');

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
    expect(runMock).toHaveReturned();

    expect(setFailedMock).toHaveBeenCalledWith(
      'Failed to execute command: Error: Command contains potentially dangerous characters. Please use simple commands only.'
    );
  });

  it('handles installation failure with retry', async () => {
    findMock.mockReturnValue('');

    // First npm install fails, second succeeds
    execMock.mockImplementation((cmd, args) => {
      if (cmd === 'npm' && args && args.includes('install') && args.includes('--prefix')) {
        throw new Error('Network error');
      }
      return Promise.resolve(0);
    });

    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'access-token':
          return 'sm_app_1234567890';
        default:
          return '';
      }
    });

    await main.run();
    expect(runMock).toHaveReturned();

    // Should have warned about failure
    expect(warningMock).toHaveBeenCalledWith('Initial installation failed, retrying...');

    // Should have tried global install as fallback
    expect(execMock).toHaveBeenCalledWith('npm', ['install', '-g', '@settlemint/sdk-cli@latest']);
  });

  it('processes dotEnvFile content', async () => {
    findMock.mockReturnValue('/cached/path');

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

    // Mock exportVariable
    const exportVariableMock = jest.spyOn(core, 'exportVariable').mockImplementation();

    await main.run();
    expect(runMock).toHaveReturned();

    // Check that environment variables were set correctly
    expect(exportVariableMock).toHaveBeenCalledWith('TEST_VAR', 'test_value');
    expect(exportVariableMock).toHaveBeenCalledWith('QUOTED', 'quoted value');
    expect(exportVariableMock).toHaveBeenCalledWith('VAR_WITH_EQUALS', 'key=value');
  });
});
