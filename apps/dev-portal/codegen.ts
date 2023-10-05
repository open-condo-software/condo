
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    overwrite: true,
    schema: '../dev-api/schema.graphql',
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
        afterAllFileWrite: ['eslint --fix'],
    },
}

export default config
