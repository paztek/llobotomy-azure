# LLobotoMy for Azure

[![Continuous Integrations](https://github.com/paztek/llobotomy-azure/actions/workflows/continuous-integrations.yaml/badge.svg?branch=main)](https://github.com/paztek/llobotomy-azure/actions/workflows/continuous-integrations.yaml)
[![License](https://badgen.net/github/license/paztek/llobotomy-azure)](./LICENSE)
[![Package tree-shaking](https://badgen.net/bundlephobia/tree-shaking/llobotomy-azure)](https://bundlephobia.com/package/llobotomy-azure)
[![Package minified & gzipped size](https://badgen.net/bundlephobia/minzip/llobotomy-azure)](https://bundlephobia.com/package/llobotomy-azure)
[![Package dependency count](https://badgen.net/bundlephobia/dependency-count/reactllobotomy-azure)](https://bundlephobia.com/package/llobotomy-azure)

This library is a temporary solution for those of us who are using Azure Open AI APIs instead of the public Open AI APIs.
At the time of this writing, the Azure OpenAI API doesn't expose the Assistants API so we're emulating it using the other APIs (mainly Chat Completions with Function Calling).

The library aims at having roughly the same public API as my other NPM package [LLobotoMy](https://github.com/paztek/llobotomy).

## Installation

This library is published in the NPM registry and can be installed using any compatible package manager.

```sh
npm install llobotomy-azure --save

# For Yarn, use the command below.
yarn add llobotomy-azure
```

## Documentation

[Documentation generated from source files by Typedoc](./docs/README.md).

## License

Released under [MIT License](./LICENSE).
