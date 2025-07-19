import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { BillingIntegrationProblem as BillingIntegrationProblemGQL } from '@condo/domains/billing/gql'

import type {
    BillingIntegrationProblem,
    BillingIntegrationProblemCreateInput,
    BillingIntegrationProblemsUpdateInput,
    QueryAllBillingIntegrationProblemsArgs,
} from '@app/condo/schema'

const {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
} = generateReactHooks<BillingIntegrationProblem, BillingIntegrationProblemCreateInput, BillingIntegrationProblemsUpdateInput, QueryAllBillingIntegrationProblemsArgs>(BillingIntegrationProblemGQL)

export {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
}
