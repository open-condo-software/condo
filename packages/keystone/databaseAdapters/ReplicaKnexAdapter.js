const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { knex } = require('knex')
const { get, omit } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('replicaKnexAdapter')

const MUTABLE_OPERATIONS = ['create', 'update', 'insert', 'delete', 'alter', 'drop', 'truncate', 'rollback', 'del']

/**
 *
 */
class ReplicaKnexAdapter extends KnexAdapter {
    constructor (props) {
        super(omit(props, ['connection']))
        this.readConnection = get(props, ['connection', 'read'])
        this.writeConnection = get(props, ['connection', 'write'])
    }

    async _connect () {
        this.knex = knex({
            client: 'postgres',
            pool: { min: 0, max: 1 },
            connection: this.writeConnection,
        })

        this.knexWrite = knex({
            client: 'postgres',
            pool: { min: 0, max: 3 },
            connection: this.writeConnection,
        })

        this.knexRead = knex({
            client: 'postgres',
            pool: { min: 0, max: 3 },
            connection: this.readConnection,
        })

        this.knex.context.transaction = (...props) => {
            return this.knexWrite.context.transaction(...props)
        }

        const checkUseMasterSingle = (object) => {
            console.log('Object -> ', JSON.stringify(object))
            // if object.method equals "insert", "delete" or "update" then use master endpoint
            if (object.method !== undefined) {
                console.log('checkUseMasterSingle: method -> ', object.method)
                return MUTABLE_OPERATIONS.includes(object.method)
            }
            console.log('parse sql: ', object.sql)
            // try to parse sql
            return MUTABLE_OPERATIONS.some(sub => object.sql.includes(sub))
        }

        const checkUseMasterMultiple = (array) => array.some(checkUseMasterSingle)

        //override runner method
        this.knex.client.runner = (builder) => {
            if (builder._queryContext && builder._queryContext.useMaster === true) {
                return this.knexWrite.client.runner(builder)
            } else if (
                builder._queryContext &&
                builder._queryContext.useMaster === false
            ) {
                return this.knexRead.client.runner(builder)
            }

            let sql
            let useMaster = true
            try {
                sql = builder.toSQL()
                console.log('sql to execute = ', JSON.stringify(sql))
                useMaster = Array.isArray(sql)
                    ? checkUseMasterMultiple(sql)
                    : checkUseMasterSingle(sql)
            } catch (error) {
                logger.error({
                    err: error,
                    msg: 'catch error at connection determination',
                })
                // swallow this, it will be thrown properly in a second when Knex internally runs it
            }

            return useMaster
                ? this.knexWrite.client.runner(builder)
                : this.knexRead.client.runner(builder)
        }

        const masterConnectionResult = await this.knexWrite.raw('select 1+1 as result').catch(result => ({ error: result.error || result }))
        console.log('master connection result ', masterConnectionResult)
        const readConnectionResult = await this.knexRead.raw('select 1+1 as result').catch(result => ({ error: result.error || result }))
        console.log('read connection result ', readConnectionResult)

        if (masterConnectionResult.error || readConnectionResult.error) {
            if (masterConnectionResult.error) {
                logger.error({
                    err: masterConnectionResult.error,
                    msg: 'Could not connect to master database',
                })
                throw masterConnectionResult.error
            }

            logger.error({
                err: readConnectionResult.error,
                msg: 'Could not connect to replica database',
            })
            throw readConnectionResult.error
        }

        return true
    }

    disconnect () {
        this.knexWrite.destroy()
        this.knexRead.destroy()
        this.knex.destroy()
    }
}

module.exports = {
    ReplicaKnexAdapter,
}
