class RedisSelectPlanner {
    canPlan () {
        return false
    }

    async plan () {
        return null
    }

    canPlanMutation () {
        return false
    }

    async planMutation () {
        return null
    }
}

const REDIS_PROVIDER_CAPABILITIES = Object.freeze({
    provider: 'redis',
    supportsSqlRouting: false,
    supportsCrossSourceSelectPlanning: false,
    supportsCrossSourceMutationPlanning: false,
    supportsCrossSourceSortPushdown: false,
})

module.exports = {
    RedisSelectPlanner,
    REDIS_PROVIDER_CAPABILITIES,
}
