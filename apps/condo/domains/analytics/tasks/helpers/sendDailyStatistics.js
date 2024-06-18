const dayjs = require('dayjs')
const get = require('lodash/get')
const LRUCache = require('lru-cache')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getSchemaCtx, find, itemsQuery, getByCondition } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { SEND_DAILY_STATISTICS_ORGANIZATIONS_ENABLED } = require('@condo/domains/common/constants/featureflags')
const { SEND_DAILY_STATISTICS_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { PROCESSING_STATUS_TYPE, NEW_OR_REOPENED_STATUS_TYPE, DEFERRED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { INCIDENT_STATUS_ACTUAL } = require('@condo/domains/ticket/constants/incident')


const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'sendDailyStatisticsTask' } }
const COMPACT_SCOPES_SIZE = 2
const EMPTY_LINE = '—'


const CACHE = new LRUCache({
    max: 100,
    maxAge: 1000 * 60 * 30, // 30 minutes is ms
})

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
    #logger = null
    #taskId = null

    /**
     *
     * @param userId
     * @param currentDate
     * @param logger
     * @param taskId
     */
    constructor (userId, currentDate, logger, taskId) {
        if (!userId) throw new Error('No userId!')

        this.#userId = userId
        this.#currentDate = currentDate || dayjs().toISOString()

        const { keystone: context } = getSchemaCtx('User')
        this.#context = context
        this.#logger = logger
        this.#taskId = taskId
    }

    /**
     *
     * @return {string[]}
     */
    getOrganizationIds () {
        return this.#organizationIds
    }

    /**
     *
     * @param organizationWhere
     * @return {Promise<CommonStatistics>}
     */
    async loadStatistics (organizationWhere = {}) {
        this.#statistics = this.#getStatisticsTemplate(this.#currentDate)
        this.#organizationIds = []

        const employees = await find('OrganizationEmployee', {
            deletedAt: null,
            user: { id: this.#userId, deletedAt: null },
            organization: { deletedAt: null, ...organizationWhere },
            isAccepted: true,
            isRejected: false,
            isBlocked: false,
            role: {
                canManageOrganization: true,
                deletedAt: null,
            },
        })

        const organizationIds = employees.map((employee) => employee.organization)

        for (const organizationId of organizationIds) {
            const loggerInfo = {
                taskId: this.#taskId,
                data: { organizationId, userId: this.#userId, currentDate: this.#currentDate },
            }

            const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(this.#context, SEND_DAILY_STATISTICS_ORGANIZATIONS_ENABLED, { organization: organizationId })
            if (!isFeatureEnabled) {
                this.#logger && this.#logger.info({
                    ...loggerInfo,
                    msg: `sendDailyStatistics disabled for organization ${organizationId}`,
                })
                continue
            }

            const organization = await getByCondition('Organization', {
                id: organizationId,
                deletedAt: null,
                ...organizationWhere,
            })

            if (!organization) {
                this.#logger && this.#logger.info({
                    ...loggerInfo,
                    msg: `cannot find organization by id: "${organizationId}"`,
                })
                continue
            }

            const organizationStatisticsData = await this.#getOrganizationStatisticsData(organizationId)
            this.#organizationIds.push(organizationId)

            this.#statistics.tickets.inProgress.total += organizationStatisticsData.tickets.inProgress
            if (organizationStatisticsData.tickets.inProgress > 0) {
                this.#statistics.tickets.inProgress.byOrganizations.push({ name: organization.name, count: organizationStatisticsData.tickets.inProgress })
            }
            this.#statistics.tickets.isEmergency.total += organizationStatisticsData.tickets.isEmergency
            if (organizationStatisticsData.tickets.isEmergency > 0) {
                this.#statistics.tickets.isEmergency.byOrganizations.push({ name: organization.name, count: organizationStatisticsData.tickets.isEmergency })
            }
            this.#statistics.tickets.isReturned.total += organizationStatisticsData.tickets.isReturned
            if (organizationStatisticsData.tickets.isReturned > 0) {
                this.#statistics.tickets.isReturned.byOrganizations.push({ name: organization.name, count: organizationStatisticsData.tickets.isReturned })
            }
            this.#statistics.tickets.isExpired.total += organizationStatisticsData.tickets.isExpired
            if (organizationStatisticsData.tickets.isExpired > 0) {
                this.#statistics.tickets.isExpired.byOrganizations.push({ name: organization.name, count: organizationStatisticsData.tickets.isExpired })
            }
            this.#statistics.tickets.withoutEmployee.total += organizationStatisticsData.tickets.withoutEmployee
            if (organizationStatisticsData.tickets.withoutEmployee > 0) {
                this.#statistics.tickets.withoutEmployee.byOrganizations.push({ name: organization.name, count: organizationStatisticsData.tickets.withoutEmployee })
            }

            this.#statistics.incidents.water.push(...organizationStatisticsData.incidents.water)
        }

        return this.#statistics
    }

    /**
     *
     * @param organizationId
     * @return {Promise<OrganizationStatisticsData>}
     */
    async #getOrganizationStatisticsData (organizationId) {
        if (CACHE.has(organizationId)) {
            this.#logger && this.#logger.info({
                msg: `Data for organization "${organizationId}" was taken from the cache`,
                taskId: this.#taskId,
                data: { organizationId, userId: this.#userId, currentDate: this.#currentDate },
            })
            return CACHE.peek(organizationId)
        }

        const {
            withoutEmployee,
            isExpired,
            isReturned,
            isEmergency,
            inProgress,
        } = await this.#getTicketsData(organizationId)
        const { water } = await this.#getIncidentsData(organizationId)

        const result = {
            tickets: {
                inProgress,
                isEmergency,
                isReturned,
                isExpired,
                withoutEmployee,
            },
            incidents: {
                water,
            },
        }

        CACHE.set(organizationId, result)

        return result
    }

    /**
     *
     * @param organizationId
     * @return {Promise<TicketsData>}
     */
    async #getTicketsData (organizationId) {
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

        return {
            inProgress,
            isEmergency,
            isReturned,
            isExpired,
            withoutEmployee,
        }
    }

    /**
     *
     * @param organizationId
     * @return {Promise<{water: IncidentData[]}>}
     */
    async #getIncidentsData (organizationId) {
        const incidents = await itemsQuery('Incident', {
            where: {
                deletedAt: null,
                organization: { id: organizationId, deletedAt: null },
                status: INCIDENT_STATUS_ACTUAL,
                // workType: INCIDENT_WORK_TYPE_SCHEDULED,
                AND: [
                    { workStart_gte: this.#currentDate },
                    { workStart_lte: dayjs(this.#currentDate).add(1, 'day').toISOString() },
                ],
            },
            sortBy: ['workStart_ASC', 'createdAt_ASC'],
            first: 50,
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
            water: waterIncidents,
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
                    total: 0,
                    byOrganizations: [],
                },
                isEmergency: {
                    total: 0,
                    byOrganizations: [],
                },
                isReturned: {
                    total: 0,
                    byOrganizations: [],
                },
                isExpired: {
                    total: 0,
                    byOrganizations: [],
                },
                withoutEmployee: {
                    total: 0,
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
     * @property {number} total
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
     * @typedef {object} OrganizationStatisticsData
     * @property {TicketsData} tickets
     *
     * @property {object} incidents
     * @property {IncidentData[]} incidents.water
     */

    /**
     * @typedef {object} TicketsData
     * @property {number} isEmergency
     * @property {number} isReturned
     * @property {number} inProgress
     * @property {number} isExpired
     * @property {number} withoutEmployee
     */
}

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

/**
 *
 * @param {TicketStatistic} ticketsStats
 * @return {string}
 */
const formatTicketsStats = ({ total, byOrganizations }) => {
    return `${total} (${
        byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
    })`
}

/**
 *
 * @param {CommonStatistics} userStatisticsData
 * @param {string} currentDate
 * @param {string} locale
 * @return {MessageData}
 */
const formatMessageData = (userStatisticsData, currentDate, locale = conf.DEFAULT_LOCALE) => {
    return {
        date: dayjs(currentDate).format('DD.MM.YY'),
        tickets: {
            inProgress: formatTicketsStats(userStatisticsData.tickets.inProgress),
            isEmergency: formatTicketsStats(userStatisticsData.tickets.isEmergency),
            isReturned: formatTicketsStats(userStatisticsData.tickets.isReturned),
            isExpired: formatTicketsStats(userStatisticsData.tickets.isExpired),
            withoutEmployee: formatTicketsStats(userStatisticsData.tickets.withoutEmployee),
        },
        incidents: {
            water: userStatisticsData.incidents.water.map((incident) => {
                let date, addresses

                const dateStart = dayjs(incident.workStart).format('DD-MM-YYYY')
                const dateFinish = incident.workFinish ? dayjs(incident.workFinish).format('DD-MM-YYYY') : null
                if (dateStart === dateFinish) {
                    date = dateStart
                } else {
                    date = [dateStart, dateFinish].filter(Boolean).join(` ${EMPTY_LINE} `)
                }

                if (incident.hasAllProperties) {
                    addresses = i18n('notification.messages.SEND_DAILY_STATISTICS_MESSAGE_TYPE.email.allProperties', { locale })
                } else {
                    const more = incident.count - COMPACT_SCOPES_SIZE
                    const moreProperties = more > 0
                        ? ` ${i18n('notification.messages.SEND_DAILY_STATISTICS_MESSAGE_TYPE.email.moreProperties', { locale, meta: { more } })}`
                        : ''
                    addresses = incident.addresses.filter(Boolean).join(', ') + moreProperties
                }

                return `${date} - ${addresses}`
            }).join('\n'),
        },
    }
}

const sendDailyMessageToUserSafely = async (context, logger, user, currentDate, taskId, organizationWhere = {}) => {
    try {
        const userStatistics = new UserDailyStatistics(user.id, currentDate, logger, taskId)
        const statisticsData = await userStatistics.loadStatistics(organizationWhere)

        const isEmptyStatistics = statisticsData.tickets.inProgress.total < 1
            && statisticsData.tickets.isEmergency.total < 1
            && statisticsData.tickets.isReturned.total < 1
            && statisticsData.tickets.isExpired.total < 1
            && statisticsData.tickets.withoutEmployee.total < 1

        if (isEmptyStatistics) {
            logger && logger.info({ msg: 'The email was not sent because the statistics are empty.', taskId, data: { currentDate, userId: user.id } })
            return 'statistics-is-empty'
        }

        const messageData = formatMessageData(statisticsData, currentDate, user.locale)

        const uniqKey = `send_daily_statistics_${user.id}_${dayjs(currentDate).format('DD-MM-YYYY')}`
        await sendMessage(context, {
            ...DV_SENDER,
            to: { email: user.email },
            lang: user.locale || conf.DEFAULT_LOCALE,
            type: SEND_DAILY_STATISTICS_MESSAGE_TYPE,
            uniqKey,
            meta: {
                dv: 1,
                data: messageData,

                // TODO(Alllex202): tags should be removed after testing!
                tags: [`orgId: ${userStatistics.getOrganizationIds().join('; ')}`.slice(0, 128)],
            },
        })

        logger && logger.info({ msg: 'The email has been sent.', taskId, data: { currentDate, userId: user.id } })
    } catch (error) {
        logger && logger.error({ msg: 'Failed to send email', error, taskId, data: { currentDate, userId: user.id } })
    }
}


module.exports = {
    sendDailyMessageToUserSafely,
    UserDailyStatistics,
}
