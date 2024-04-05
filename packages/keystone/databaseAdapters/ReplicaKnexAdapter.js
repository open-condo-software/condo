const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { BaseKeystoneAdapter } = require('@keystonejs/keystone')
const { knex } = require('knex')


class ReplicaKnexAdapter extends KnexAdapter {
    // constructor ({ knexOptions = {}, schemaName = 'public' } = {}) {
    //     super(...arguments)
    // }

    async _connect () {
        this.knex = knex({
            client: 'postgres',
        })

        this.knexMaster = knex({
            client: 'postgres',
            pool: { min: 0, max: 1 },
            connection: process.env.DATABASE_MASTER,
        })

        this.knexRead = knex({
            client: 'postgres',
            pool: { min: 0, max: 1 },
            connection: process.env.DATABASE_READ,
        })

        const checkUseMasterSingle = (object) => {
            // if object.method equals "insert", "del" or "update" then use master endpoint
            return ['insert', 'del', 'update'].includes(object.method)

            /** As a bonus (I will not provide code since it's still very poorly done on my side and kind of weird...)
             * But here you can also parse the sql query in object.sql
             * Find a way to retrieve all table names usage in the query
             * and if you find some "critical" one, let's say ("shopping_cart") then force to use master endpoint
             * This can be done if you don't want developpers to know when to force select queries on master endpoint using .queryContext({ useMaster: true })
             * Note that parsing every select queries to check for table names usage will take some times on every requests
             * So I suggest you to save a hash of the current query:  const hash = crypto.createHash('md5').update(object.sql).digest('hex');
             * and save the result (if it should use master endpoint or not) in an object, hash map or any other way
             * I think this is fine to do like this since object.sql do not contains variables, ex: select * from "table_name" where "column" in (?, ?, ?) (Note: this is not true If you use knex.raw)
             * It depends on your application and how many different queries your application have
             * Maybe you can still process / parse / transform the sql query to be more abstract and reduce the number (remove all after where condition, care with subqueries)
             **/
        }

        const checkUseMasterMultiple = (array) => {
            for (let i = 0 ; i < array.length ; i++) {
                if (checkUseMasterSingle(array[i])) {
                    return true
                }
            }
            return false
        }

        //override runner method
        this.knex.client.runner = (builder) => {
            // here we will redirect the query on the correct knex object,
            // We use this method since this is one of the first executed
            // after your query has been built and it's still before the aquireConnection process

            // bypass with knex.select('*').queryContext({ useMaster: true })....
            // this is to force your query to be executed on read or write endpoint
            // not sure about using queryContext for this but it seems ok to me

            if (builder._queryContext && builder._queryContext.useMaster === true) {
                return this.knexMaster.client.runner(builder)
            } else if (
                builder._queryContext &&
                builder._queryContext.useMaster === false
            ) {
                return this.knexRead.client.runner(builder)
            }

            // .toSQL() return an object or an array of object (not sure about that but this is what I found in /lib/runner.js)
            // if toSQL fails, just point at master. this is because the query won't run anyway, but stack trace will be preserved.
            let sql
            let useMaster = true
            try {
                sql = builder.toSQL()
                useMaster = Array.isArray(sql)
                    ? checkUseMasterMultiple(sql)
                    : checkUseMasterSingle(sql)
            } catch (error) {
                // swallow this, it will be thrown properly in a second when Knex internally runs it
            }

            return useMaster
                ? this.knexMaster.client.runner(builder)
                : this.knexRead.client.runner(builder)
        }

        const masterConnectionResult = await this.knexMaster.raw('select 1+1 as result').catch(result => ({ error: result.error || result }))
        const readConnectionResult = await this.knexRead.raw('select 1+1 as result').catch(result => ({ error: result.error || result }))

        if (masterConnectionResult.error || readConnectionResult.error) {
            if (masterConnectionResult.error) {
                console.error(`Could not connect to database: '${process.env.DATABASE_MASTER.split('/').pop()}'`)
                throw masterConnectionResult.error
            }

            console.error(`Could not connect to database: '${process.env.DATABASE_READ.split('/').pop()}'`)
            throw readConnectionResult.error
        }

        return true
    }

    disconnect () {
        this.knexMaster.destroy()
        this.knexRead.destroy()
    }
}

module.exports = {
    ReplicaKnexAdapter,
}
