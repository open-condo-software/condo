const { Integer } = require('@keystonejs/fields')

class AutoIncrementInteger extends Integer.implementation {
    
    async resolveInput ({ resolvedData, existingItem }) {
        if (!existingItem && !resolvedData[this.path]) {
            const next = await this.adapter.nextValue()
            resolvedData[this.path] = next
        }
        return resolvedData[this.path]
    }

    async validateInput ({ resolvedData, existingItem, addFieldValidationError }) {
        // if we want to set already existed item number we don't need to check it
        if (existingItem && resolvedData[this.path] === existingItem[this.path]) return
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
}

// TODO(pahaz): add mongo support for AutoIncrementInteger
class AutoIncrementIntegerMongooseFieldAdapter extends Integer.adapters.mongoose {
    async nextValue () {
        throw new Error('Is not supported yet!')
    }
}

// TODO(pahaz): is it working? or just hack?
class AutoIncrementIntegerPrismaFieldAdapter extends Integer.adapters.prisma {
    async nextValue () {
        throw new Error('Is not supported yet!')
    }
}

module.exports = {
    AutoIncrementInteger,
    AutoIncrementIntegerKnexFieldAdapter,
    AutoIncrementIntegerMongooseFieldAdapter,
    AutoIncrementIntegerPrismaFieldAdapter,
}
