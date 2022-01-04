# snyk auth -- authenticate Snyk CLI with a Snyk account

## Usage

`snyk auth [<OPTIONS>]`

## Description

The snyk auth command authenticates the Snyk CLI with a Snyk account. Running `$ snyk auth` without an `<API_TOKEN>` opens a browser window and asks you to log in to your Snyk account and authorize.

In a CI/CD environment, use the `SNYK_TOKEN` environment variable; see [Configure the Snyk CLI, Environment variables](https://docs.snyk.io/features/snyk-cli/configure-the-snyk-cli#environment-variables).

## Debug

Use the `-d` to output the debug logs.
