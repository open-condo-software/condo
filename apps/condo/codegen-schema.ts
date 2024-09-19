import type { CodegenConfig } from '@graphql-codegen/cli'


const config: CodegenConfig = {
    overwrite: true,
    schema: 'schema.graphql',
    documents: 'domains/**/*.graphql',
    generates: {
        'schema.ts': {
            plugins: [
                'typescript',
            ],
        },
    },
    hooks: {
        afterAllFileWrite: ['eslint --fix --no-ignore'],
    },
}


export default config
