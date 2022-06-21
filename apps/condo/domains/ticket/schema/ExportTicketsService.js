const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const { GQLCustomSchema } = require('@core/keystone/schema')
const conf = require('@core/config')
const { extractReqLocale } = require('@condo/domains/common/utils/locale')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const access = require('@condo/domains/ticket/access/ExportTicketsService')
const { EXCEL } = require('@condo/domains/common/constants/export')
const { startExportTicketsTask } = require('../tasks/exportTicketsTask')

dayjs.extend(utc)
dayjs.extend(timezone)


// TODO(zuch): if we add timeZone and locale to organization settings use organization timeZone instead of client's timezone
const ExportTicketsService = new GQLCustomSchema('ExportTicketsService', {
    types: [
        {
            access: true,
            type: 'input ExportTicketsToExcelInput { dv: Int!, sender: SenderFieldInput!, where: TicketWhereInput!, sortBy: [SortTicketsBy!], timeZone: String! }',
        },
        {
            access: true,
            type: 'type ExportTicketsToExcelOutput { task: TicketExportTask }',
        },
    ],
    queries: [
        {
            access: access.canExportTicketsToExcel,
            schema: 'exportTicketsToExcel(data: ExportTicketsToExcelInput!): ExportTicketsToExcelOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { dv, sender, where, sortBy, timeZone: timeZoneFromUser } = args.data
                const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
                const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE
                const user = context.authedItem

                const task = await startExportTicketsTask(context, user, {
                    dv,
                    sender,
                    format: EXCEL,
                    where,
                    sortBy,
                    locale,
                    timeZone,
                })

                return { task }
            },
        },
    ],
    mutations: [],
})

module.exports = {
    ExportTicketsService,
}
