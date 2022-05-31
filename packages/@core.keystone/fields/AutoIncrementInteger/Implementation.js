const { default: Redlock } = require('redlock')

const { Integer } = require('@keystonejs/fields')
const { taskQueue } = require('@core/keystone/tasks')

class AutoIncrementInteger extends Integer.implementation {
    
    async resolveInput ({ resolvedData, existingItem }) {
        if (!existingItem && !resolvedData[this.path]) {
            const next = await this.adapter.nextValue()
            if (!next || next <= 0) throw new Error('unexpected AutoIncrementInteger:adapter.nextValue()')
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
        // NOTE(pahaz): it's really hack! please don't copy this staff in a future! I'll find a better solution for that!
        //  I didn't found a way to use knex subquery for that. Probably, we need to create some DB procedure or use another table with
        //  sequence column. At the moment this code just help us to avoid `duplicate key value violates unique constraint`
        const rlock = new Redlock([taskQueue.client])
        const redisLockKey = `AutoIncrementInteger:${tableName}:${fieldName}`
        const redisMaxValueKey = `AutoIncrementInteger:${tableName}:${fieldName}:value`
        let lock = await rlock.acquire([redisLockKey], 500) // 0.5 sec
        try {
            let currentMaxNumber = await taskQueue.client.get(redisMaxValueKey)
            if (!currentMaxNumber) {
                let [{ max }] = await knex(tableName).max(fieldName)
                currentMaxNumber = max
            } else {
                // NOTE(pahaz): if someone set new number value by hands we need to generate next number MAX + 1
                let [{ max }] = await knex(tableName).max(fieldName)
                if (max > currentMaxNumber) {
                    currentMaxNumber = max
                }
            }
            currentMaxNumber = parseInt(currentMaxNumber || 0)
            await taskQueue.client.set(redisMaxValueKey, currentMaxNumber + 1)
            return currentMaxNumber + 1
        } finally {
            await lock.release()
        }
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
