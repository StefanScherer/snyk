import * as Debug from 'debug';
import {
  EAppsURL,
  getAppsURL,
  getV3Headers,
  handleCreateAppRes,
  handleV3Error,
  ICreateAppData,
  ICreateAppRes,
  IV3ErrorResponse,
  SNYK_APP_DEBUG,
} from '../../../lib/apps';
import { makeRequestV3 } from '../../../lib/request/promise';
import { spinner } from '../../../lib/spinner';

const debug = Debug(SNYK_APP_DEBUG);

export async function createApp(
  data: ICreateAppData,
): Promise<string | undefined> {
  debug('App data', data);
  const {
    orgId,
    snykAppName: name,
    snykAppRedirectUris: redirectUris,
    snykAppScopes: scopes,
  } = data;
  const payload = {
    method: 'POST',
    url: getAppsURL(EAppsURL.CREATE_APP, { orgId }),
    json: true,
    headers: getV3Headers(),
    body: {
      name,
      redirectUris,
      scopes,
    },
    qs: {
      version: '2021-08-11~experimental',
    },
  };

  try {
    await spinner('Creating your Snyk App');
    const response = await makeRequestV3<ICreateAppRes, IV3ErrorResponse>(
      payload,
    );
    debug(response);
    spinner.clearAll();
    return handleCreateAppRes(response);
  } catch (error) {
    spinner.clearAll();
    handleV3Error(error);
  }
}
