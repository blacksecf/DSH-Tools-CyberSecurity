# Contributing

Thanks for taking a look at DSH File Search.

## Ground rules

- Keep the plugin dependency-free and build-free. The Host and Client halves are
  plain JavaScript.
- Keep the Client half limited to the `react` require. Do not import Harness
  Client packages such as `@deepseek-ai/dsh-client-ui-primitives`.
- Do not add network requests, telemetry, or a second HTTP origin.
- Keep the panel and launcher usable with a keyboard, a pointer, and touch.

## Before opening a pull request

```bash
npm run check
```

This runs syntax checks plus `scripts/check.mjs`, which verifies:

- `package.json` metadata;
- the package name, Client module id, and patch row name stay in sync;
- exported files exist;
- locale metadata is present;
- the icon is a valid SVG within the bundle size limit.

There are no runtime or development dependencies, so `npm install` is not
required.

## Testing a change

1. Install the repository directory as a DSH bundle from its absolute path.
2. Enable `include:file-search` if it is not already enabled.
3. Open the Web UI, refresh once, and try the search flow.
4. Test the draggable panel and launcher, keyboard navigation, and copy.
5. For changes to indexing, remove the cache and verify a fresh build as well as
   the warm-cache path.

Use a disposable DSH profile for destructive tests.

## Pull requests

Keep changes focused. Include:

- what changed and why;
- how it was tested;
- any change to the default index scope, cache format, or HTTP contract.
