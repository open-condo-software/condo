import get from 'lodash/get'
import { ITasksStorage } from '../index'
import { IGenerateHooksResult } from '../../../utils/codegeneration/generate.hooks'
import { TASK_POLL_INTERVAL } from '../../../constants/tasks'

/**
 * Used to store tasks known by Condo API
 * Uses clientSchema, available at compile time
 */
export class TasksCondoStorage implements ITasksStorage {
    clientSchema: IGenerateHooksResult<any, any, any, any>

    constructor ({ clientSchema }) {
        this.clientSchema = clientSchema
    }

    useTasks ({ status }, user) {
        const { objs } = this.clientSchema.useObjects({ where: { status, user: { id: get(user, 'id') } } })
        return { records: objs }
    }

    useTask (id) {
        const { obj, stopPolling } = this.clientSchema.useObject({ where: { id } }, {
            pollInterval: TASK_POLL_INTERVAL,
        })
        return { record: obj, stopPolling }
    }

    useCreateTask (initialValues, onComplete) {
        return this.clientSchema.useCreate(initialValues, onComplete)
    }

    useUpdateTask (initialValues, onComplete) {
        return this.clientSchema.useUpdate(initialValues, onComplete)
    }

    useDeleteTask (onComplete) {
        return this.clientSchema.useSoftDelete(onComplete)
    }
}