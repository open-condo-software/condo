# BalancingReplicaKnexAdapter

> BalancingReplicaKnexAdapter is a database adapter for PostgresSQL, 
> based on the standard KnexAdapter, but providing the ability to flexibly configure application-level traffic 
> using environment variables.

## Configuration

The adapter is configured using 3 environment variables: `DATABASE_URL`, `DATABASE_POOLS` and `DATABASE_ROUTING_RULES`.


### `DATABASE_URL`

We use named databases to further group them into pools and redirect traffic. 

`DATABASE_URL` uses a custom protocol and can be formed programmatically as follows:

```typescript
type DBName = string
type ConnectionString = string

const namedDBs: Record<DBName, ConnectionString> = {
    main: 'postgresql://****:****@127.0.0.1:5432/main',
    replica: 'postgresql://****:****@127.0.0.1:5433/replica',
}

`custom:${JSON.stringify(namedDBs)}`
```

#### Example:
```dotenv
DATABASE_URL=custom:{"main":"****://****:postgres@127.0.0.1:5432/main","replica":"****://****:postgres@127.0.0.1:5433/replica"}
```

### `DATABASE_POOLS`

A database pool is a set of 1 or more databases, each of which can accept a specific set of queries. 

The pool may or may not be writable. 
If so, it can accept mutable operations such as `insert` / `delete` / `update`. 
If not, then only `select` / `show` is acceptable.

The pool distributes the load among the bases using one of the following balancing algorithms:

| Name         | default | description                                            |
|--------------|---------|--------------------------------------------------------|
| `RoundRobin` | yes     | Each request is distributed among the bases one by one | 

You can form `DATABASE_POOLS` env variable by calling `JSON.stringify` on config of the following shape:
```typescript
type Balancer = 'RoundRobin'

type PoolConfig = {
    databases: Array<DBName>                    // Array of database names presenting in pool
    writable: boolean                           // Marks, that pool can accept mutable operations
    balancer?: Balancer                         // Balancer. "RoundRobin" by default.
    balancerOptions?: Record<string, unknown>   // Balancer options depending on balancer (if any balancer need additional configuration)
}

type DatabasePools = Record<string, PoolConfig>

const example: DatabasePools = {
    main: { databases: ['main'], writable: true },
    replicas: { databases: ['replica'], writable:false }
}
```
#### Example:
```dotenv
DATABASE_POOLS='{"main":{"databases":["main"],"writable":true},"replicas":{"databases":["replica"],"writable":false}}'
```

### `DATABASE_ROUTING_RULES`

A routing rules is an array of objects containing the following fields:

| Name             | Type                                                       | required | description                                                                                                                                                                                                                                                                                                                                                           |
|------------------|------------------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| target           | string                                                     | yes      | To which pool to send SQL query if all conditions match                                                                                                                                                                                                                                                                                                               |
| gqlOperationType | 'mutation' \| 'query'                                      | no       | If specified, rule will be applied only if SQL query <br>is made inside GQL mutation / query.                                                                                                                                                                                                                                                                         |
| gqlOperationName | string \| RegExp                                           | no       | If specified, rule will be applied only if SQL query <br>is made inside GQL operation with matching name. <br><br>NOTE 1: Each subquery, such as Model.create, Model.getAll and etc., generates a new gql context, <br>so it's worth keeping this in mind when forming rules.<br><br>NOTE 2: Direct adapter calls (find / getByCondition) does not spawn gql context. |
| sqlOperationName | 'insert' \| 'select' \| 'update' <br>\| 'delete' \| 'show' | no       | If specified, rule will be applied only if <br>the SQL query method equals the method specified in the rule                                                                                                                                                                                                                                                           |
| tableName        | string \| RegExp                                           | no       | If specified, rule will be applied only if <br>the SQL query method operates on table with matching name                                                                                                                                                                                                                                                              |

#### How does routing rules works

- Rules are scanned in order from first to last, the first rule. 
- The conditions in a rule are combined through AND. 
- The first rule in which all conditions match is applied. 
- The rule chain must end with the default rule (without any conditions)

#### Example of configuration

```typescript
const routingRules = [
    // Send adapter calls inside registerBillingReceipt mutation to replicas
    { gqlOperationName: 'registerBillingReceipt', sqlOperationName: 'select', tableName: "^Billing.+$", target: 'replicas' },
    // Send all counts to separate replica-pool
    { gqlOperationName: '^.+Meta$', target: 'counts' },
    // Send all historical logs to separate DB
    { tableName: '^.+HistoryRecord$', target: 'historical' },
    // Send all traffic inside mutattions to main pool
    { gqlOperationType: 'mutaion', target: 'main' },
    // Send read operations to replicas
    { sqlOperationName: 'select', target: 'replicas' },
    // Send default trafiic to main pool
    { target: 'main' }
]
```

#### Example of `.env` value:
```dotenv
DATABASE_ROUTING_RULES='[{"target":"main","gqlOperationType":"mutation"},{"target":"replicas","sqlOperationName":"select"},{"target":"replicas","sqlOperationName":"show"},{"target":"main"}]'
```
