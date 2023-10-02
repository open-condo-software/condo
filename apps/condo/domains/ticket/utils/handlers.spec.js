import {
    detectTicketEventTypes,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
} from './handlers'

const { faker } = require('@faker-js/faker')


const { STATUS_IDS } = require('../constants/statusTransitions')

describe('Ticket request event detection', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    it('correctly detects assignee connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { assignee: 'xxx' },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [ASSIGNEE_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects executor connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { executor: 'xxx' },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [EXECUTOR_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects assignee and executor connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { assignee: 'xxx', executor: 'yyy' },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject(
            { [ASSIGNEE_CONNECTED_EVENT_TYPE]: true, [EXECUTOR_CONNECTED_EVENT_TYPE]: true }
        )
    })

    it('correctly detects assignee connection on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { assignee: null },
            updatedItem: { assignee: 'xxx' },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [ASSIGNEE_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects assignee change on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { assignee: 'xxx' },
            updatedItem: { assignee: 'xxx1' },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [ASSIGNEE_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects executor connection on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { executor: null },
            updatedItem: { executor: 'xxx' },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [EXECUTOR_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects executor change on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { executor: 'xxx' },
            updatedItem: { executor: 'xxx1' },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [EXECUTOR_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects event on ticket create', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: id,
            },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: false } )
    })

    it('correctly detects event change on ticket update', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'update',
            existingItem: { status: { connect: { id: STATUS_IDS.OPEN } } },
            updatedItem: {
                status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                client: id,
            },
        }

        expect(detectTicketEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: true } )
    })
})