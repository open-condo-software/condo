import {
    detectEventTypes,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
} from './handlers'

describe('Ticket request event detection', () => {
    it.skip('correctly detects assignee connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { assignee: 'xxx' },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [ASSIGNEE_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects executor connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { executor: 'xxx' },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EXECUTOR_CONNECTED_EVENT_TYPE]: true })
    })

    it.skip('correctly detects assignee and executor connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { assignee: 'xxx', executor: 'yyy' },
        }

        expect(detectEventTypes(requestData)).toMatchObject(
            { [ASSIGNEE_CONNECTED_EVENT_TYPE]: true, [EXECUTOR_CONNECTED_EVENT_TYPE]: true }
        )
    })

    it.skip('correctly detects assignee connection on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { assignee: null },
            updatedItem: { assignee: 'xxx' },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [ASSIGNEE_CONNECTED_EVENT_TYPE]: true })
    })

    it.skip('correctly detects assignee change on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { assignee: 'xxx' },
            updatedItem: { assignee: 'xxx1' },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [ASSIGNEE_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects executor connection on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { executor: null },
            updatedItem: { executor: 'xxx' },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EXECUTOR_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects executor change on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { executor: 'xxx' },
            updatedItem: { executor: 'xxx1' },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EXECUTOR_CONNECTED_EVENT_TYPE]: true })
    })

})