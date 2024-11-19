const { _internalGetAsyncLocalStorage } = require('@open-condo/keystone/executionContext')

// NOTE(SavelevMatthew): separate context is required because I don't want to mix its logic executionContext one:
// 1. it has different entry points (it is hard to manage the merge process + dependency on executionContext's shape appears)
// 2. We may want to add call-stack later, merging states will become hard
const graphqlCtx = _internalGetAsyncLocalStorage('graphqlCtx')

module.exports = {
    graphqlCtx,
}