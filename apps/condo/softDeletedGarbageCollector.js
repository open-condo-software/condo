const { get } = require('lodash')

const { getSchemaDependenciesGraph, getAllRelations, getSchemaDependencies, find} = require('@open-condo/keystone/schema')

const { keystone, schemas } = require('./index')

const b = 3

const PROTECT = 'models.PROTECT'
const SET_NULL = 'models.SET_NULL'
const CASCADE = 'models.CASCADE'

const getMetaFromKeystoneField = (keystoneField) => {
    const { path, many = false, refListKey, config } = keystoneField
    const onDelete = get(config, ['kmigratorOptions', 'on_delete'])
    return {
        path,
        onDelete,
        refListKey,
        keystoneField,
        many,
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

const hasObjs = (schemaName, path, objId) => {
    // BillingReceipt { path: objId }
    const where = { [path]: { id: objId }, deletedAt: null }

    // If there are any objects that have this ID
    return find(schemaName, where)
}

const canDelete = (listName, obj) => {
    // BillingIntegration
    const relations = getSchemaDependencies(listName)

    /**
     * {
     *   "from": "BillingIntegrationAccessRight",
     *   "to": "BillingIntegration",
     *   "path": "integration",
     *   "onDelete": "models.PROTECT",
     *   "many": false
     * }
     */
    relations.forEach((rel) => {
        if (rel.onDelete === PROTECT) {
            if (hasObjs(rel.from, rel.path, obj.id)) {
                throw new Error(`You can not delete this instance of ${rel.to}, since related object from ${rel.from} exists, and on_delete rule is set to ${rel.onDelete}`)
            }
        }
        if (rel.onDelete === CASCADE) {
            canDelete(rel.from)
        }
    })

    return true
}

const getCascadeDeletionGraph = {

}

const schema = getAllRelations()


const schema1 = getSchemaDependencies('BillingIntegration')
const schema2 = getSchemaDependencies('User')
const schema3 = getSchemaDependencies('Organization')

const x = 15