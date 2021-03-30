const { Integer } = require('@keystonejs/fields')

class AutoIncrementInteger extends Integer.implementation {
    
    async resolveInput ({ resolvedData, existingItem }) {
        if (!existingItem && !resolvedData[this.path]) {
            const next = await this.adapter.nextValue()
            resolvedData[this.path] = next
        }
        return resolvedData[this.path]
    }

    async validateInput ({ resolvedData, addFieldValidationError }) {
        const value = resolvedData[this.path]
        if (value) {
            const list = this.getListByKey(this.listKey)
            const listAdapter = list.adapter
            const { count } = await listAdapter.itemsQuery({ where: { [this.path]: value } }, { meta: true })
            if (count) {
                addFieldValidationError(`[unique:alreadyExists:${this.path}] Field ${this.path} should be unique`)
            }
        }
    }
}

class AutoIncrementIntegerKnexFieldAdapter extends Integer.adapters.knex {
    
    async nextValue () {
        const tableName = this.listAdapter.tableName
        const fieldName = this.dbPath
        const knex = this.listAdapter.parentAdapter.knex
        let [{ max }] = await knex(tableName).max(fieldName)
        max = max || 0
        return ++max
    }    
    /*
    setupHooks ({ addPreSaveHook, addPostReadHook }) {
        addPreSaveHook(item => {
            // TODO(Dimtreee|Pahaz): fix autoincrement on status update, or add new field
            if (this.path in item) {
                return item
            }

            const tableName = this.listAdapter.tableName
            const fieldName = this.dbPath
            const knex = this.listAdapter.parentAdapter.knex
            item[this.path] = knex.raw(
                'coalesce( (select max(:fieldName:) as max from :tableName:), 0) + 1', { tableName, fieldName })
                .wrap('(', ')')
            return item
        })
    }
    */
}

// TODO(pahaz): add mongo support for AutoIncrementInteger
class AutoIncrementIntegerMongooseFieldAdapter extends Integer.adapters.mongoose {
    async nextValue () {
        throw new Error('Is not supported yet!')
    }

    /*
    setupHooks ({ addPreSaveHook, addPostReadHook }) {
        addPreSaveHook(item => {
            throw new Error('Is not supported yet!')
        })
        addPostReadHook(item => {
            throw new Error('Is not supported yet!')
        })
    }
    */
}

module.exports = {
    AutoIncrementInteger,
    AutoIncrementIntegerKnexFieldAdapter,
    AutoIncrementIntegerMongooseFieldAdapter,
}
