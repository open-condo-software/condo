import {
    detectEventTypes,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
    WARRANTY_CHANGED_EVENT_TYPE,
    PAID_CHANGED_EVENT_TYPE,
    EMERGENCY_CHANGED_EVENT_TYPE,
} from './handlers'
const { STATUS_IDS } = require('../constants/statusTransitions')

describe('Ticket request event detection', () => {
    it('correctly detects assignee connection on ticket create', () => {
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

    it('correctly detects assignee and executor connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { assignee: 'xxx', executor: 'yyy' },
        }

        expect(detectEventTypes(requestData)).toMatchObject(
            { [ASSIGNEE_CONNECTED_EVENT_TYPE]: true, [EXECUTOR_CONNECTED_EVENT_TYPE]: true }
        )
    })

    it('correctly detects same person as assignee and executor connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: { assignee: 'xxx', executor: 'xxx' },
        }

        expect(detectEventTypes(requestData)).toMatchObject(
            { [ASSIGNEE_CONNECTED_EVENT_TYPE]: false, [EXECUTOR_CONNECTED_EVENT_TYPE]: true }
        )
    })

    it('correctly detects same person as assignee and executor connection on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { assignee: 'yyy', executor: 'zzz' },
            updatedItem: { assignee: 'xxx', executor: 'xxx' },
        }

        expect(detectEventTypes(requestData)).toMatchObject(
            { [ASSIGNEE_CONNECTED_EVENT_TYPE]: false, [EXECUTOR_CONNECTED_EVENT_TYPE]: true }
        )
    })

    it('correctly detects assignee connection on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { assignee: null },
            updatedItem: { assignee: 'xxx' },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [ASSIGNEE_CONNECTED_EVENT_TYPE]: true })
    })

    it('correctly detects assignee change on ticket update', () => {
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

    it('correctly detects event on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: false } )
    })

    it('correctly detects event connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects event change on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { status: { connect: { id: STATUS_IDS.OPEN } } },
            updatedItem: {
                status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects warranty indicator connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isWarranty: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [WARRANTY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning off warranty indicator on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { isWarranty: true },
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isWarranty: false,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [WARRANTY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning on warranty indicator on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { isWarranty: false },
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isWarranty: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [WARRANTY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects paid indicator connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isPaid: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [PAID_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning off paid indicator on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { isPaid: true },
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isPaid: false,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [PAID_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning on paid indicator on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { isPaid: false },
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isPaid: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [PAID_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects emergency indicator connection on ticket create', () => {
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isEmergency: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EMERGENCY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning off emergency indicator on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { isEmergency: true },
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isEmergency: false,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EMERGENCY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning on emergency indicator on ticket update', () => {
        const requestData = {
            operation: 'update',
            existingItem: { isEmergency: false },
            updatedItem: {
                client: '289d6f08-14fe-48ea-8c69-99890839bd6d',
                isEmergency: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EMERGENCY_CHANGED_EVENT_TYPE]: true } )
    })

})