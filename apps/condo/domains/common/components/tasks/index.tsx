import React from 'react'

// Should be used in case when there is no technical way to tell exactly the progress of the task
export const TASK_PROGRESS_UNKNOWN = 'TASK_PROGRESS_UNKNOWN'

// Value from 0 to 100
export type TaskDisplayProgressInPercent = number

export type TaskRecordProgress = TaskDisplayProgressInPercent | typeof TASK_PROGRESS_UNKNOWN

export enum TASK_STATUS {
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    ERROR = 'error',
}

/**
 * Basic set of fields, describing a task, obtained from GraphQL API
 * Expected from all task records.
 */
export type TaskRecord = {
    id: string

    // Will be used by third-party tasks, that condo doesn't know about
    title?: string
    description?: string
    progress: TaskRecordProgress

    status: TASK_STATUS
    // Used to find appropriate `ITask` interface implementation for this record
    __typename: string
    // Used to store additional id if it is necessary.
    // For example: local id at miniapp database whom would be used to update progress
    taskId?: string
    sender?: string
}


/**
 * I18n keys for title and description for TaskProgress,
 */
export type TaskProgressTranslations = {
    title: string
    description: (task: TaskRecord) => string
}

// Meaning of task progress is domain specific
// A task record can have different fields to store and calculate progress
// In some cases there is no technical way to determine exact percent completion of a task
export type CalculateProgressFunc = (taskRecord: unknown) => TaskRecordProgress

export type OnCompleteFunc = (taskRecord: unknown) => void

export enum TASK_STORAGE {
    CONDO_API = 'CONDO_API',
    /**
     * Gives possibility for condo to track third-party tasks, not stored in condo storage and not available
     * via condo GraphQL API.
     * These tasks will be added by mini-apps, mounted in iframe into condo pages
     * A route of a task is following:
     * iframe --post-message--> message dispather --ITasksContext.addTask-->
     * Message dispatcher will be developed later
     */
    LOCAL_STORAGE = 'LOCAL_STORAGE',
}

type StopPollingFunction = () => void

type UseCreateTaskFunction = (attrs: unknown, onComplete: OnCompleteFunc) => (attrs: unknown) => void
type UseUpdateTaskFunction = (attrs: unknown, onComplete: OnCompleteFunc) => (attrs: unknown) => void
type UseDeleteTaskFunction = (attrs: unknown, onComplete: OnCompleteFunc) => (attrs: unknown) => void

type TasksWhereCondition = {
    status: TASK_STATUS,
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