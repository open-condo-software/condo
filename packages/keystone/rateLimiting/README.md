# ApolloRateLimitingPlugin

## Working principle
1. Queries and mutations are extracted from each request.
2. For each query it's complexity calculated
3. Query complexity is normalized by pagination factor.
4. Mutations and queries complexities are summed to form total request quota-complexity

## Calculating query complexity
### List query complexity
Formula for basic list complexity is:
```
queryWeight * ((results * whereFactor) + (results * (selectionFactor - 1)))
```
#### selectionFactor
`selectionFactor` is based on amount of sub-queries needed to obtain relations from selection.  

For example `selectionFactor('{ id name }') = 1.0`, since only original query is required. 

`selectionFactor('{ id contact { name organization { id } } createdBy { name } }') = 4.0`,  
since we need 4 queries (original model, contact, organization and user)

#### whereFactor
`whereFactor` is based on complexity of where condition. 
`AND` / `OR` / `<field>_in` / `relationField` increases it by a factor of 2.  

Few examples:

`whereFactor({ contact: { id: ... }, organization: { createdBy: { name: ... } }}) = 6`  

Contact relation produces 2, nested organization produces 4. They're summed up to 6.

`whereFactor({ id_in: [1, 2, 3], organization: { id_in: [1, 2, ..., 4500] } })` 

`id_in` produce 1 complexity per 1000 objects, 
so organization id_in produce 5, relation scales it to 10, id_in global produce 1, 
and fields are summed up to 11.

`whereFactor({ organization: { OR: [{ id: 123 }, { name: 'asd' }] } }`

`OR` sums up complexities of sub-queries, so 1 + 1 is 2. Relation increases it by 2, so it's 4

#### results
`results` are basically `first || maxTotalResults`. So use first argument to decrease query complexity.

### List meta query complexity
Formula for list meta complexity is the same as for list, 
but without `selectionFactor` part, since there's no JOINS in return:
```
queryWeight * (results * whereFactor)
```

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
