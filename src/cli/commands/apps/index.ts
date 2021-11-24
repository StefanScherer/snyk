import * as Debug from 'debug';
import { MethodArgs } from '../../args';
import { processCommandArgs } from '../process-command-args';
import {
  EValidSubCommands,
  validAppsSubCommands,
  createAppPrompts,
  SNYK_APP_NAME,
  SNYK_APP_REDIRECT_URIS,
  SNYK_APP_SCOPES,
  SNYK_APP_ORG_ID,
  SNYK_APP_DEBUG,
  ICreateAppOptions,
  ICreateAppData,
  AppsErrorMessages,
} from '../../../lib/apps';
import * as inquirer from '@snyk/inquirer';
import { createApp } from './create-app';

const debug = Debug(SNYK_APP_DEBUG);

export default async function apps(
  ...args0: MethodArgs
): Promise<string | undefined | any> {
  debug('Snyk apps CLI called');

  const { options, paths } = processCommandArgs<ICreateAppOptions>(...args0);
  debug(options, paths);

  if (!options.experimental) throw new Error(AppsErrorMessages.useExperimental);

  const commandVerb1 = paths[0];
  const validCommandVerb =
    commandVerb1 && validAppsSubCommands.includes(commandVerb1);

  if (!validCommandVerb) {
    // Display what is available
    debug(`Not a valid sub command ${commandVerb1}`);
    return AppsErrorMessages.availableCommands;
  }

  if (commandVerb1 === EValidSubCommands.CREATE) {
    if (options.interactive) {
      // Proceed with interactive
      const answers = await inquirer.prompt(createAppPrompts);
      // Process answers
      const snykAppName = answers[SNYK_APP_NAME].trim() as string;
      const snykAppRedirectUris = answers[SNYK_APP_REDIRECT_URIS].trim().split(
        ',',
      ) as string[];
      const snykAppScopes = answers[SNYK_APP_SCOPES].trim().split(
        ',',
      ) as string[];
      const orgId = answers[SNYK_APP_ORG_ID];
      // POST: to create an app
      const res = await createApp({
        orgId,
        snykAppName,
        snykAppRedirectUris,
        snykAppScopes,
      });
      if (res) return res;
    } else {
      // Required options are name, redirectUris, scopes, and org
      const createAppData = validateProcessCreateAppOpts(options);
      const res = await createApp(createAppData);
      if (res) return res;
    }
  } else {
    debug(`Not a valid sub command ${commandVerb1}`);
    return AppsErrorMessages.availableCommands;
  }
}

function validateProcessCreateAppOpts(
  options: ICreateAppOptions,
): ICreateAppData {
  if (!options.org) {
    throw new Error(AppsErrorMessages.orgRequired);
  } else if (!options.name) {
    throw new Error(AppsErrorMessages.nameRequired);
  } else if (!options['redirect-uris']) {
    throw new Error(AppsErrorMessages.redirectUrisRequired);
  } else if (!options.scopes) {
    throw new Error(AppsErrorMessages.scopesRequired);
  } else {
    return {
      orgId: options.org,
      snykAppName: options.name,
      snykAppRedirectUris: options['redirect-uris'].split(','),
      snykAppScopes: options.scopes.split(','),
    };
  }
}
