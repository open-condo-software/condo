const { get } = require('lodash')

const { getSchemaDependenciesGraph } = require('@open-condo/keystone/schema')

const { keystone, schemas } = require('./index')

const b = 3

const getMetaFromKeystoneField = (keystoneField) => {
    const { path, refListKey, config } = keystoneField
    const onDelete = get(config, ['kmigratorOptions', 'on_delete'])
    return {
        path,
        onDelete,
        refListKey,
        keystoneField,
    }
}

const getSchemasMetaFromKeystone = (keystone) => {
    const { listsArray } = keystone

    console.log(listsArray)

    const listsMeta = listsArray.reduce(
        (result, list) => {
            const rels = list.fields.reduce(
                (rels, field) => {
                    if (field.isRelationship) {
                        rels.push(getMetaFromKeystoneField(field))
                    }
                    return rels
                },
                []
            )

            if (rels.length > 0) {
                result[list.key] = rels
            }

            return result
        },
        {}
    )

    return listsMeta
}

const collectGarbageForList = (listName) => {

}

const collectGarbage = () => {

}

const schema = getSchemaDependenciesGraph('BillingIntegrationOrganizationContext')

const x = 15