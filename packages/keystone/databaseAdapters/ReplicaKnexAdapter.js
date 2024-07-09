const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { knex } = require('knex')
const { get, omit } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('replicaKnexAdapter')

const IMMUTABLE_OPERATIONS = ['select', 'show']

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
            // if object.method equals "insert", "delete" or "update" then use master endpoint
            if (object.method !== undefined) {
                return !IMMUTABLE_OPERATIONS.includes(object.method)
            }
            // try to parse sql
            return !IMMUTABLE_OPERATIONS.some(sub => object.sql.includes(sub))
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
        const readConnectionResult = await this.knexRead.raw('select 1+1 as result').catch(result => ({ error: result.error || result }))

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
