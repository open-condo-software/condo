# ApolloRateLimitingPlugin

## Working principle
1. Queries and mutations are extracted from each request.
2. For each query it's complexity calculated
3. Mutations and queries complexities are summed to form total request complexity
4. Complexity is extracted from request in logger plugin.
5. (TODO) If request is too complex or there's no quota left it throws 429 GQLError

## Calculating query complexity
### List query complexity
Formula for basic list-query complexity is:
```
queryWeight * paginationFactor * (whereFactor + (selectionFactor - 1))
```

#### queryWeight
Base query modifier, equals to `1.0` by default. 
Can be overwritten if some list has lots of data with / slower lookup.

#### paginationFactor
`paginationFactor` is designed so that the number of objects requested affects the complexity of the query.

It can be calculated by the following formula: 
`paginationFactor = Math.ceil((first || maxTotalResults) / pageLimit)`. 
By default `pageLimit` is equal to `100`

So, if you're requesting `0-100` objects `paginationFactor` will be equal to `1`. 
For `101-200` objects it's `2` and so on.

You can control it by passing `first` argument. 
If `first` is not passed in, the default is `maxTotalResults`, which is `1000` by default, 
so be sure to set `first` argument to the correct value.

#### selectionFactor
`selectionFactor` is based on amount of sub-queries needed to obtain relations from selection.  

For example `selectionFactor('{ id name }') = 1.0`, since only original query is required. 

`selectionFactor('{ id contact { name organization { id } } createdBy { name } }') = 4.0`,  
since we need 4 queries (original model, contact, organization and user)

#### whereFactor
`whereFactor` is based on complexity of where condition. 
`AND` / `OR` / `<field>_in` / `relationField` increases it by a factor of 2 (`whereScalingFactor` parameter).  

Few examples:

`whereFactor({ contact: { id: ... }, organization: { createdBy: { name: ... } }}) = 6`  

`Contact` relation produces 2, nested `organization` with `createdBy` produces 4. 
So they're summed up to 6.

`whereFactor({ id_in: [1, 2, 3], organization: { id_in: [1, 2, ..., 450] } })` 

`id_in` produce 1 complexity per `pageLimit` objects (which is `100` by default), 
so `organization.id_in` produces 5, relation scales it to 10, global id_in produces 1, 
and fields are summed up to 11.

`whereFactor({ organization: { OR: [{ id: 123 }, { name: 'asd' }] } }`

`OR` sums up complexities of sub-queries, so 1 + 1 is 2. Relation increases it by 2, so it's 4


### List meta query complexity
Formula for list meta complexity is the same as for list, 
but without `selectionFactor`, since there's no JOINS in return:
```
queryWeight * whereFactor * maxPaginationFactor
```

#### maxPaginationFactor
`maxPaginationFactor` is a version of `paginationFactor` that does not use `first`, 
i.e. the `first || maxTotalResults` part of equation will become just `maxTotalResults`


### Custom query complexity
Custom queries for now just have default weight, you can override its complexity in keystone schema (TODO)
```
queryWeight
```

## Calculating mutation complexity
By default, all mutations have default weight. You can override it in keystone schema (TODO)
```
mutationWeight
```
