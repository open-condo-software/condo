const { Implementation, Integer } = require('@keystonejs/fields')
const { MongooseFieldAdapter } = require('@keystonejs/adapter-mongoose')
const { KnexFieldAdapter } = require('@keystonejs/adapter-knex')
const knex = require('knex')

class AutoIncrementInteger extends Integer.implementation {
    async validateInput ({ resolvedData, addFieldValidationError }) {
        const value = resolvedData[this.path]
        if (value) {
            const list = this.getListByKey(this.listKey)
            const listAdapter = list.adapter
            const count = await listAdapter.itemsQuery({ [this.path]: value }, { meta: true })
            if (count) {
                addFieldValidationError(`[${this.path}.is.not.unique] Field ${this.path} should be unique`)
            }
        }
    }

    // resolveInput ({ resolvedData }) {
    //     const refList = this.getListByKey(this.listKey)
    //     const refField = refList.getFieldByPath(this.path)
    //     const tableName = refList.adapter.tableName
    //     const fieldName = refField.adapter.dbPath
    //     // debugger // refList.adapter.tableName refList.adapter._query().
    //     const x = refList.adapter.parentAdapter.knex.raw(`coalesce( (select max(:fieldName:) as max from :tableName:), 1) + 1`, {tableName, fieldName}).wrap('(', ')').toSQL()
    //     return x
    //     return refList.adapter.parentAdapter.knex(refList.adapter.tableName).max(refField.adapter.dbPath)
    //     // refList.adapter.parentAdapter.knex(refList.adapter.tableName).max(refField.adapter.dbPath).toSQL()
    //     // const x = [...arguments]
    //     return resolvedData[this.path]
    // }
}

class AutoIncrementIntegerKnexFieldAdapter extends KnexFieldAdapter {
    setupHooks ({ addPreSaveHook, addPostReadHook }) {
        addPreSaveHook(item => {
            if (this.path in item) {
                return item
            }

            const tableName = this.listAdapter.tableName
            const fieldName = this.dbPath
            const knex = this.listAdapter.parentAdapter.knex
            item[this.path] = knex.raw(
                `coalesce( (select max(:fieldName:) as max from :tableName:), 1) + 1`, { tableName, fieldName })
                .wrap('(', ')')
            return item
        })
    }
}

module.exports = {
    AutoIncrementInteger,
    AutoIncrementIntegerKnexFieldAdapter,
}
