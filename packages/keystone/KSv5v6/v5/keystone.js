const { Keystone: DefaultKeystone } = require('@open-keystone/keystone')
const { gql } = require('apollo-server-express')
const { GraphQLScalarType, GraphQLError } = require('graphql')
const { Kind } = require('graphql/language')
const Upload = require('graphql-upload/Upload.js')

const { _patchResolverWithGQLContext } = require('../utils/resolvers')


const CustomFileScalar = new GraphQLScalarType({
    name: 'CustomUpload',
    description: 'File, that could be loaded through new file server or by legacy way',
    parseValue (value) {
        if (value instanceof Upload) return value.promise
        if (typeof value === 'string' || typeof value === 'object') return value
        console.log(value)
        return value
    },
    serialize () {
        throw new GraphQLError('Upload serialization unsupported.')
    },
    parseLiteral (ast) {
        console.log(ast)
        if (ast.kind === Kind.STRING) {
            return ast.value
        }
        return ast.value
    },
})


class Keystone extends DefaultKeystone {
    getTypeDefs ({ schemaName }) {
        const originalTypeDefs = super.getTypeDefs({ schemaName })

        return [...originalTypeDefs, gql('scalar CustomUpload')]
    }
    getResolvers ({ schemaName }) {
        const originalResolvers = super.getResolvers({ schemaName })

        return _patchResolverWithGQLContext({ ...originalResolvers, CustomUpload: CustomFileScalar })
    }

}

module.exports = {
    Keystone,
}
