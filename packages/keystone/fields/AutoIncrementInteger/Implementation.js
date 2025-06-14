const { Integer } = require('@open-keystone/fields')
const get = require('lodash/get')
const { default: Redlock } = require('redlock')

const { getKVClient } = require('@open-condo/keystone/kv')

class AutoIncrementInteger extends Integer.implementation {

    async resolveInput ({ resolvedData, existingItem }) {
        if (!existingItem && !resolvedData[this.path]) {
            const scopeFields = get(this, ['config', 'autoIncrementScopeFields'], [])
            const scopeWhere = scopeFields.reduce((result, field) => {
                const fieldValue = get(resolvedData, field)
                if (fieldValue) {
                    return { ...result, [field]: fieldValue }
                }

                return result
            }, {})
            const next = await this.adapter.nextValue(scopeWhere)
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

            const scopeFields = get(this, ['config', 'autoIncrementScopeFields'], [])
            const scopeWhere = scopeFields.reduce((result, fieldName) => {
                const fieldValue = get(resolvedData, fieldName)
                if (fieldValue) {
                    return {
                        ...result,
                        // For now support only raw value or relationship
                        [fieldName]: list.fieldsByPath[fieldName].isRelationship ? { id: fieldValue } : fieldValue,
                    }
                }

                return result
            }, {})

            const { count } = await listAdapter.itemsQuery({ where: { [this.path]: value, ...scopeWhere } }, { meta: true })
            if (count) {
                addFieldValidationError(`[unique:alreadyExists:${this.path}] Field ${this.path} should be unique`)
            }
        }
    }
}

class AutoIncrementIntegerKnexFieldAdapter extends Integer.adapters.knex {
    get redis () {
        if (!this._redis) this._redis = getKVClient()
        return this._redis
    }

    async nextValue (scopeWhere = {}) {
        const tableName = this.listAdapter.tableName
        const fieldName = this.dbPath
        const knex = this.listAdapter.parentAdapter.knex
        // NOTE(pahaz): it's really hack! please don't copy this staff in a future! I'll find a better solution for that!
        //  I didn't found a way to use knex subquery for that. Probably, we need to create some DB procedure or use another table with
        //  sequence column. At the moment this code just help us to avoid `duplicate key value violates unique constraint`
        const rlock = new Redlock([this.redis])

        const scopeParts = Object.keys(scopeWhere).reduce((result, fieldName) => [...result, fieldName, get(scopeWhere, fieldName)], [])

        const redisLockKeyParts = ['AutoIncrementInteger', tableName, fieldName, ...scopeParts]
        const redisMaxValueKeyParts = ['AutoIncrementInteger', tableName, fieldName, 'value', ...scopeParts]

        const redisLockKey = redisLockKeyParts.filter(Boolean).join(':')
        const redisMaxValueKey = redisMaxValueKeyParts.filter(Boolean).join(':')

        let lock = await rlock.acquire([redisLockKey], 500, {
            retryDelay: 1000,
            retryCount: 30,
            automaticExtensionThreshold: 100,
            retryJitter: 1000,
        }) // 0.5 sec
        try {
            let currentMaxNumber = await this.redis.get(redisMaxValueKey)
            if (!currentMaxNumber) {
                let [{ max }] = await knex(tableName).where(scopeWhere).max(fieldName)
                currentMaxNumber = max
            } else {
                // NOTE(pahaz): if someone set new number value by hands we need to generate next number MAX + 1
                let [{ max }] = await knex(tableName).where(scopeWhere).max(fieldName)
                if (max > currentMaxNumber) {
                    currentMaxNumber = max
                }
            }
            currentMaxNumber = parseInt(currentMaxNumber || 0)
            await this.redis.set(redisMaxValueKey, currentMaxNumber + 1)
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
