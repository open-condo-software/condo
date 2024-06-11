const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getSchemaCtx, find, itemsQuery, getByCondition } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { SEND_DAILY_STATISTICS_TASK } = require('@condo/domains/common/constants/featureflags')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { SEND_DAILY_STATISTICS_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { PROCESSING_STATUS_TYPE, NEW_OR_REOPENED_STATUS_TYPE, DEFERRED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { INCIDENT_WORK_TYPE_SCHEDULED, INCIDENT_STATUS_ACTUAL } = require('@condo/domains/ticket/constants/incident')
const { STAFF } = require('@condo/domains/user/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')


const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'sendDailyStatisticsTask' } }
const COMPACT_SCOPES_SIZE = 2
const EMPTY_LINE = '—'


class UserDailyStatistics {
    /** @type {string} */
    #currentDate = dayjs().toISOString()
    /** @type {string[]} */
    #organizationIds = []
    /** @type {CommonStatistics|null} */
    #statistics = null
    /** @type {string|null} */
    #userId = null
    #context = null

    /**
     *
     * @param context
     * @param userId
     * @param currentDate
     */
    constructor (userId, currentDate) {
        if (!userId) throw new Error('No userId!')

        this.#userId = userId
        this.#currentDate = currentDate || dayjs().toISOString()

        const { keystone: context } = getSchemaCtx('User')
        this.#context = context
    }

