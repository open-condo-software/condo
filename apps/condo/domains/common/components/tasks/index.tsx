import React from 'react'

// Should be used in case when there is no technical way to tell exactly the progress of the task
export const TASK_PROGRESS_UNKNOWN = 'TASK_PROGRESS_UNKNOWN'

// Value from 0 to 100
export type TaskDisplayProgressInPercent = number

export type TaskRecordProgress = TaskDisplayProgressInPercent | typeof TASK_PROGRESS_UNKNOWN

/**
 * Basic set of fields, describing a task, obtained from GraphQL API
 * Expected from all task records.
 */
export type BaseTaskRecord = {
    id: string

    // Will be used by third-party tasks, that condo does't knows about
    title?: string
    description?: string
    progress?: TaskRecordProgress

    status?: 'processing' | 'completed' | 'error' | 'cancelled'

    // User, that has launched this task.
    // This field will be used for filtering tasks in frontend to display to current user only its own tasks.
    // Filtering on backend is not enough because for User with `isAdmin` flag we need to:
    // - return all tasks in Keystone admin section
    // - return only his own tasks in "public" section
    user?: {
        id: string
    }

    // Used to find appropriate `ITask` interface implementation for this record
    __typename: string

    // Used to store additional id if it is necessary.
    // For example: local id at miniapp database whom would be used to update progress
    taskId?: string
    sender?: string

    createdAt?: string
}
export type LocalTaskRecord = BaseTaskRecord & Required<Pick<BaseTaskRecord, 'user' | 'progress' | 'status' | 'createdAt'>>
export type CondoTaskRecord = Pick<BaseTaskRecord, 'progress' | 'sender' | 'status' | '__typename' | 'id'>

/**
 * I18n keys for title and description for TaskProgress,
 */
export type TaskProgressTranslations<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = {
    title: (task: TTaskRecord) => string
    description: (task: TTaskRecord) => string | React.ReactNode
    link?: (task: TTaskRecord) => { label: string, url: string }
}

// Meaning of task progress is domain specific
// A task record can have different fields to store and calculate progress
// In some cases there is no technical way to determine exact percent completion of a task
export type CalculateProgressFunc<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = (taskRecord: TTaskRecord) => TaskRecordProgress

export type OnCompleteFunc<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = (taskRecord: TTaskRecord) => void
export type OnCancelFunc<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = (taskRecord: TTaskRecord) => void
export type OnErrorFunc<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = (taskRecord: TTaskRecord) => void

type StopPollingFunction = () => void

type UseCreateTaskFunction<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = (initialValues: Record<string, any>, onComplete: OnCompleteFunc<TTaskRecord>) => (attrs: Record<string, any>) => Promise<void>
type UseUpdateTaskFunction<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = (initialValues: Record<string, any>, onComplete: OnCompleteFunc<TTaskRecord>) => (attrs: Record<string, any>, obj: Partial<Pick<TTaskRecord, 'id'>>) => Promise<void>
type UseDeleteTaskFunction<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = (obj: Partial<Pick<TTaskRecord, 'id'>>, onComplete: OnCompleteFunc<TTaskRecord>) => (obj: Partial<Pick<TTaskRecord, 'id'>>) => Promise<void>


type TasksWhereCondition<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> = {
    status: TTaskRecord['status']
    // Helps to avoid displaying tasks, not completed for some reason, created on previous days
    today?: boolean
}

/**
 * Storage-agnostic task query and management operations
 */
export interface ITasksStorage<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> {
    useTasks: (where: TasksWhereCondition<TTaskRecord>, user: { id: string }) => { records: Array<TTaskRecord>, loading?: boolean }
    useTask: (id: string) => { record: TTaskRecord, stopPolling: StopPollingFunction }
    useCreateTask: UseCreateTaskFunction<TTaskRecord>
    useUpdateTask: UseUpdateTaskFunction<TTaskRecord>
    useDeleteTask: UseDeleteTaskFunction<TTaskRecord>
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
export interface ITask<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> {
    storage: ITasksStorage<TTaskRecord>
    removeStrategy: Array<TASK_REMOVE_STRATEGY>
    translations: TaskProgressTranslations<TTaskRecord>
    calculateProgress: CalculateProgressFunc<TTaskRecord>
    onComplete: OnCompleteFunc<TTaskRecord>
    onCancel: OnCancelFunc<TTaskRecord>
    onError?: OnErrorFunc<TTaskRecord>
}

/**
 * Task record from GraphQL API along with corresponding interface
 * Used in all UI components for fetching its actual state and display it on notification-like panel
 */
export interface ITaskTrackableItem <TTaskRecord extends BaseTaskRecord = BaseTaskRecord> extends ITask<TTaskRecord> {
    record: TTaskRecord
}

/**
 * Should be used to launch and track specific delayed task
 */
export interface ITasksContext<TTaskRecord extends BaseTaskRecord = BaseTaskRecord> {
    addTask: (newTask: ITaskTrackableItem<TTaskRecord>) => void
    updateTask: (record: TTaskRecord) => void
    deleteTask?: (record: TTaskRecord) => void
    deleteAllTasks?: () => void
    tasks: Array<ITaskTrackableItem<TTaskRecord>>
    isInitialLoading?: boolean
}


// TODO(antonal): think about tracking getting the result of task by user
//  There is a case when user started export task, closed browser tab, task was completed, user opens a page again
//  and task will not be displayed because it is completed.
//  In this case we need to initially load not only tasks with `processing` status, but also tasks with
//  `completed` status which result is not yet obtained by user.
