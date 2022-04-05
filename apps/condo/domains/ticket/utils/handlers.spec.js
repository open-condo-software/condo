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
const faker = require('faker')

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
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: id,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: false } )
    })

    it('correctly detects event connection on ticket create', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                client: id,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: true } )
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

        expect(detectEventTypes(requestData)).toMatchObject({ [STATUS_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects warranty indicator connection on ticket create', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: id,
                isWarranty: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [WARRANTY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning off warranty indicator on ticket update', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'update',
            existingItem: { isWarranty: true },
            updatedItem: {
                client: id,
                isWarranty: false,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [WARRANTY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning on warranty indicator on ticket update', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'update',
            existingItem: { isWarranty: false },
            updatedItem: {
                client: id,
                isWarranty: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [WARRANTY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects paid indicator connection on ticket create', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: id,
                isPaid: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [PAID_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning off paid indicator on ticket update', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'update',
            existingItem: { isPaid: true },
            updatedItem: {
                client: id,
                isPaid: false,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [PAID_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning on paid indicator on ticket update', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'update',
            existingItem: { isPaid: false },
            updatedItem: {
                client: id,
                isPaid: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [PAID_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects emergency indicator connection on ticket create', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'create',
            existingItem: null,
            updatedItem: {
                client: id,
                isEmergency: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EMERGENCY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning off emergency indicator on ticket update', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'update',
            existingItem: { isEmergency: true },
            updatedItem: {
                client: id,
                isEmergency: false,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EMERGENCY_CHANGED_EVENT_TYPE]: true } )
    })

    it('correctly detects turning on emergency indicator on ticket update', () => {
        const id = faker.datatype.uuid()
        const requestData = {
            operation: 'update',
            existingItem: { isEmergency: false },
            updatedItem: {
                client: id,
                isEmergency: true,
            },
        }

        expect(detectEventTypes(requestData)).toMatchObject({ [EMERGENCY_CHANGED_EVENT_TYPE]: true } )
    })

})