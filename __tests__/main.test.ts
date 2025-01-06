/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as main from '../src/main';

// Mock the action's main function
const runMock = jest.spyOn(main, 'run');

// Mock the GitHub Actions core library
let _debugMock: jest.SpiedFunction<typeof core.debug>;
let errorMock: jest.SpiedFunction<typeof core.error>;
let getInputMock: jest.SpiedFunction<typeof core.getInput>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;

// Mock the exec library
let execMock: jest.SpiedFunction<typeof exec.exec>;

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    _debugMock = jest.spyOn(core, 'debug').mockImplementation();
    errorMock = jest.spyOn(core, 'error').mockImplementation();
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation();
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation();
    execMock = jest.spyOn(exec, 'exec').mockImplementation();
  });

  it('installs CLI and runs command', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'auto-connect':
          return 'false';
        default:
          return '';
      }
    });

    await main.run();
    expect(runMock).toHaveReturned();

    expect(execMock).toHaveBeenNthCalledWith(1, 'npm', ['install', '-g', '@settlemint/sdk-cli@latest']);
    expect(execMock).toHaveBeenNthCalledWith(2, 'settlemint', ['status']);
    expect(errorMock).not.toHaveBeenCalled();
  });

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
    expect(runMock).toHaveReturned();

    expect(execMock).toHaveBeenNthCalledWith(1, 'npm', ['install', '-g', '@settlemint/sdk-cli@latest']);
    expect(execMock).toHaveBeenNthCalledWith(2, 'settlemint', ['login', '-a']);
    expect(execMock).toHaveBeenNthCalledWith(3, 'settlemint', ['connect', '-a']);
    expect(execMock).toHaveBeenNthCalledWith(4, 'settlemint', ['status']);
  });

  it('does not auto-connect when using an application access token', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
        case 'auto-connect':
          return 'true';
        case 'access-token':
          return 'sm_aat_1234567890';
        default:
          return '';
      }
    });

    await main.run();
    expect(runMock).toHaveReturned();

    expect(execMock).toHaveBeenNthCalledWith(1, 'npm', ['install', '-g', '@settlemint/sdk-cli@latest']);
    expect(execMock).not.toHaveBeenCalledWith('settlemint', ['login', '-a']);
    expect(execMock).not.toHaveBeenCalledWith('settlemint', ['connect', '-a']);
    expect(execMock).toHaveBeenNthCalledWith(2, 'settlemint', ['status']);
  });

  it('sets environment variables when provided', async () => {
    getInputMock.mockImplementation((name) => {
      switch (name) {
        case 'command':
          return 'status';
        case 'version':
          return 'latest';
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
  });

  it('handles errors gracefully', async () => {
    execMock.mockRejectedValue(new Error('CLI installation failed'));

    await main.run();
    expect(runMock).toHaveReturned();

    expect(setFailedMock).toHaveBeenCalledWith('CLI installation failed');
  });
});
