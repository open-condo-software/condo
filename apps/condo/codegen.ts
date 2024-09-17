import type { CodegenConfig } from '@graphql-codegen/cli'

// общие типы и утилиты по доменам
// const config: CodegenConfig = {
//     overwrite: true,
//     schema: 'schema.graphql',
//     documents: 'domains/**/*.graphql',
//     generates: {
//         'graphql.ts': {
//             plugins: [
//                 'typescript',
//             ],
//         },
//         'domains/': {
//             preset: 'near-operation-file',
//             presetConfig: {
//                 extension: '.client.utils.ts',
//                 baseTypesPath: './../graphql.ts',
//                 // filename: 'index',
//                 folder: './',
//             },
//             plugins: [
//                 'typescript-operations',
//                 'typescript-react-apollo',
//             ],
//             config: {
//                 // withHooks: true,
//                 // reactApolloVersion: 3,
//                 // skipTypename: false,
//                 avoidOptional: true,
//                 preResolveTypes: true,
//             },
//         },
//     },
//     // hooks: {
//     //     afterAllFileWrite: ['eslint --fix'],
//     // },
// }


// типы и утилиты раздельно (но типы утилит отдельно от утилит === в типах есть импорты)
// const config: CodegenConfig = {
//     overwrite: true,
//     schema: 'schema.graphql',
//     documents: 'domains/**/*.graphql',
//     // require: 'ts-node/register',
//     generates: {
//         'graphql.ts': {
//             plugins: [
//                 'typescript',
//                 'typescript-operations',
//             ],
//             config: {
//                 addOperationExport: true,
//                 preResolveType: true,
//                 // onlyOperationTypes: true,
//                 // useTypeImports: true,
//                 // importOperationTypesFrom: './graphql',
//             },
//         },
//         'client.utils.ts': {
//             preset: 'import-types',
//             presetConfig: {
//                 typesPath: './graphql',
//             },
//             plugins: [
//                 'typescript-react-apollo',
//             ],
//         },
//     },
//     // hooks: {
//     //     afterAllFileWrite: ['eslint --fix'],
//     // },
// }


const config: CodegenConfig = {
    overwrite: true,
    schema: 'schema.graphql',
    documents: 'domains/**/*.graphql',
    require: 'ts-node/register',
    generates: {
        'lib/gql/index.ts': {
            config: {
                preResolveType: true,
                onlyOperationTypes: true,
            },
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
