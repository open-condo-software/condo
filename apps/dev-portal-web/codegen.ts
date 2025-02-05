import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    overwrite: true,
    schema: '../dev-portal-api/schema.graphql',
    documents: 'lib/gql/**/*.graphql',
    require: 'ts-node/register',
    generates: {
        'lib/gql/index.ts': {
            plugins: [
                'typescript',
                'typescript-operations',
                'typescript-react-apollo',
            ],
        },
    },
    hooks: {
        // TODO(INFRA-744): remove eslint after move lib/gql/index.ts to gql/index.ts
        afterAllFileWrite: ['eslint --fix'],
    },
}

export default config
