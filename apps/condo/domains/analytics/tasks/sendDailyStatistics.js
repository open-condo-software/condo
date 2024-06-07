const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getSchemaCtx, find, itemsQuery, getByCondition } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const { loadListByChunks } = require('../../common/utils/serverSchema')
const { SEND_DAILY_STATISTICS_MESSAGE_TYPE } = require('../../notification/constants/constants')
const { PROCESSING_STATUS_TYPE, NEW_OR_REOPENED_STATUS_TYPE, DEFERRED_STATUS_TYPE } = require('../../ticket/constants')
const { INCIDENT_WORK_TYPE_SCHEDULED, INCIDENT_STATUS_ACTUAL } = require('../../ticket/constants/incident')
const { STAFF } = require('../../user/constants/common')
const { User } = require('../../user/utils/serverSchema')


const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'sendDailyStatisticsTask' } }
const COMPACT_SCOPES_SIZE = 2
const EMPTY_LINE = '—'

// TODO(DOMA-9177): add cache

/**
 *
 * @param organizationId
 * @param now
 * @return {Promise<{tickets: {isEmergency: number, isReturned: number, inProgress: number, isExpired: number, withoutEmployee: number}, organization: { id: string, name: string, inn: string }, incidents: {workStart: string, workFinish: string, hasAllProperties: boolean, addresses: string[], count: number}[]}>}
 */
const getOrganizationData = async (organizationId, now) => {
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
            deadline_lt: now,
        },
    }, { meta: true })
    const { count: withoutEmployee } = await itemsQuery('Ticket', {
        where: {
            deletedAt: null,
            organization: { id: organizationId, deletedAt: null },
            status: { type_in: [NEW_OR_REOPENED_STATUS_TYPE, PROCESSING_STATUS_TYPE] },
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
        workType: INCIDENT_WORK_TYPE_SCHEDULED,
        AND: [
            { workStart_gte: now },
            { workFinish_lte: dayjs(now).add(1, 'day').toISOString() },
        ],
    })

    const incidentsData = []
    for (const incident of incidents) {

        const { count: countIncidentClassifierIncident } = await itemsQuery('IncidentClassifierIncident', {
            incident: { id: incident.id, deletedAt: null },
            deletedAt: null,
            classifier: {
                category: {
                    // water
                    id: '4509f01b-3f9b-4a07-83ea-3b548c492146',
                },
                problem: {
                    // нет воды/горячей/холодной
                    id_in: [
                        '79af87cc-9b17-4f0e-a527-2f61beffd5e1',
                        '5289e8aa-e5f9-4dc5-8540-49f6e0b2a004',
                        '96f91218-1e03-4258-9883-64cf0753ac45',
                    ],
                },
            },
        })

        const isWaterIncident = !countIncidentClassifierIncident
        if (isWaterIncident) continue

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

        incidentsData.push(incidentData)
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
        incidents: incidentsData,
    }
}

const sendDailyStatistics = async () => {

    const now = dayjs().toISOString()

    const { keystone: context } = getSchemaCtx('User')

    // 1) Получить юзера
    // 2) В каких организациях состоит
    // 3) Достать аналитику из каждой организации
    // 4) Отправить письмо

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

                const employees = await find('OrganizationEmployee', {
                    deletedAt: null,
                    user: { id: user.id },
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

                const combinedStatistics = {
                    date: now,
                    tickets: {
                        inProgress: {
                            common: 0,
                            byOrganizations: [],
                            text: '',
                        },
                        isEmergency: {
                            common: 0,
                            byOrganizations: [],
                            text: '',
                        },
                        isReturned: {
                            common: 0,
                            byOrganizations: [],
                            text: '',
                        },
                        isExpired: {
                            common: 0,
                            byOrganizations: [],
                            text: '',
                        },
                        withoutEmployee: {
                            common: 0,
                            byOrganizations: [],
                            text: '',
                        },
                    },
                    incidents: {
                        water: {
                            list: [],
                            text: '',
                        },
                    },
                }

                for (const organizationId of organizationIds) {
                    const organizationData = await getOrganizationData(organizationId, now)

                    combinedStatistics.tickets.inProgress.common += organizationData.tickets.inProgress
                    combinedStatistics.tickets.inProgress.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.inProgress })
                    combinedStatistics.tickets.isEmergency.common += organizationData.tickets.isEmergency
                    combinedStatistics.tickets.isEmergency.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.isEmergency })
                    combinedStatistics.tickets.isReturned.common += organizationData.tickets.isReturned
                    combinedStatistics.tickets.isReturned.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.isReturned })
                    combinedStatistics.tickets.isExpired.common += organizationData.tickets.isExpired
                    combinedStatistics.tickets.isExpired.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.isExpired })
                    combinedStatistics.tickets.withoutEmployee.common += organizationData.tickets.withoutEmployee
                    combinedStatistics.tickets.withoutEmployee.byOrganizations.push({ name: organizationData.organization.name, count: organizationData.tickets.withoutEmployee })

                    combinedStatistics.incidents.water.list.push(organizationData.incidents.map((incident) => {
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

                        return {
                            date,
                            addresses,
                        }
                    }))
                }

                combinedStatistics.tickets.inProgress.text = `${combinedStatistics.tickets.inProgress.common} (${
                    combinedStatistics.tickets.inProgress.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`
                combinedStatistics.tickets.isEmergency.text = `${combinedStatistics.tickets.isEmergency.common} (${
                    combinedStatistics.tickets.isEmergency.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`
                combinedStatistics.tickets.isReturned.text = `${combinedStatistics.tickets.isReturned.common} (${
                    combinedStatistics.tickets.isReturned.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`
                combinedStatistics.tickets.isExpired.text = `${combinedStatistics.tickets.isExpired.common} (${
                    combinedStatistics.tickets.isExpired.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`
                combinedStatistics.tickets.withoutEmployee.text = `${combinedStatistics.tickets.withoutEmployee.common} (${
                    combinedStatistics.tickets.withoutEmployee.byOrganizations.map(item => `${item.name} - ${item.count}`).join('; ')
                })`

                combinedStatistics.incidents.water.text = combinedStatistics.incidents.water.list.map(item => `${item.date} - ${item.addresses}`).join('\n')

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
                        data: {
                            date: combinedStatistics.date,
                            tickets: combinedStatistics.tickets,
                            incidents: combinedStatistics.incidents,
                        },
                    },
                })
            }

            return []
        },
    })

}

module.exports = {
    sendDailyStatisticsTask: createCronTask('sendDailyStatistics', '0 1 * * *', sendDailyStatistics),
}
