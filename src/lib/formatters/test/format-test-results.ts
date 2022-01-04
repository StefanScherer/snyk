import { Options, OutputDataTypes } from '../../types';
import { getReachabilityJson } from '../format-reachability';
import { GroupedVuln, SEVERITY, VulnMetaData } from '../../snyk-test/legacy';

const cloneDeep = require('lodash.clonedeep');
import { createSarifOutputForContainers } from '../sarif-output';
import { createSarifOutputForIac } from '../iac-output';
import { isNewVuln, isVulnFixable } from '../../vuln-helpers';
import { jsonStringifyLargeObject } from '../../json';
import { createSarifOutputForOpenSource } from '../open-source-sarif-output';
import { getSeverityValue } from '../get-severity-value';

export function formatJsonVulnerabilityStructure(jsonData, options: Options) {
  const jsonDataClone = cloneDeep(jsonData);

  if (options['group-issues']) {
    jsonDataClone.vulnerabilities = Object.values(
      (jsonDataClone.vulnerabilities || []).reduce((acc, vuln): Record<
        string,
        any
      > => {
        vuln.from = [vuln.from].concat(acc[vuln.id]?.from || []);
        vuln.name = [vuln.name].concat(acc[vuln.id]?.name || []);
        acc[vuln.id] = vuln;
        return acc;
      }, {}),
    );
  }

  if (jsonDataClone.vulnerabilities) {
    jsonDataClone.vulnerabilities.forEach((vuln) => {
      if (vuln.reachability) {
        vuln.reachability = getReachabilityJson(vuln.reachability);
      }
    });
  }
  return jsonDataClone;
}

export function extractDataToSendFromResults(
  results,
  jsonData,
  options: Options,
): OutputDataTypes {
  let sarifData = {};
  let stringifiedSarifData = '';
  if (options.sarif || options['sarif-file-output']) {
    if (options.iac) {
      sarifData = createSarifOutputForIac(results);
    } else if (options.docker) {
      sarifData = createSarifOutputForContainers(results);
    } else {
      sarifData = createSarifOutputForOpenSource(results);
    }
    stringifiedSarifData = jsonStringifyLargeObject(sarifData);
  }

  let stringifiedJsonData = '';
  if (options.json || options['json-file-output']) {
    if (Array.isArray(jsonData)) {
      const jsonResult = jsonData.map((res) =>
        formatJsonVulnerabilityStructure(res, options),
      );
      stringifiedJsonData = jsonStringifyLargeObject(jsonResult);
    } else {
      stringifiedJsonData = jsonStringifyLargeObject(
        formatJsonVulnerabilityStructure(jsonData, options),
      );
    }
  }

  const dataToSend = options.sarif ? sarifData : jsonData;
  const stringifiedData = options.sarif
    ? stringifiedSarifData
    : stringifiedJsonData;

  return {
    stdout: dataToSend, // this is for the human-readable stdout output and is set (but not used) even if --json or --sarif is set
    stringifiedData, // this will be used to display either the Snyk or SARIF format JSON to stdout if --json or --sarif is set
    stringifiedJsonData, // this will be used for the --json-file-output=<file.json> option
    stringifiedSarifData, // this will be used for the --sarif-file-output=<file.json> option
  };
}

export function createErrorMappedResultsForJsonOutput(results) {
  const errorMappedResults = results.map((result) => {
    // add json for when thrown exception
    if (result instanceof Error) {
      return {
        ok: false,
        error: result.message,
        path: (result as any).path,
      };
    }
    return result;
  });

  return errorMappedResults;
}

export function groupVulnerabilities(
  vulns,
): {
  [vulnId: string]: GroupedVuln;
} {
  return vulns.reduce((map, curr) => {
    if (!map[curr.id]) {
      map[curr.id] = {};
      map[curr.id].list = [];
      map[curr.id].metadata = metadataForVuln(curr);
      map[curr.id].isIgnored = false;
      map[curr.id].isPatched = false;
      // Extra added fields for ease of handling
      map[curr.id].title = curr.title;
      map[curr.id].note = curr.note;
      map[curr.id].severity = curr.severity as SEVERITY;
      map[curr.id].originalSeverity = curr.originalSeverity as SEVERITY;
      map[curr.id].isNew = isNewVuln(curr);
      map[curr.id].name = curr.name;
      map[curr.id].version = curr.version;
      map[curr.id].fixedIn = curr.fixedIn;
      map[curr.id].dockerfileInstruction = curr.dockerfileInstruction;
      map[curr.id].dockerBaseImage = curr.dockerBaseImage;
      map[curr.id].nearestFixedInVersion = curr.nearestFixedInVersion;
      map[curr.id].legalInstructionsArray = curr.legalInstructionsArray;
      map[curr.id].reachability = curr.reachability;
    }

    map[curr.id].list.push(curr);
    if (!map[curr.id].isFixable) {
      map[curr.id].isFixable = isVulnFixable(curr);
    }

    if (!map[curr.id].note) {
      map[curr.id].note = !!curr.note;
    }

    return map;
  }, {});
}

function metadataForVuln(vuln): VulnMetaData {
  return {
    id: vuln.id,
    title: vuln.title,
    description: vuln.description,
    type: vuln.type,
    name: vuln.name,
    info: vuln.info,
    severity: vuln.severity,
    severityValue: getSeverityValue(vuln.severity),
    isNew: isNewVuln(vuln),
    version: vuln.version,
    packageManager: vuln.packageManager,
  };
}
