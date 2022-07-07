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

    // Will be used by third-party tasks, that condo does't knows about
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
    title: (task: TaskRecord) => string
    description: (task: TaskRecord) => string
}

// Meaning of task progress is domain specific
// A task record can have different fields to store and calculate progress
// In some cases there is no technical way to determine exact percent completion of a task
export type CalculateProgressFunc = (taskRecord: any) => TaskRecordProgress

export type OnCompleteFunc = (taskRecord: any) => void

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

type UseCreateTaskFunction = (initialValues: any, onComplete: OnCompleteFunc) => (attrs: any) => void
type UseUpdateTaskFunction = (initialValues: any, onComplete: OnCompleteFunc) => (attrs: any, obj: any) => Promise<any>
type UseDeleteTaskFunction = (attrs: unknown, onComplete: OnCompleteFunc) => (attrs: unknown) => void


type TasksWhereCondition = {
    status: TASK_STATUS,
}

/**
 * Storage-agnostic task query and management operations
 */
export interface ITasksStorage {
    useTasks: (where: TasksWhereCondition) => { records: TaskRecord[] }
    useTask: (id: string) => { record: TaskRecord, stopPolling: StopPollingFunction }
    useCreateTask: UseCreateTaskFunction,
    useUpdateTask: UseUpdateTaskFunction,
    useDeleteTask: UseDeleteTaskFunction,
}

// Depending on implementation, some tasks should be removed only from panel but kept in storage (for example, tasks known to condo),
// some needs to be removed from panel and storage (like tasks, unknown to condo and kept in localStorage)
export enum TASK_REMOVE_STRATEGY {
    PANEL = 'panel',
    STORAGE = 'storage',
}

/**
 * Data loading utils and abstract logic for a trackable task
 * In case of loading task records on page load helps to use appropriate implementation for a loaded record
 */
export interface ITask {
    storage: ITasksStorage
    removeStrategy: Array<TASK_REMOVE_STRATEGY>,
    translations: TaskProgressTranslations
    calculateProgress: CalculateProgressFunc
    onComplete: OnCompleteFunc,
}

/**
 * Task record from GraphQL API along with corresponding interface
 * Used in all UI components for fetching its actual state and display it on notification-like panel
 */
export interface ITaskTrackableItem extends ITask {
    record: TaskRecord
}

/**
 * Should be used to launch and track specific delayed task
 */
export interface ITasksContext {
    addTask: (newTask: ITaskTrackableItem) => void
    updateTask: (record: TaskRecord) => void
    deleteTask?: (record: TaskRecord) => void
    tasks: ITaskTrackableItem[]
}

export const TasksContext = React.createContext({})



// TODO(antonal): think about tracking getting the result of task by user
//  There is a case when user started export task, closed browser tab, task was completed, user opens a page again
//  and task will not be displayed because it is completed.
//  In this case we need to initially load not only tasks with `processing` status, but also tasks with
//  `completed` status which result is not yet obtained by user.