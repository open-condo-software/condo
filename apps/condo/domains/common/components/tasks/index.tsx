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

// Should be used in case when there is no technical way to tell exactly the progress of the task
export const TASK_PROGRESS_UNKNOWN = 'TASK_PROGRESS_UNKNOWN'

// Value from 0 to 100
export type TaskDisplayProgressInPercent = number

export type TaskDisplayProgressValue = TaskDisplayProgressInPercent | typeof TASK_PROGRESS_UNKNOWN

// Meaning of task progress is domain specific
// A task record can have different fields to store and calculate progress
// In some cases there is no technical way to determine exact percent completion of a task
export type CalculateProgressFunc = (taskRecord: any) => TaskDisplayProgressValue

export type OnCompleteFunc = (taskRecord: any) => void

// We have to deal with different client schemas for tasks tracking, therefore we don't know specifics at compile time
export type IClientSchema = IHookResult<any, any, any>

/**
 * Used to fetch actual state, display information in UI
 */
export type Task = {
    record: TaskRecord
    calculateProgress: CalculateProgressFunc
    onComplete: OnCompleteFunc
    translations: TaskProgressTranslations
    clientSchema: IClientSchema
}