# Contributing to open-condo-platform

Contributions are always welcome. Please follow next recommendations:
1. Create new branch from `master`
2. Modify relevant files to achieve your aim
3. [Test new code](#testing) locally
4. Push your new branch to origin
5. Then create a pull request to the `master` branch.

## Testing

Unit test files should be named `[filename].test.js`. We use Jest for testing.

To start tests locally:
1. go to `apps/condo`
2. run `yarn dev` in separated terminal
3. run `yarn worker` in separated terminal
4. run `yarn test`

## Localization

Check [localization.md](localization.md)
