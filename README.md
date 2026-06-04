# World-agent interaction

Built for an internship application with https://thehumanoid.ai.

## Installation/setup

1. Clone the repository
2. Ensure you have a recent version of [node.js](https://nodejs.org) installed
3. Run `npm ci` to install dependencies as listed in `package-lock.json`.
4. Get a gemini API key from [google ai studio](https://aistudio.google.com), which needs to be put in the [`.env`](./.env) file.
5. You can tweak other configuration settings in `.env`, including the choice of model to use. The provided `.env` file is commented so that configuration settings can be easily understood hopefully.

*Note*: `.env` is gitignored so that API keys aren't accidentally committed. API keys should never be uploaded publicly.

## License

This repository is licensed under the [MPL-2.0 license](./LICENSE).
