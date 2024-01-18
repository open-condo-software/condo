import { check, sleep } from 'k6'
import { browser } from 'k6/experimental/browser'
import http from 'k6/http'

const BASE_API_URL = __ENV.BASE_URL + '/admin/api'
const BASE_APP_URL = __ENV.BASE_URL + '/ticket'
const AUTH_REQS = { email: __ENV.AUTH_EMAIL, password: __ENV.AUTH_PASSWORD }

export const options = {
    scenarios: {
        queryTicketEntities: {
            exec: 'queryBasicEntities',
            executor: 'constant-arrival-rate',
            duration: '60s',
            rate: 5,
            timeUnit: '1s',
            preAllocatedVUs: 7,
        },
        appHealthcheck: {
            exec: 'healthcheck',
            executor: 'constant-arrival-rate',
            duration: '60s',
            rate: 2,
            timeUnit: '1s',
            preAllocatedVUs: 2,
        },
        createTickets: {
            exec: 'createTickets',
            executor: 'constant-arrival-rate',
            duration: '60s',
            rate: 1,
            timeUnit: '2s',
            preAllocatedVUs: 1,
        },
        browser: {
            exec: 'checkFrontend',
            executor: 'constant-vus',
            vus: 1,
            duration: '60s',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        browser_http_req_duration: ['p(95) < 1000'],
        http_req_duration: ['p(95)<2000'],
        browser_web_vital_fcp: ['p(95) < 2000'],
        browser_web_vital_lcp: ['p(95) < 4000'],
    },
}

export function setup () {
    const payload = {
        operationName: null,
        variables: {},
        query: `mutation {authenticateUserWithPassword(email: "${AUTH_REQS.email}" password: "${AUTH_REQS.password}") {token}}`,
    }

    const response = http.post(BASE_API_URL, JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } })

    const token = response.json('data.authenticateUserWithPassword.token')

    const BASIC_HEADERS = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }

    const createdOrganization = http.post(BASE_API_URL, JSON.stringify({
        operationName: 'registerNewOrganization',
        query: 'mutation registerNewOrganization($data:RegisterNewOrganizationInput!){obj:registerNewOrganization(data:$data){id}}',
        variables: {
            data: {
                dv: 1,
                sender: {
                    dv: 1,
                    fingerprint: 'k6-load-test',
                },
                name: 'k6-test',
                tin: '0000000000',
                meta: {
                    dv: 1,
                },
                type: 'MANAGING_COMPANY',
                country: 'ru',
            },
        },
    }), BASIC_HEADERS)

    const organizationId = createdOrganization.json('data.obj.id')

    // const { address } = buildFakeAddressAndMeta()
    // const address = faker.address.street()

    const createdProperty = http.post(BASE_API_URL, JSON.stringify({
        operationName: 'createProperty',
        query: 'mutation createProperty($data:PropertyCreateInput!){obj:createProperty(data:$data){id}}',
        variables: {
            data: {
                dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' },
                address: 'р Mississippi, г New Ollie, ул Roberts Club, д 65421183 б 56198',
                organization: { connect: { id: organizationId } },
                type: 'building',
            },
        },
    }), BASIC_HEADERS)

    return {
        data: {
            token,
            cookie: response.cookies['keystone.sid'][0]['value'],
            organizationId,
            propertyId: createdProperty.json('data.obj.id'),
        },
    }
}

export function healthcheck () {
    const appHealthcheck = http.get(__ENV.BASE_URL + '/server-health?checks=postgres,redis')

    check(appHealthcheck, {
        'healthcheck should return 200': (res) => res.status === 200,
        'postgres healthcheck should pass': (res) => res.json('postgres') === 'pass',
        'redis healthcheck should pass': (res) => res.json('redis') === 'pass',
    })
}

function sendGQLRequest (data, payload) {
    return http.post(BASE_API_URL, JSON.stringify(payload), {
        headers: {
            'Authorization': `Bearer ${data.data.token}`,
            'Content-Type': 'application/json',
        },
    })
}

