import { check } from 'k6'

import {
    createOrganization,
    createProperty,
    getOrganizationEmployeeId,
    sendAuthorizedRequest,
    setupCondoAuth,
} from './utils'

const DURATION = '60s'

export const options = {
    tags: { testid: 'tour', serverUrl: __ENV.BASE_URL },
    scenarios: {
        getAllOrganizationEmployees: {
            exec: 'getAllOrganizationEmployees',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 5,
            timeUnit: '1s',
            preAllocatedVUs: 7,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['med<1000'],
    },
}

export function setup () {
    const { token } = setupCondoAuth(true)

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')

    getOrganizationEmployeeId({ token, organizationId })
    const createdProperty = createProperty({ token, organizationId })

    return {
        token,
        organizationId,
        propertyId: createdProperty.json('data.obj.id'),
    }
}

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'
const ORGANIZATION_FIELDS = `{ country name type description avatar { publicUrl } meta tin features statusTransitions defaultEmployeeRoleStatusTransitions importId importRemoteSystem phone phoneNumberPrefix isApproved ${COMMON_FIELDS} }`
const ORGANIZATION_EMPLOYEE_ROLE_FIELDS = `{ isEditable isDefault organization { id } name nameNonLocalized description descriptionNonLocalized statusTransitions canReadAnalytics canManageOrganization canManageCallRecords canDownloadCallRecords canReadEmployees canManageEmployees canInviteNewOrganizationEmployees canManageRoles canManageTicketPropertyHints canManageIntegrations canImportBillingReceipts canReadBillingReceipts canReadPayments canManageProperties canReadProperties canReadDocuments canManageDocuments canReadTickets canManageTickets canReadContacts canManageContacts canManageContactRoles canManageTicketComments canManagePropertyScopes canShareTickets canBeAssignedAsResponsible canBeAssignedAsExecutor canManageMeters canManageMeterReadings ticketVisibilityType canManageBankAccounts canManageBankContractorAccounts canManageBankIntegrationAccountContexts canManageBankIntegrationOrganizationContexts canManageBankTransactions canManageBankAccountReports canManageBankAccountReportTasks canManageBankAccountReports canReadIncidents canManageIncidents canReadNewsItems canManageNewsItems canManageNewsItemTemplates canManageMobileFeatureConfigs canManageB2BApps canReadMeters canReadSettings canReadExternalReports canReadServices canReadCallRecords canReadInvoices canManageInvoices canReadMarketItems canManageMarketItems canManageMarketItemPrices canReadMarketItemPrices canReadMarketPriceScopes canManageMarketPriceScopes canReadMarketplace canManageMarketplace canReadPaymentsWithInvoices canReadTour canManageTour canReadMarketSetting canManageMarketSetting canManageTicketAutoAssignments ${COMMON_FIELDS} }`
const ORGANIZATION_EMPLOYEE_FIELDS = `{ organization ${ORGANIZATION_FIELDS} user { id name } name email phone role ${ORGANIZATION_EMPLOYEE_ROLE_FIELDS} hasAllSpecializations isRejected isAccepted isBlocked id dv sender { dv fingerprint } v createdBy { id name } updatedBy { id name } position createdAt deletedAt updatedAt }`

export function getAllOrganizationEmployees (data) {
    const payload = {
        operationName: 'getAllOrganizationEmployees',
        query: `
          query getAllOrganizationEmployees($where: OrganizationEmployeeWhereInput) {
            objs: allOrganizationEmployees(where: $where) ${ORGANIZATION_EMPLOYEE_FIELDS}
          }
        `,
        variables: {
            where: {
                organization: { id: data.organizationId },
            },
        },
    }
    const response = sendAuthorizedRequest(data, payload)

    check(response, {
        'getAllOrganizationEmployees status is 200': (res) => res.status === 200,
    })
}