import { check, sleep } from 'k6'
import { browser } from 'k6/browser'
import http from 'k6/http'

import {
    setupCondoAuth,
    createOrganization,
    createProperty,
    sendAuthorizedRequest,
    getOrganizationEmployeeId,
    getOrganizationEmployees,
    signInAsUser,
    createTicket,
    resetOrganization,
} from './utils'



const BASE_APP_URL = __ENV.BASE_URL + '/ticket'
const DURATION = '60s'

export const options = {
    tags: { testid: 'ticket', serverUrl: __ENV.BASE_URL },
    scenarios: {
        queryTicketEntities: {
            exec: 'queryBasicEntities',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 5,
            timeUnit: '1s',
            preAllocatedVUs: 7,
        },
        appHealthcheck: {
            exec: 'healthcheck',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 2,
            timeUnit: '1s',
            preAllocatedVUs: 2,
        },
        createTickets: {
            exec: 'createTickets',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 1,
            timeUnit: '2s',
            preAllocatedVUs: 1,
        },
        browser: {
            exec: 'checkFrontend',
            executor: 'constant-vus',
            vus: 1,
            duration: DURATION,
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        browser_http_req_duration: ['p(95) < 4000', 'med < 1500'],
        http_req_duration: ['p(95)<3000', 'med<2000'],
        browser_web_vital_fcp: ['p(95) < 8000', 'med < 4000'],
        browser_web_vital_lcp: ['p(95) < 15000', 'med < 11000'],
    },
}

function setupOrganizationForCheckFrontend () {
    const organizationId = __ENV.ORGANIZATION_ID
    if (!organizationId) return {}

    const { token: adminToken } = setupCondoAuth()
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
    const cookie = signInAsUserData.cookies['keystone.sid'][0]['value']

    return {
        cookie,
        organizationLinkId: organizationEmployees.json('data.allOrganizationEmployees.0.id'),
    }
}

export function setup () {
    const { token, cookie } = setupCondoAuth()

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')

    const organizationEmployee = getOrganizationEmployeeId({ token, organizationId })
    const createdProperty = createProperty({ token, organizationId })

    return {
        token,
        cookie,
        organizationId,
        organizationLinkId: organizationEmployee.json('data.allOrganizationEmployees.0.id'),
        propertyId: createdProperty.json('data.obj.id'),
    }
}

export function teardown (data) {
    resetOrganization(data)
}

export function healthcheck () {
    const appHealthcheck = http.get(__ENV.BASE_URL + '/server-health?checks=postgres,redis')

    check(appHealthcheck, {
        'healthcheck should return 200': (res) => res.status === 200,
        'postgres healthcheck should pass': (res) => res.json('#(name="postgres").statusText') === 'pass',
        'redis healthcheck should pass': (res) => res.json('#(name="redis").statusText') === 'pass',
    })
}

export function queryBasicEntities (data) {
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

    const ticketIds = allTicketsResponse.json('data.objs') as Array<{ id: string }>

    const allTicketCommentReadTimesPayload = {
        operationName: 'getAllUserTicketCommentReadTimes',
        query: 'query getAllUserTicketCommentReadTimes($where: UserTicketCommentReadTimeWhereInput, $first: Int = 100, $skip: Int, $sortBy: [SortUserTicketCommentReadTimesBy!]) { objs: allUserTicketCommentReadTimes( where: $where first: $first skip: $skip sortBy: $sortBy ) { user { id __typename } ticket { id __typename } readResidentCommentAt readCommentAt id dv sender { dv fingerprint __typename } v deletedAt newId createdBy { id name type __typename } updatedBy { id name __typename } createdAt updatedAt __typename } meta: _allUserTicketCommentReadTimesMeta(where: $where) { count __typename } }',
        variables: { first: 100, where: { ticket: { id_in: ticketIds.map(e => e.id) } } },
    }

    const allTicketCommentReadTimesResponse = sendAuthorizedRequest(data, allTicketCommentReadTimesPayload)

    check(allTicketCommentReadTimesResponse, {
        'all ticket comment status is 200': (res) => res.status === 200,
        'ticket comment read times response ok': (res) => Array.isArray(res.json('data.objs')),
    })

    sleep(0.5)
}

export function createTickets (data) {
    const response = createTicket(data)
    check(response, {
        'create ticket status is 200': (res) => res.status === 200,
        'ticket is created': (res) => res.json('data.obj.id') !== undefined,
    })
}

export async function checkFrontend (data) {
    const context = await browser.newContext()
    const page = await context.newPage()

    const organizationForCheckFrontend = setupOrganizationForCheckFrontend()
    let cookie
    let organizationLinkId

    if (organizationForCheckFrontend.cookie && organizationForCheckFrontend.organizationLinkId) {
        cookie = organizationForCheckFrontend.cookie
        organizationLinkId = organizationForCheckFrontend.organizationLinkId
    } else {
        cookie = data.cookie
        organizationLinkId = data.organizationLinkId
    }

    await context.addCookies([
        {
            name: 'keystone.sid',
            value: cookie,
            url: __ENV.BASE_URL,
        },
        {
            name: 'locale',
            value: 'en',
            url: __ENV.BASE_URL,
        },
        {
            name: 'cookieAgreementAccepted',
            value: 'true',
            url: __ENV.BASE_URL,
        },
        {
            name: 'organizationLinkId',
            value: organizationLinkId,
            url: __ENV.BASE_URL,
        },
    ])

    try {
        await Promise.all([
            page.goto(BASE_APP_URL),
            page.waitForNavigation(),
        ])

        await page.waitForTimeout(1000)

        await page.screenshot({ path: `apps/condo/k6/screenshots/ticketNavigation${__ITER}.png` })

        const ticketTable = await page.waitForSelector('[data-cy="ticket__table"] .ant-table-row-level-0')
        await ticketTable.isVisible()

        await page.screenshot({ path: `apps/condo/k6/screenshots/ticketTableLoadCompleted${__ITER}.png` })

        const ticketsHeader = await page.locator('h1').textContent() === 'Tickets'

        check(page, {
            'tickets table header': () => ticketsHeader,
            'tickets table url': () => page.url() === BASE_APP_URL,
        })

        const ticketId = await page
            .locator('[data-cy="ticket__table"] .ant-table-row-level-0:nth-of-type(2)')
            .getAttribute('data-row-key')

        await Promise.all([
            page.goto(BASE_APP_URL + '/' + ticketId),
            page.waitForNavigation(),
        ])

        const ticketH1 = await page.locator('h1').textContent()

        check(page, {
            'ticket detail url': () => page.url() === BASE_APP_URL + '/' + ticketId,
            'ticket detail header': () => ticketH1.includes('Ticket №'),
        })

        await page.screenshot({ path: `apps/condo/k6/screenshots/ticketDetail${__ITER}.png` })

        const ticketDetailH1 = await page.locator('h1').textContent()
        const ticketStatusSelectValue = await page
            .locator('[data-cy="ticket__status-select"] .ant-select-selection-item').textContent()

        check(page, {
            'ticket detail header': () => ticketDetailH1.includes('Ticket №'),
            'ticket detail url': () => page.url() !== BASE_APP_URL,
            'ticket status should be opened': () => ticketStatusSelectValue === 'Open',
        })

        await page.waitForSelector('[data-cy="ticket__status-select"]:not(.ant-select-disabled)')

        await page.locator('[data-cy="ticket__status-select"]').click()

        // Wait for select to become opened
        await page.waitForSelector('[data-cy="ticket__status-select-option"][title="In progress"]', {
            state: 'visible',
        })

        await page.locator('[data-cy="ticket__status-select-option"][title="In progress"]').click()

        await page.waitForSelector('[data-cy="ticket__status-select-option"][title="In progress"]', {
            state: 'hidden',
        })

        await page.waitForSelector('[data-cy="ticket__status-select"] .ant-select-selection-item[title="In progress"]', {
        })
        await page.waitForSelector('[data-cy="ticket__change-history"]', {
            state: 'visible',
        })

        const ticketStatusSelectUpdatedValue = await page
            .locator('[data-cy="ticket__status-select"] .ant-select-selection-item').textContent()

        check(page, {
            'ticket should be successfully change status': () => ticketStatusSelectUpdatedValue === 'In progress',
        })
        await page.screenshot({ path: `apps/condo/k6/screenshots/ticketDetailChangeStatus${__ITER}.png` })

    } finally {
        await page.close()
        await context.close()
    }
}