export function queryBasicEntities (data) {
    const allTicketsPayload = {
        operationName: 'getAllTickets',
        query: 'query getAllTickets($where: TicketWhereInput, $first: Int = 100, $skip: Int, $sortBy: [SortTicketsBy!]) { objs: allTickets(where: $where, first: $first, skip: $skip, sortBy: $sortBy) { canReadByResident completedAt lastCommentAt lastResidentCommentAt isResidentTicket reviewValue reviewComment feedbackValue feedbackComment feedbackAdditionalOptions feedbackUpdatedAt qualityControlValue qualityControlComment qualityControlAdditionalOptions qualityControlUpdatedAt qualityControlUpdatedBy { id name __typename } deadline deferredUntil organization { id name country phone phoneNumberPrefix __typename } property { id name address deletedAt addressMeta { dv value unrestricted_value data { postal_code country country_iso_code federal_district region_fias_id region_kladr_id region_iso_code region_with_type region_type region_type_full region area_fias_id area_kladr_id area_with_type area_type area_type_full area city_fias_id city_kladr_id city_with_type city_type city_type_full city city_area city_district_fias_id city_district_kladr_id city_district_with_type city_district_type city_district_type_full city_district settlement_fias_id settlement_kladr_id settlement_with_type settlement_type settlement_type_full settlement street_fias_id street_kladr_id street_with_type street_type street_type_full street house_fias_id house_kladr_id house_type house_type_full house block_type block_type_full block entrance floor flat_fias_id flat_type flat_type_full flat flat_area square_meter_price flat_price postal_box fias_id fias_code fias_level fias_actuality_state kladr_id geoname_id capital_marker okato oktmo tax_office tax_office_legal timezone geo_lat geo_lon beltway_hit beltway_distance metro { name line distance __typename } qc_geo qc_complete qc_house history_values unparsed_parts source qc __typename } __typename } __typename } propertyAddress propertyAddressMeta { dv value unrestricted_value data { postal_code country country_iso_code federal_district region_fias_id region_kladr_id region_iso_code region_with_type region_type region_type_full region area_fias_id area_kladr_id area_with_type area_type area_type_full area city_fias_id city_kladr_id city_with_type city_type city_type_full city city_area city_district_fias_id city_district_kladr_id city_district_with_type city_district_type city_district_type_full city_district settlement_fias_id settlement_kladr_id settlement_with_type settlement_type settlement_type_full settlement street_fias_id street_kladr_id street_with_type street_type street_type_full street house_fias_id house_kladr_id house_type house_type_full house block_type block_type_full block entrance floor flat_fias_id flat_type flat_type_full flat flat_area square_meter_price flat_price postal_box fias_id fias_code fias_level fias_actuality_state kladr_id geoname_id capital_marker okato oktmo tax_office tax_office_legal timezone geo_lat geo_lon beltway_hit beltway_distance metro { name line distance __typename } qc_geo qc_complete qc_house history_values unparsed_parts source qc __typename } __typename } unitType unitName sectionName sectionType floorName status { id name type organization { id __typename } colors { primary secondary additional __typename } __typename } statusReopenedCounter statusUpdatedAt statusReason number client { id name __typename } clientName clientEmail clientPhone contact { id name phone email unitName unitType __typename } assignee { id name __typename } executor { id name __typename } details related { id details __typename } isAutoClassified isEmergency isPaid isPayable isWarranty meta source { id name type __typename } sourceMeta categoryClassifier { id __typename } placeClassifier { id __typename } problemClassifier { id __typename } classifier { id place { id name __typename } category { id name __typename } problem { id name __typename } __typename } id dv sender { dv fingerprint __typename } v deletedAt newId createdBy { id name type __typename } updatedBy { id name __typename } createdAt updatedAt __typename } meta: _allTicketsMeta(where: $where) { count __typename } }',
        variables: { first: 30, where: { organization: { id: data.data.organizationId } } },
    }

    const allTicketsResponse = sendGQLRequest(data, allTicketsPayload)

    check(allTicketsResponse, {
        'status is 200': (res) => res.status === 200,
        'tickets response ok': (res) => {
            const result = res.json('data.objs')

            if (Array.isArray(result)) {
                if (result.length > 0) return result[0]['id'] !== undefined
                return true
            }
            return false
        },
    })

    const allTicketCommentReadTimesPayload = {
        operationName: 'getAllUserTicketCommentReadTimes',
        query: 'query getAllUserTicketCommentReadTimes($where: UserTicketCommentReadTimeWhereInput, $first: Int = 100, $skip: Int, $sortBy: [SortUserTicketCommentReadTimesBy!]) { objs: allUserTicketCommentReadTimes( where: $where first: $first skip: $skip sortBy: $sortBy ) { user { id __typename } ticket { id __typename } readResidentCommentAt readCommentAt id dv sender { dv fingerprint __typename } v deletedAt newId createdBy { id name type __typename } updatedBy { id name __typename } createdAt updatedAt __typename } meta: _allUserTicketCommentReadTimesMeta(where: $where) { count __typename } }',
        // @ts-ignore-next-line
        variables: { first: 100, where: { ticket: { id_in: allTicketsResponse.json('data.objs').map(e => e.id) } } },
    }

    const allTicketCommentReadTimesResponse = sendGQLRequest(data, allTicketCommentReadTimesPayload)

    check(allTicketCommentReadTimesResponse, {
        'status is 200': (res) => res.status === 200,
        'ticket comment read times response ok': (res) => Array.isArray(res.json('data.objs')),
    })

    sleep(0.5)
}

