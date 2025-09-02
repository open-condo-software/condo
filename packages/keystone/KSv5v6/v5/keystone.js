const { Keystone: DefaultKeystone } = require('@open-keystone/keystone')
const { GraphQLScalarType, GraphQLError } = require('graphql')
const Upload = require('graphql-upload/Upload.js')

const { _patchResolverWithGQLContext } = require('../utils/resolvers')


const FileMetaScalar = new GraphQLScalarType({
    name: 'FileMeta',
    description: 'File, that could be loaded through new file server or by legacy way',
    parseValue (value) {
        // NOTE: legacy way to upload file
        if (value instanceof Upload) return value.promise
        if (typeof value === 'string') return value
        return value
    },
    parseLiteral (node) {
        // NOTE: legacy error style as well
        throw new GraphQLError('Upload literal unsupported.', { nodes: node })
    },
    serialize () {
        throw new GraphQLError('Upload serialization unsupported.')
    },
})


class Keystone extends DefaultKeystone {
    getResolvers ({ schemaName }) {
        const originalResolvers = super.getResolvers({ schemaName })

        return _patchResolverWithGQLContext({ ...originalResolvers, FileMeta: FileMetaScalar })
    }
}

module.exports = {
    Keystone,
}
