# Security Policy

## Supported versions

Security fixes are provided for the current `1.x` line.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
private vulnerability reporting for this repository, or contact the maintainer
through the address listed on their GitHub profile.

Include the affected version, a short description, reproduction steps, and any
relevant configuration.

## Trust model

This is a **Host plugin**: once installed, its `index.js` runs inside the DSH
process with the same filesystem access as the DSH user. Install it only from
source you trust.

The plugin:

- reads directory entries and file metadata to build a filename index;
- does **not** read file contents;
- registers one same-origin `GET` route, `/plugin-file-search/search`;
- does not send telemetry or call an external network service;
- stores a local cache of absolute file paths under the user's cache directory.

The search route replies only to requests that already reach the DSH Web
server. Do not expose the DSH Web port to untrusted networks while this plugin
is enabled.

## Sensitive data in the cache

The cache contains absolute paths visible to the local account. Delete it if
you need to remove that local record:

- Windows: `%LOCALAPPDATA%\dsh-file-search\index-v3.json`
- Other platforms: `$XDG_CACHE_HOME/dsh-file-search/` or `~/.cache/dsh-file-search/`

The next search rebuilds the index.
