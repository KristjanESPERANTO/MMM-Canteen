# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.3](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.5.2...v2.5.3) - 2025-05-04 - Maintenance update

### Changed

- chore: refactor ESLint config to use `defineConfig` and cleanup rules
- chore: remove `engines` field from `package.json`. Since older Node versions reached EOL a long time ago, this no longer makes much sense.
- chore: remove unused release script
- chore: setup `husky` and `lint-staged`
- chore: update devDependencies
- chore: use `node --run` instead of `npm run` for CI and development command

## [2.5.2](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.5.1...v2.5.2) - 2025-04-21

### Changed

- chore: update devDependencies
- chore: reorder importConfigs and update stylistic rules
- docs: add npm install command to developer commands section
- refactor: replace 'self' with 'that' for consistency in context binding

## [2.5.1](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.5.0...v2.5.1) - 2025-04-06 - Maintenance update

### Changed

- chore: Update devDependencies
- refactor: update ESLint configuration to use new import plugin structure

## [2.5.0](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.4.0...v2.5.0) - 2025-03-12

### Changed

- Replace `Temporal` API by built-in `Date` API. With that the module doesn't need a dependency to run anymore.

## [2.4.0](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.3.4...v2.4.0) - 2025-03-12

### Fixed

- Fix switchTime bug (seems it appeared with the switch to dayjs).

### Changed

- Replace `dayjs` by `Temporal` API
- Display date according to the `locale` value indicated in the config.js file
- chore: Disable no-duplicate-heading rule in markdownlint
- chore: Improve logging

## [2.3.4](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.3.3...v2.3.4) - 2025-03-11

### Fixed

- Fix position in examples

### Changed

- chore: Update devDependencies
- chore: Optimize ESLint stylistic configuration
- chore: Simplify stylelint configuration

## [2.3.3](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.3.2...v2.3.3) - 2025-02-24

### Changed

- Replace `moment.js` by `day.js`
- chore: Update devDependencies
- chore: Simplify ESLint calls
- chore: Replace `eslint-plugin-import` with `eslint-plugin-import-x`
- chore: Sort `package.json` keys

### Added

- chore: Add License and Changelog sections to README
- chore: Add GitHub workflow

## [2.3.2](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.3.1...v2.3.2) - 2024-12-17 - Maintenance update

- chore: Add Code of Conduct
- chore: Add release script
- chore: Add description to CHANGELOG.md
- chore: Correct formatting of copyright notices
- chore: Update devDependencies
- chore: Add "@eslint/json" and "@eslint/markdown" for linting markdown and JSON files

## [2.3.1](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.3.0...v2.3.1) - 2024-11-04 - Maintenance update

- Add spell check
- Update dependencies
- Update license file

## [2.3.0](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.2.0...v2.3.0) - 2023-08-15

- Remove 'node-fetch' dependency (use build-in fetch API instead)

## [2.2.0](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.1.0...v2.2.0) - 2022-12-21

- Add veggie column 🌱

## [2.1.0](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v2.0.0...v2.1.0) - 2022-12-20

- Add support for multiple instances 🙂

## [2.0.0](https://github.com/KristjanESPERANTO/MMM-Canteen/compare/v1.1.0...v2.0.0) - 2022-12-18

First fork version 🚀

- Handle closed days: Inspired by the fork of joshua-martius: <https://github.com/joshua-martius/MMM-Canteen>
- Replace deprecated 'request' by 'node-fetch'
- Some rework like linting and formatting
- Optimize CSS
- Optimize installation process
- Fix issues
