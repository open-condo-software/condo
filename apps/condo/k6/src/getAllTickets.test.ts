import { check } from 'k6'

import {
    setupCondoAuth,
    sendAuthorizedRequest,
    getOrganizationEmployees, signInAsUser,
} from './utils'

const DURATION = '60s'

export const options = {
    tags: { testid: 'ticket', serverUrl: __ENV.BASE_URL },
    scenarios: {
        queryTicketEntities: {
            exec: 'getAllTickets',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 5,
            timeUnit: '1s',
            preAllocatedVUs: 7,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<3000', 'med<2000'],
    },
}

export function setup () {
    const organizationId = __ENV.ORGANIZATION_ID

    const { token: adminToken } = setupCondoAuth(true)
    const organizationEmployees = getOrganizationEmployees(adminToken, {
        organization: { id: organizationId },
        role: { isDefault: true, ticketVisibilityType: 'property' },
        user: { deletedAt: null },
        deletedAt: null,
        isAccepted: true,
        isBlocked: false,
        isRejected: false,
    })

    const userId = organizationEmployees.json('data.allOrganizationEmployees.0.user.id')
    const signInAsUserData = signInAsUser(adminToken, userId)
    const token = signInAsUserData.json('data.signinAsUser.token')

    return {
        token,
        organizationId,
    }
}

export function getAllTickets (data) {
    const allTicketsPayload = {
        operationName: 'getAllTickets',
        query: 'query getAllTickets($where: TicketWhereInput, $first: Int = 100, $skip: Int, $sortBy: [SortTicketsBy!]) { objs: allTickets(where: $where, first: $first, skip: $skip, sortBy: $sortBy) { canReadByResident completedAt lastCommentAt lastResidentCommentAt isResidentTicket reviewValue reviewComment feedbackValue feedbackComment feedbackAdditionalOptions feedbackUpdatedAt qualityControlValue qualityControlComment qualityControlAdditionalOptions qualityControlUpdatedAt qualityControlUpdatedBy { id name __typename } deadline deferredUntil organization { id name country phone phoneNumberPrefix __typename } property { id name address deletedAt addressMeta { dv value unrestricted_value data { postal_code country country_iso_code federal_district region_fias_id region_kladr_id region_iso_code region_with_type region_type region_type_full region area_fias_id area_kladr_id area_with_type area_type area_type_full area city_fias_id city_kladr_id city_with_type city_type city_type_full city city_area city_district_fias_id city_district_kladr_id city_district_with_type city_district_type city_district_type_full city_district settlement_fias_id settlement_kladr_id settlement_with_type settlement_type settlement_type_full settlement street_fias_id street_kladr_id street_with_type street_type street_type_full street house_fias_id house_kladr_id house_type house_type_full house block_type block_type_full block entrance floor flat_fias_id flat_type flat_type_full flat flat_area square_meter_price flat_price postal_box fias_id fias_code fias_level fias_actuality_state kladr_id geoname_id capital_marker okato oktmo tax_office tax_office_legal timezone geo_lat geo_lon beltway_hit beltway_distance metro { name line distance __typename } qc_geo qc_complete qc_house history_values unparsed_parts source qc __typename } __typename } __typename } propertyAddress propertyAddressMeta { dv value unrestricted_value data { postal_code country country_iso_code federal_district region_fias_id region_kladr_id region_iso_code region_with_type region_type region_type_full region area_fias_id area_kladr_id area_with_type area_type area_type_full area city_fias_id city_kladr_id city_with_type city_type city_type_full city city_area city_district_fias_id city_district_kladr_id city_district_with_type city_district_type city_district_type_full city_district settlement_fias_id settlement_kladr_id settlement_with_type settlement_type settlement_type_full settlement street_fias_id street_kladr_id street_with_type street_type street_type_full street house_fias_id house_kladr_id house_type house_type_full house block_type block_type_full block entrance floor flat_fias_id flat_type flat_type_full flat flat_area square_meter_price flat_price postal_box fias_id fias_code fias_level fias_actuality_state kladr_id geoname_id capital_marker okato oktmo tax_office tax_office_legal timezone geo_lat geo_lon beltway_hit beltway_distance metro { name line distance __typename } qc_geo qc_complete qc_house history_values unparsed_parts source qc __typename } __typename } unitType unitName sectionName sectionType floorName status { id name type organization { id __typename } colors { primary secondary additional __typename } __typename } statusReopenedCounter statusUpdatedAt statusReason number client { id name __typename } clientName clientEmail clientPhone contact { id name phone email unitName unitType __typename } assignee { id name __typename } executor { id name __typename } details related { id details __typename } isAutoClassified isEmergency isPaid isPayable isWarranty meta source { id name type __typename } sourceMeta categoryClassifier { id __typename } placeClassifier { id __typename } problemClassifier { id __typename } classifier { id place { id name __typename } category { id name __typename } problem { id name __typename } __typename } id dv sender { dv fingerprint __typename } v deletedAt newId createdBy { id name type __typename } updatedBy { id name __typename } createdAt updatedAt __typename } meta: _allTicketsMeta(where: $where) { count __typename } }',
        variables: { first: 30, where: { organization: { id: data.organizationId } } },
    }

    const allTicketsResponse = sendAuthorizedRequest(data, allTicketsPayload)

    check(allTicketsResponse, {
        'all tickets status is 200': (res) => res.status === 200,
        'all tickets response ok': (res) => {
            const result = res.json('data.objs')

            if (Array.isArray(result)) {
                if (result.length > 0) return result[0]['id'] !== undefined
                return true
            }
            return false
        },
    })
}