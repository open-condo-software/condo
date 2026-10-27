# Create Condo App

A CLI tool for scaffolding condo miniapps. It sets up the project structure, installs dependencies, and configures the development environment based on templates.

## Getting Started

### Interactive

You can create a new project interactively by running init command depending on your package manager:

#### NPM

```bash
npx create-condo-app@latest
```

#### Yarn

```bash
yarn create condo-app
```

#### PNPM
```
pnpm create condo-app
```

You will be asked for the name of your project, and then guided through the setup process:

```
What is your project named? my-condo-app
Which template would you like to use? trpc
Would you like to add examples? Yes
Would you like to include AGENTS.md to guide coding agents to write relevant code? Yes
```

### Non-Interactive

You can also pass arguments to skip the prompts. Use `--help` flag to see all available options


## Why use Create Condo App?

- **Template-based scaffolding**: Start from pre-configured templates for different miniapp types
- **Condo readiness**: OIDC authorization / translations and GQL setup handled out of the box, so you can focus on business logic instead of tech aspects
- **Useful examples**: Each template comes with example files to help you get started
- **Agents-friendly**: AGENTS.md included to guide coding agents to write relevant code
- **Monorepo awareness**: Automatically detects monorepo setups, so you can store multiple miniapps in the same repository
- **Preference persistence**: Remembers your choices for faster subsequent project creation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub issue tracker](https://github.com/open-condo-software/condo/issues).