export function createTickets (data) {
    const payload = {
        operationName: 'createTicket',
        query: 'mutation createTicket($data: TicketCreateInput) {obj: createTicket(data: $data) {id}}',
        variables: {
            data: {
                dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' },
                organization: { connect: { id: data.data.organizationId } },
                status: { connect: { id: '6ef3abc4-022f-481b-90fb-8430345ebfc2' } },
                classifier: { connect: { id: '92b39cea-72f0-4c52-9d32-5a4ffe5240d2' } },
                property: { connect: { id: data.data.propertyId } },
                source: { connect: { id: '779d7bb6-b194-4d2c-a967-1f7321b2787f' } },
                unitType: 'flat',
                details: 'Api created ticket ' + __VU + ' ' + __ITER,
            },
        },
    }

    const response = http.post(BASE_API_URL, JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.data.token}`,
        },
    })

    check(response, {
        'status is 200': (res) => res.status === 200,
        'ticket is created': (res) => res.json('data.obj.id') !== undefined,
    })
}

export async function checkFrontend (data) {
    const context = browser.newContext()
    const page = context.newPage()

    context.addCookies([
        {
            name: 'keystone.sid',
            value: data.data.cookie,
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
            value: data.data.organizationId,
            url: __ENV.BASE_URL,
        },
    ])

    try {
        await Promise.all([
            page.goto(BASE_APP_URL),
            page.waitForNavigation,
        ])

        page.waitForTimeout(1000)

        page.screenshot({ path: `apps/condo/k6/screenshots/ticketNavigation${__ITER}.png` })

        page.waitForSelector('[data-cy="ticket__table"] .ant-table-row-level-0').isVisible()

        page.screenshot({ path: `apps/condo/k6/screenshots/ticketTableLoadCompleted${__ITER}.png` })

        check(page, {
            'tickets table header': () => page.locator('h1').textContent() === 'Tickets',
            'tickets table url': () => page.url() === BASE_APP_URL,
        })

        const ticketId = page
            .locator('[data-cy="ticket__table"] .ant-table-row-level-0:nth-of-type(2)')
            .getAttribute('data-row-key')

        await Promise.all([
            page.goto(BASE_APP_URL + '/' + ticketId),
            page.waitForNavigation(),
        ])

        check(page, {
            'ticket detail url': () => page.url() === BASE_APP_URL + '/' + ticketId,
            'ticket detail header': () => page.locator('h1').textContent().includes('Ticket №'),
        })

        page.screenshot({ path: `apps/condo/k6/screenshots/ticketDetail${__ITER}.png` })

        check(page, {
            'ticket detail header': () => page.locator('h1').textContent().includes('Ticket №'),
            'ticket detail url': () => page.url() !== BASE_APP_URL,
            'ticket status should be opened': () => page.locator('[data-cy="ticket__status-select"] .ant-select-selection-item').textContent() === 'Open',
        })

        await page.locator('[data-cy="ticket__status-select"]').click()

        // Wait for select to become opened
        page.waitForSelector('[data-cy="ticket__status-select-option"][title="In progress"]', {
            state: 'visible',
            timeout: 1000,
        })

        await page.locator('[data-cy="ticket__status-select-option"][title="In progress"]').click()

        page.waitForSelector('[data-cy="ticket__status-select-option"][title="In progress"]', {
            state: 'hidden',
            timeout: 1000,
        })

        page.waitForSelector('[data-cy="ticket__status-select"] .ant-select-selection-item[title="In progress"]', {
            timeout: 1000,
        })
        page.waitForSelector('[data-cy="ticket__change-history"]', {
            timeout: 1000,
            state: 'visible',
        })

        page.waitForLoadState('networkidle')

        check(page, {
            'ticket should be successfully change status': () => {
                return page
                    .locator('[data-cy="ticket__status-select"] .ant-select-selection-item')
                    .textContent({ timeout: 1000 }) === 'In progress'
            },

        })
        page.screenshot({ path: `apps/condo/k6/screenshots/ticketDetailChangeStatus${__ITER}.png` })

    } finally {
        page.close()
    }
}
