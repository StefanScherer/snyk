import { runSnykCLI, runSnykCLIWithUserInputs } from '../../util/runSnykCLI';
import { fakeServer } from '../../../acceptance/fake-server';

// This only works with unix based systems
// const DOWN = '\x1B\x5B\x42';
// const UP = '\x1B\x5B\x41';
const ENTER = '\x0D';
// const SPACE = '\x20';

describe('snyk-apps: create app', () => {
  let server;
  let env: Record<string, string>;

  beforeAll((done) => {
    const port = process.env.PORT || process.env.SNYK_PORT || '12345';
    const baseApi = '/v3';
    env = {
      ...process.env,
      SNYK_API: 'http://localhost:' + port + baseApi,
      SNYK_API_V3: 'http://localhost:' + port + baseApi,
      SNYK_HOST: 'http://localhost:' + port,
      SNYK_TOKEN: '123456789',
      SNYK_DISABLE_ANALYTICS: '1',
    };
    server = fakeServer(baseApi, env.SNYK_TOKEN);
    server.listen(port, () => {
      done();
    });
  });

  afterEach(async () => {
    jest.resetAllMocks();
    server.restore();
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  const orgId = '4e0828f9-d92a-4f54-b005-6b9d8150b75f';
  const testData = {
    appName: 'Test',
    redirectURIs: 'https://example.com,https://example1.com',
    scopes: 'apps:beta',
    orgId,
  };

  describe('experimental flag', () => {
    it('should throw error without the experimental flag', async () => {
      const { stdout } = await runSnykCLI('apps create');
      expect(stdout).toContain(
        `The 'apps' command is only available with the '--experimental' flag`,
      );
    });
  });

  /**
   * Tests for the interactive mode of the command to create apps
   */
  describe('interactive mode', () => {
    it('should prompt for app name and print error if not provided', async () => {
      const { stdout } = await runSnykCLIWithUserInputs(
        'apps create --interactive --experimental',
        [ENTER],
        {
          env,
        },
      );
      // Assert for first question that is the name
      expect(stdout).toContain(
        'Name of the Snyk App (visible to users when they install the Snyk App)?',
      );
      // Assert to print error message when no name provided
      expect(stdout).toContain('Please enter something');
    });

    it('should prompt for redirect uris and print error if not provided', async () => {
      const {
        stdout,
      } = await runSnykCLIWithUserInputs(
        'apps create --interactive --experimental',
        [testData.appName, ENTER, 'something-invalid', ENTER],
        { env },
      );
      // Assert
      // Currently not able to test the whole printed text as it is wrapped to next line
      // TODO: look for way to increase the line length
      expect(stdout).toContain(
        "Your Snyk App's redirect URIs (comma seprated list.",
      );
      // Also checks if URI validator is working or not
      expect(stdout).toContain('is not a valid URL');
    });

    it('should prompt for scopes and print error if not provided', async () => {
      const {
        stdout,
      } = await runSnykCLIWithUserInputs(
        'apps create --interactive --experimental',
        [testData.appName, ENTER, testData.redirectURIs, ENTER, ENTER],
        { env },
      );
      // Assert
      expect(stdout).toContain(
        "Your Snyk App's permission scopes (comma separated",
      );
      expect(stdout).toContain('Please enter something');
    });

    it('should prompt for org id and use default if not provided', async () => {
      const {
        stdout,
      } = await runSnykCLIWithUserInputs(
        'apps create --interactive --experimental',
        [
          testData.appName,
          ENTER,
          testData.redirectURIs,
          ENTER,
          testData.scopes,
          ENTER,
          ENTER,
        ],
        { env },
      );
      // Assert
      expect(stdout).toContain('Please provide the org id under which');
    });

    it('should create app with user provided data (interactive mode)', async () => {
      const {
        stdout,
        code,
      } = await runSnykCLIWithUserInputs(
        'apps create --interactive --experimental',
        [
          testData.appName,
          ENTER,
          testData.redirectURIs,
          ENTER,
          testData.scopes,
          ENTER,
          testData.orgId,
          ENTER,
        ],
        { env },
      );
      // Assert
      expect(code).toBe(0);
      expect(stdout).toContain('Snyk App created successfully!');
      expect(stdout).toContain(`${testData.appName}`);
      expect(stdout).toContain(`${testData.redirectURIs.split(' ').join(',')}`);
      expect(stdout).toContain(`${testData.scopes.split(' ').join(',')}`);
    });

    // Interactive mode with flag shortcut (-i)
    it('should prompt users for input with flag shortcut (-i)', async () => {
      const { stdout } = await runSnykCLIWithUserInputs(
        'apps create --interactive --experimental',
        [ENTER],
        {
          env,
        },
      );
      // Assert for first question that is the name
      expect(stdout).toContain(
        'Name of the Snyk App (visible to users when they install the Snyk App)?',
      );
    });
  });

  describe('scriptable mode', () => {
    it('should throw error when org id not provided', async () => {
      const {
        code,
        stdout,
      } = await runSnykCLI(
        `apps create --name=${testData.appName} --redirect-uris=${testData.redirectURIs} --scopes=${testData.scopes} --experimental`,
        { env },
      );
      // Assert
      expect(code).toBe(2);
      expect(stdout).toContain(
        "Option '--org' is required! For interactive mode, please use '--interactive' or '-i' flag",
      );
    });

    it('should throw error when app name not provided', async () => {
      const {
        code,
        stdout,
      } = await runSnykCLI(
        `apps create --org=${testData.orgId} --redirect-uris=${testData.redirectURIs} --scopes=${testData.scopes} --experimental`,
        { env },
      );
      // Assert
      expect(code).toBe(2);
      expect(stdout).toContain(
        "Option '--name' is required! For interactive mode, please use '--interactive' or '-i' flag",
      );
    });

    it('should throw error when redirect uris not provided', async () => {
      const {
        code,
        stdout,
      } = await runSnykCLI(
        `apps create --org=${testData.orgId} --name=${testData.appName} --scopes=${testData.scopes} --experimental`,
        { env },
      );
      // Assert
      expect(code).toBe(2);
      expect(stdout).toContain(
        "Option '--redirect-uris' is required! For interactive mode, please use '--interactive' or '-i' flag",
      );
    });

    it('shoud throw error when scopes not provided', async () => {
      const {
        code,
        stdout,
      } = await runSnykCLI(
        `apps create --org=${testData.orgId} --name=${testData.appName} --redirect-uris=${testData.redirectURIs} --experimental`,
        { env },
      );
      expect(code).toBe(2);
      expect(stdout).toContain(
        "Option '--scopes' is required! For interactive mode, please use '--interactive' or '-i' flag",
      );
    });

    it('should create app with user provided data', async () => {
      const {
        code,
        stdout,
      } = await runSnykCLI(
        `apps create --org=${testData.orgId} --name=${testData.appName} --redirect-uris=${testData.redirectURIs} --scopes=${testData.scopes} --experimental`,
        { env },
      );
      // Assert
      expect(code).toBe(0);
      expect(stdout).toContain('Snyk App created successfully!');
      expect(stdout).toContain(`${testData.appName}`);
      expect(stdout).toContain(`${testData.redirectURIs.split(' ').join(',')}`);
      expect(stdout).toContain(`${testData.scopes.split(' ').join(',')}`);
    });
  });
});
