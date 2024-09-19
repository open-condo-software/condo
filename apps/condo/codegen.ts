import type { CodegenConfig } from '@graphql-codegen/cli'


const config: CodegenConfig = {
    overwrite: true,
    schema: 'schema.graphql',
    documents: 'domains/*/gql/client/*.graphql',
    generates: {
        'schema.ts': {
            plugins: [
                'typescript',
            ],
        },
        'codegen/graphql/operation.types.ts': {
            preset: 'import-types',
            presetConfig: {
                typesPath: '@app/condo/schema',
            },
            plugins: [
                'typescript-operations',
            ],
        },
        'codegen/graphql/client.utils.ts': {
            preset: 'import-types',
            presetConfig: {
                typesPath: '@condo/codegen/graphql/operation.types',
            },
            plugins: [
                'typescript-react-apollo',
            ],
        },
    },
    hooks: {
        afterAllFileWrite: ['eslint --fix --no-ignore'],
    },
}

export default config
