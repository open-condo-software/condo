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
    __typename: string
    // Used to find appropriate `ITask` interface implementation for this record
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

/**
 * Data loading utils and abstract logic for a trackable task
 * In case of loading task records on page load helps to use appropriate implementation for a loaded record
 */
export interface ITask {
    storage: ITasksStorage
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
    addTask?: (newTask: ITaskTrackableItem) => void
    updateTask?: (record: TaskRecord) => void
    deleteTask?: (record: TaskRecord) => void
    tasks?: ITaskTrackableItem[]
}

export const TasksContext = React.createContext<ITasksContext>({})

// TODO(antonal): think about tracking getting the result of task by user
//  There is a case when user started export task, closed browser tab, task was completed, user opens a page again
//  and task will not be displayed because it is completed.
//  In this case we need to initially load not only tasks with `processing` status, but also tasks with
//  `completed` status which result is not yet obtained by user.
