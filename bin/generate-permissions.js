const fs = require('fs')
const path = require('path')
const { capitalize } = require('lodash')
const { GQLListSchema, GQLCustomSchema } = require('../packages/@core.keystone/schema')
const gql = require('graphql-tag')

const appDir =  path.resolve(__dirname, '..', 'apps', 'condo')
const domainsDir = path.resolve(appDir, 'domains')
const domains =  fs.readdirSync(domainsDir).filter(d => fs.lstatSync(path.resolve(domainsDir, d)).isDirectory())

const permissions = []
domains.forEach(domainName => {
    const domainSchemaPath = path.resolve(domainsDir, domainName, 'schema/index.js')
    if (fs.existsSync(domainSchemaPath)){
        console.log('Loaded file', domainSchemaPath)
        const services = require(domainSchemaPath)
        Object.values(services).forEach(service => {
            if (service instanceof GQLListSchema) {
                if (!service.schema.access) return
                Object.getOwnPropertyNames(service.schema.access).forEach(crudOperation => {
                    const permissionName = `can${capitalize(crudOperation)}${service.name}s`
                    permissions.push(permissionName)
                })
            }
            else if (service instanceof GQLCustomSchema) {
                if (!service.schema.mutations) return
                service.schema.mutations.forEach(mutation => {
                    const gqlMutationSchemaName = gql('type A { ' + mutation.schema + ' }')
                    const mutationName = gqlMutationSchemaName.definitions[0].fields[0].name.value
                    const permissionName = `can${capitalize(mutationName)}`
                    permissions.push(permissionName)
                })
            }
        })
    }
})
fs.writeFileSync(path.resolve(appDir, 'docs', 'permissions.md'), permissions.join('\n'))
process.exit(0)