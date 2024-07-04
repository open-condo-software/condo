const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const {
    TICKET_DOCUMENT_TYPE,
    TICKET_DOCUMENT_GENERATION_TASK_STATUS,
    SUPPORTED_DOCUMENT_TYPES_BY_LOCALE,
} = require('@condo/domains/ticket/constants/ticketDocument')
const { TicketDocumentGenerationTask } = require('@condo/domains/ticket/utils/serverSchema')
const { generateTicketDocumentOfCompletionWorks } = require('@condo/domains/ticket/utils/serverSchema/TicketDocumentGeneration')


const appLogger = getLogger('condo')
const taskLogger = appLogger.child({ module: 'tasks/generateTicketDocument' })

const BASE_ATTRS = {
    dv: 1,
    sender: {
        dv: 1,
        fingerprint: TASK_WORKER_FINGERPRINT,
    },
}

const generateTicketDocument = async (taskId) => {
    let task, context
    try {
        taskLogger.info({ msg: 'Start of generating ticket document', taskId })

        if (!taskId) throw new Error('no taskId!')

        const { keystone: _context } = getSchemaCtx('TicketDocumentGenerationTask')
        context = _context

        task = await TicketDocumentGenerationTask.getOne(context, {
            id: taskId,
            deletedAt: null,
        })
        if (!task) throw new Error('not found task!')

        const ticketId = get(task, 'ticket.id')
        if (!ticketId) throw new Error('not found ticketId!')
        const ticket = await getById('Ticket', task.ticket.id)
        if (!ticket || ticket.deletedAt) throw new Error('not found ticket!')

        const organization = await getById('Organization', ticket.organization)
        if (!organization || organization.deletedAt) throw new Error('not found organization!')

        const country = get(organization, 'country', conf.DEFAULT_LOCALE)
        const locale = get(COUNTRIES, country).locale
        const documentType = get(task, 'documentType')

        if (!(get(SUPPORTED_DOCUMENT_TYPES_BY_LOCALE, [locale]) || []).includes(documentType)) {
            throw new Error(`unsupported locale "${locale}" for documentType "${documentType}"`)
        }

        setLocaleForKeystoneContext(context, locale)

        let fileUploadInput

        switch (documentType) {
            case TICKET_DOCUMENT_TYPE.COMPLETION_WORKS: {
                fileUploadInput = await generateTicketDocumentOfCompletionWorks({ task, locale, organization, ticket, context, baseAttrs: BASE_ATTRS })
                break
            }

            default: {
                throw new Error(`unexpected document type "${documentType}" for a document generation`)
            }
        }

        if (!fileUploadInput) throw new Error('failed to generate document for uploading!')

        await TicketDocumentGenerationTask.update(context, task.id, {
            ...BASE_ATTRS,
            progress: 100,
            status: TICKET_DOCUMENT_GENERATION_TASK_STATUS.COMPLETED,
            file: fileUploadInput,
        })

        taskLogger.info({ msg: 'Successful generation of ticket document', taskId })
    } catch (error) {
        taskLogger.error({ msg: 'Fail of generating ticket document', taskId, error })

        if (task && context) {
            await TicketDocumentGenerationTask.update(context, task.id, {
                ...BASE_ATTRS,
                status: TICKET_DOCUMENT_GENERATION_TASK_STATUS.ERROR,
                meta: { ...task.meta, error: error.message },
            })
        }

        throw error
    }
}


module.exports = {
    generateTicketDocument: createTask('generateTicketDocument', generateTicketDocument, 'low'),
}