    // todo(doma-9177): вынести из класса, это не логика получения аналитики, а просто преобразование для рендера письма
    /**
     *
     * @return {MessageData}
     */
    getMessageData () {
        return {
            date: dayjs(this.#currentDate).format('DD-MM-YYYY'),
            tickets: {
                inProgress: `${this.#statistics.tickets.inProgress.common} (${
                    this.#statistics.tickets.inProgress.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`,
                isEmergency: `${this.#statistics.tickets.isEmergency.common} (${
                    this.#statistics.tickets.isEmergency.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`,
                isReturned: `${this.#statistics.tickets.isReturned.common} (${
                    this.#statistics.tickets.isReturned.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`,
                isExpired: `${this.#statistics.tickets.isExpired.common} (${
                    this.#statistics.tickets.isExpired.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`,
                withoutEmployee: `${this.#statistics.tickets.withoutEmployee.common} (${
                    this.#statistics.tickets.withoutEmployee.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`,
            },
            incidents: {
                water: this.#statistics.incidents.water.map((incident) => {
                    let date, addresses

                    if (dayjs(incident.workFinish).diff(dayjs(incident.workStart), 'hours') < 24) {
                        date = dayjs(incident.workStart).format('DD-MM-YYYY')
                    } else {
                        date = [
                            dayjs(incident.workStart).format('DD-MM-YYYY'),
                            dayjs(incident.workFinish).format('DD-MM-YYYY'),
                        ].filter(Boolean).join(` ${EMPTY_LINE} `)
                    }

                    if (incident.hasAllProperties) {
                        addresses = 'All properties'
                    } else {
                        const more = incident.count - COMPACT_SCOPES_SIZE
                        addresses = [...incident.addresses.slice(0, COMPACT_SCOPES_SIZE)]
                            .filter(Boolean)
                            .join(', ') + more > 0 ? ` and more ${more} properties` : ''
                    }

                    return `${date} - ${addresses}`
                }).join('\n'),
            },
        }
    }

    getOrganizationIds () {
        return this.#organizationIds
    }

    /**
     *
     * @return {Promise<{CommonStatistics>}
     */
    async loadStatistics () {
        this.#statistics = this.#getStatisticsTemplate(this.#currentDate)

        const employees = await find('OrganizationEmployee', {
            deletedAt: null,
            user: { id: this.#userId, deletedAt: null },
            organization: { deletedAt: null },
            isAccepted: true,
            isRejected: false,
            isBlocked: false,
            role: {
                canManageOrganization: true,
                deletedAt: null,
            },
        })

        const organizationIds = employees.map((employee) => employee.organization)
        this.#organizationIds = organizationIds

        for (const organizationId of organizationIds) {

            const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(this.#context, SEND_DAILY_STATISTICS_TASK, { organization: organizationId })
            if (!isFeatureEnabled) continue

            const organizationData = await this.#getOrganizationData(organizationId)

            this.#statistics.tickets.inProgress.common += organizationData.tickets.inProgress
            if (organizationData.tickets.inProgress > 0) {
                this.#statistics.tickets.inProgress.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.inProgress })
            }
            this.#statistics.tickets.isEmergency.common += organizationData.tickets.isEmergency
            if (organizationData.tickets.isEmergency > 0) {
                this.#statistics.tickets.isEmergency.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.isEmergency })
            }
            this.#statistics.tickets.isReturned.common += organizationData.tickets.isReturned
            if (organizationData.tickets.isReturned > 0) {
                this.#statistics.tickets.isReturned.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.isReturned })
            }
            this.#statistics.tickets.isExpired.common += organizationData.tickets.isExpired
            if (organizationData.tickets.isExpired > 0) {
                this.#statistics.tickets.isExpired.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.isExpired })
            }
            this.#statistics.tickets.withoutEmployee.common += organizationData.tickets.withoutEmployee
            if (organizationData.tickets.withoutEmployee > 0) {
                this.#statistics.tickets.withoutEmployee.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.withoutEmployee })
            }

            this.#statistics.incidents.water.push(...organizationData.incidents.water)
        }

        return this.#statistics
    }

    /**
     *
     * @param organizationId
     * @return {Promise<OrganizationData>}
     */
    async #getOrganizationData (organizationId) {
        // TODO(DOMA-9177): add cache

        const organization = await getByCondition('Organization', {
            id: organizationId,
            deletedAt: null,
        })

        if (!organization) {
            throw new Error(`cannot find organization by id: "${organizationId}"`)
        }

        // ----------- Tickets -----------

        const { count: inProgress } = await itemsQuery('Ticket', {
            where: {
                deletedAt: null,
                organization: { id: organizationId, deletedAt: null },
                status: { type: PROCESSING_STATUS_TYPE },
            },
        }, { meta: true })
        const { count: isEmergency } = await itemsQuery('Ticket', {
            where: {
                deletedAt: null,
                organization: { id: organizationId, deletedAt: null },
                status: { type: NEW_OR_REOPENED_STATUS_TYPE },
                isEmergency: true,
            },
        }, { meta: true })
        const { count: isReturned } = await itemsQuery('Ticket', {
            where: {
                deletedAt: null,
                organization: { id: organizationId, deletedAt: null },
                status: { type: NEW_OR_REOPENED_STATUS_TYPE },
                statusReopenedCounter_gte: 1,
            },
        }, { meta: true })
        const { count: isExpired } = await itemsQuery('Ticket', {
            where: {
                deletedAt: null,
                organization: { id: organizationId, deletedAt: null },
                status: { type_in: [NEW_OR_REOPENED_STATUS_TYPE, PROCESSING_STATUS_TYPE, DEFERRED_STATUS_TYPE] },
                deadline_lt: this.#currentDate,
            },
        }, { meta: true })
        const { count: withoutEmployee } = await itemsQuery('Ticket', {
            where: {
                deletedAt: null,
                organization: { id: organizationId, deletedAt: null },
                status: { type_in: [NEW_OR_REOPENED_STATUS_TYPE] },
                // removed employees? users? blocked?
                OR: [
                    { assignee_is_null: true },
                    { executor_is_null: true },
                ],
            },
        }, { meta: true })


        // ----------- Incidents -----------

        const incidents = await find('Incident', {
            deletedAt: null,
            organization: { id: organizationId, deletedAt: null },
            status: INCIDENT_STATUS_ACTUAL,
            // workType: INCIDENT_WORK_TYPE_SCHEDULED,
            AND: [
                { workStart_gte: this.#currentDate },
                { workStart_lte: dayjs(this.#currentDate).add(1, 'day').toISOString() },
            ],
        })

        const waterIncidents = []
        for (const incident of incidents) {

            const { count: countIncidentClassifierIncident } = await itemsQuery('IncidentClassifierIncident', {
                where: {
                    incident: { id: incident.id, deletedAt: null },
                    deletedAt: null,
                    classifier: {
                        category: {
                            id: '4509f01b-3f9b-4a07-83ea-3b548c492146', // Water
                        },
                        problem: {
                            id_in: [
                                '79af87cc-9b17-4f0e-a527-2f61beffd5e1', // No hot and cold water
                                '5289e8aa-e5f9-4dc5-8540-49f6e0b2a004', // No hot water
                                '96f91218-1e03-4258-9883-64cf0753ac45', // No cold water
                            ],
                        },
                    },
                },
            }, { meta: true })

            const isWaterIncident = countIncidentClassifierIncident > 0
            if (!isWaterIncident) continue

            const incidentData = {
                workStart: get(incident, 'workStart'),
                workFinish: get(incident, 'workFinish'),
            }

            if (incident.hasAllProperties) {
                incidentData.hasAllProperties = true
            } else {
                const firstOnesIncidentProperties = await itemsQuery('IncidentProperty', {
                    where: {
                        incident: { id: incident.id }, deletedAt: null,
                    },
                    first: COMPACT_SCOPES_SIZE + 1,
                    orderBy: 'createdAt_ASC',
                })

                let count = 0
                if (firstOnesIncidentProperties.length > COMPACT_SCOPES_SIZE) {
                    const { count: countObjs } = await itemsQuery('NewsItemScope', {
                        where: {
                            incident: { id: incident.id }, deletedAt: null,
                        },
                    }, { meta: true })
                    count = countObjs
                } else {
                    count = firstOnesIncidentProperties.length
                }

                incidentData.addresses = firstOnesIncidentProperties.slice(0, COMPACT_SCOPES_SIZE).map(item => get(item, 'propertyAddress', EMPTY_LINE))
                incidentData.count = count
            }

            waterIncidents.push(incidentData)
        }

        return {
            organization,
            tickets: {
                inProgress,
                isEmergency,
                isReturned,
                isExpired,
                withoutEmployee,
            },
            incidents: {
                water: waterIncidents,
            },
        }
    }

    /**
     *
     * @param currentDate
     * @return {CommonStatistics}
     */
    #getStatisticsTemplate (currentDate) {
        return {
            date: currentDate,
            tickets: {
                inProgress: {
                    common: 0,
                    byOrganizations: [],
                },
                isEmergency: {
                    common: 0,
                    byOrganizations: [],
                },
                isReturned: {
                    common: 0,
                    byOrganizations: [],
                },
                isExpired: {
                    common: 0,
                    byOrganizations: [],
                },
                withoutEmployee: {
                    common: 0,
                    byOrganizations: [],
                },
            },
            incidents: {
                water: [],
            },
        }
    }

    /**
     * @typedef {object} CommonStatistics
     * @property {string} date
     * @property {object} tickets
     * @property {TicketStatistic} tickets.isEmergency
     * @property {TicketStatistic} tickets.isReturned
     * @property {TicketStatistic} tickets.inProgress
     * @property {TicketStatistic} tickets.isExpired
     * @property {TicketStatistic} tickets.withoutEmployee
     * @property {object} incidents
     * @property {IncidentData[]} incidents.water
     */

    /**
     * @typedef {object} TicketStatistic
     * @property {{ count: number, name: string }[]} byOrganizations
     * @property {number} common
     */

    /**
     * @typedef {object} IncidentData
     * @property {string} workStart
     * @property {string} [workFinish]
     * @property {boolean} [hasAllProperties]
     * @property {string[]} [addresses]
     * @property {number} [count]
     */

    /**
     * @typedef {object} OrganizationData
     * @property {object} tickets
     * @property {number} tickets.isEmergency
     * @property {number} tickets.isReturned
     * @property {number} tickets.inProgress
     * @property {number} tickets.isExpired
     * @property {number} tickets.withoutEmployee
     *
     * @property {object} organization
     * @property {string} organization.id
     * @property {string} organization.name
     * @property {string} organization.inn
     *
     * @property {object} incidents
     * @property {IncidentData[]} incidents.water
     */

    /**
     * @typedef {object} MessageData
     * @property {string} date
     * @property {object} tickets
     * @property {string} tickets.isEmergency
     * @property {string} tickets.isReturned
     * @property {string} tickets.inProgress
     * @property {string} tickets.isExpired
     * @property {string} tickets.withoutEmployee
     * @property {object} incidents
     * @property {string} incidents.water
     */
}

const sendDailyStatistics = async () => {

    const now = dayjs().toISOString()

    const { keystone: context } = getSchemaCtx('User')

    await loadListByChunks({
        context,
        list: User,
        chunkSize: 50,
        where: {
            deletedAt: null,
            isSupport: false,
            isAdmin: false,
            rightsSet: null,
            type: STAFF,
            AND: [
                { email_not_contains: '@doma.ai' },
                { email_not: null },
            ],
            // isEmailVerified: true,
        },
        /**
         * @param {User[]} chunk
         * @returns {User[]}
         */
        chunkProcessor: async (chunk) => {
            for (const user of chunk) {

                const userStatistics = new UserDailyStatistics(user.id, now)
                await userStatistics.loadStatistics()
                const messageData = userStatistics.getMessageData()
                const organizationIds = userStatistics.getOrganizationIds()

                const uniqKey = `send_daily_statistics_${user.id}`
                await sendMessage(context, {
                    ...DV_SENDER,
                    to: { email: user.email },
                    lang: conf.DEFAULT_LOCALE, // or user.lang, org.lang?
                    type: SEND_DAILY_STATISTICS_MESSAGE_TYPE,
                    uniqKey,
                    meta: {
                        dv: 1,
                        tags: [`orgId: ${organizationIds.join('; ')}`.slice(0, 128)],
                        data: messageData,
                    },
                })
            }

            return []
        },
    })

}

module.exports = {
    UserDailyStatistics,
    // At 06:00
    sendDailyStatisticsTask: createCronTask('sendDailyStatistics', '0 6 * * *', sendDailyStatistics),
}
