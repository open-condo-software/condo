import { WORKER_TASK_COMPLETED, WORKER_TASK_PROCESSING } from '../../constants/worker'
import { IHookResult } from '../../utils/codegeneration/generate.hooks'

/**
 * I18n keys for title and description for TaskProgress,
 */
export type TaskProgressTranslations = {
    title: string
    description: (task: TaskRecord) => string
}

/**
 * Basic set of fields, describing a task, obtained from condo API
 * Expected from all task records.
 */
export type TaskRecord = {
    id: string
    status: typeof WORKER_TASK_COMPLETED | typeof WORKER_TASK_PROCESSING
    progress: number
}

export type OnCompleteFunc = (taskRecord: any) => void

// We have to deal with different client schemas for tasks tracking, therefore we don't know specifics at compile time
export type IClientSchema = IHookResult<any, any, any>

/**
 * Used to fetch actual state, display information in UI
 */
export interface Task {
    record: TaskRecord
    onComplete: OnCompleteFunc
    translations: TaskProgressTranslations
    clientSchema: IClientSchema
}