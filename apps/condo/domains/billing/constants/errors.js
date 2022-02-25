const CONTEXT_NO_OPTION_PROVIDED = '[billingIntegrationOrganizationContext:integrationOption:undefined] Billing integration has options, but it was not provided'
const CONTEXT_REDUNDANT_OPTION = '[billingIntegrationOrganizationContext:integrationOption:defined] Billing integration has no options, but it\'s option was provided'
const CONTEXT_OPTION_NAME_MATCH = '[billingIntegrationOrganizationContext:integrationOption:name:mismatch] Billing integration has no options with specified name'

module.exports = {
    CONTEXT_NO_OPTION_PROVIDED,
    CONTEXT_OPTION_NAME_MATCH,
    CONTEXT_REDUNDANT_OPTION,
}