/**
 * Collection of utility function for the
 * $snyk apps commands
 */
import {
  createDisplayErrTable,
  createDisplayInfoTable,
  EAppsURL,
  IApiV3Headers,
  ICreateAppRes,
  IGetAppsURLOpts,
  IV3ErrorResponse,
  SNYK_APP_DEBUG,
} from '.';
import { getAuthHeader } from '../api-token';
import chalk from 'chalk';
import { AuthFailedError } from '../errors';
import * as Debug from 'debug';
import config from '../config';

const debug = Debug(SNYK_APP_DEBUG);

export function getAppsURL(
  selection: EAppsURL,
  opts: IGetAppsURLOpts = {},
): string {
  // Get the V3 URL from user config
  // Environment variable takes precendence over config
  const baseURL = process.env.SNYK_API_V3 || config.API_V3;
  debug(`Base URL => ${baseURL}`);

  switch (selection) {
    case EAppsURL.CREATE_APP:
      return `${baseURL}/orgs/${opts.orgId}/apps`;
    default:
      return baseURL;
  }
}

export function getV3Headers(): IApiV3Headers {
  return {
    'Content-Type': 'application/vnd.api+json',
    authorization: getAuthHeader(),
  };
}

export function handleV3Error(error: any): void {
  if (error.code) {
    if (error.code === 400) {
      // Bad request
      const responseJSON: IV3ErrorResponse = error.body;
      const errString = errorsToDisplayString(responseJSON);
      throw new Error(errString);
    } else if (error.code === 401) {
      // Unauthorized
      throw AuthFailedError(
        'Unauthorized: the request requires an authentication token or a token with more permissions.',
      );
    } else if (error.code === 403) {
      throw new Error(
        'Forbidden: the authentication token does not have access to the resource.',
      );
    } else if (error.code === 404) {
      const responseJSON: IV3ErrorResponse = error.body;
      const errString = errorsToDisplayString(responseJSON);
      throw new Error(errString);
    } else {
      throw new Error(error.message);
    }
  } else {
    throw error;
  }
}

/**
 *
 * @param errRes V3Error response
 * @returns {String} Iterates over error and
 * converts them into a readible string
 */
function errorsToDisplayString(errRes: IV3ErrorResponse): string {
  const resString = 'Uh oh! something went wrong';
  const data: string[][] = [];
  if (!errRes.errors) return resString;
  errRes.errors.forEach((e) => {
    let metaString = '',
      sourceString = '';
    if (e.meta) {
      for (const [key, value] of Object.entries(e.meta)) {
        metaString += `${key}: ${value}\n`;
      }
    }
    if (e.source) {
      for (const [key, value] of Object.entries(e.source)) {
        sourceString += `${key}: ${value}\n`;
      }
    }

    const meta = metaString || '-';
    const source = sourceString || '-';
    data.push(['Description', `${e.detail}`]);
    data.push(['Request Status', `${e.status}`]);
    data.push(['Source', `${source}`]);
    data.push(['Meta', `${meta}`]);
  });
  return createDisplayErrTable(resString, 'Error details', data);
}

export function handleCreateAppRes(res: ICreateAppRes): string {
  const {
    name,
    clientId,
    redirectUris,
    scopes,
    isPublic,
    clientSecret,
  } = res.data.attributes;

  const data = [
    ['App Name', chalk.greenBright(name)],
    ['Client ID', chalk.greenBright(clientId)],
    ['Redirect URIs', chalk.greenBright(redirectUris.toString())],
    ['Scopes', chalk.greenBright(scopes.toString())],
    ['Is App Public', chalk.greenBright(`${isPublic}`)],
    [
      `Client Secret(${chalk.redBright('keep it safe and protected')})`,
      chalk.greenBright(clientSecret),
    ],
  ];
  return createDisplayInfoTable(
    'Snyk App created successfully!',
    data,
    'Please ensure you save the following details:',
  );
}
