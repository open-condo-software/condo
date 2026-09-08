const {
    listHasCrossSourceInbound,
    listHasCrossSourceOutbound,
    listNeedsCrossDbWhereRewrite,
} = require('./crossSourceHints')
const { CrossDbPlanner, GLOBAL_QUERY_LIMIT, isCrossDbPlannerEnabled, isUnsatisfiableWhere, prepareCrossDbWhere } = require('./planner')
const {
    normalizeColumnName,
    normalizePositionalBindings,
    parseLiteralNode,
    resolveSqlValue,
} = require('./sqlAstUtils')
const {
    createTablePoolResolver,
    getTablePoolResolver,
    resolveTablePool,
} = require('./tablePool')
const {
    ON_DELETE,
    normalizeOnDelete,
    collectCrossSourceInboundForeignKeys,
    extractDeleteTargetIds,
    extractUpdateTargetIds,
    isSoftDeleteUpdate,
    enforceCrossSourceDeleteConstraints,
} = require('./validateCrossSourceDeletes')
const {
    collectCrossSourceForeignKeys,
    extractMutationColumnValues,
    validateCrossSourceReferences,
} = require('./validateCrossSourceReferences')

module.exports = {
    CrossDbPlanner,
    GLOBAL_QUERY_LIMIT,
    isCrossDbPlannerEnabled,
    prepareCrossDbWhere,
    isUnsatisfiableWhere,
    listHasCrossSourceInbound,
    listHasCrossSourceOutbound,
    listNeedsCrossDbWhereRewrite,
    createTablePoolResolver,
    getTablePoolResolver,
    resolveTablePool,
    collectCrossSourceForeignKeys,
    extractMutationColumnValues,
    validateCrossSourceReferences,
    ON_DELETE,
    normalizeOnDelete,
    collectCrossSourceInboundForeignKeys,
    extractDeleteTargetIds,
    extractUpdateTargetIds,
    isSoftDeleteUpdate,
    enforceCrossSourceDeleteConstraints,
    normalizeColumnName,
    normalizePositionalBindings,
    parseLiteralNode,
    resolveSqlValue,
}
