import * as uuid from 'uuid';

/**
 *
 * @param {String} input of space separated URL/URI passed by
 * user for redirect URIs
 * @returns { String | Boolean } complying with inquirer return values, the function
 * separates the string on space and validates each to see
 * if a valid URL/URI. Return a string if invalid and
 * boolean true if valid
 */
export function validateAllURL(input: string): string | boolean {
  const trimmedInput = input.trim();
  let errMessage = '';
  for (const i of trimmedInput.split(' ')) {
    if (typeof validURL(i) == 'string')
      errMessage = errMessage + `\n${validURL(i)}`;
  }

  if (errMessage) return errMessage;
  return true;
}

/**
 *
 * @param {String} input of URI/URL value to validate using
 * regex
 * @returns {String | Boolean } string message is not valid
 * and boolean true if valid
 */
export function validURL(input: string): boolean | string {
  const pattern = new RegExp(
    '^(http(s)?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))|' + // OR ip (v4) address
    'localhost' + // OR localhost ( cases such as our demo app uses localhost )
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // fragment locator
  const isValid = !!pattern.test(input);
  return isValid ? true : `${input} is not a valid URL`;
}

/**
 * @param {String} input UUID to be validated
 * @returns {String | Boolean } string message is not valid
 * and boolean true if valid
 */
export function validateUUID(input: string): boolean | string {
  return uuid.validate(input) ? true : 'Invalid UUID provided';
}

/**
 * @param {String} input
 * @returns {String | Boolean } string message is not valid
 * and boolean true if valid
 */
export function validInput(input: string): string | boolean {
  if (!input) return 'Please enter something';
  return true;
}
