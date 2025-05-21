import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import isFunction from 'lodash/isFunction'

import { ITasksStorage, LocalTaskRecord } from '../index'

dayjs.extend(isToday)

const LOCAL_STORAGE_TASKS_KEY = 'tasks'

// TODO(antonal): implement polling a task record from browser's Local Storage
const StopPollingStub = () => {
    return
}

const isServerSide = typeof window === 'undefined'


type UseTasks<TTaskRecord extends LocalTaskRecord> = ITasksStorage<TTaskRecord>['useTasks']
type UseTask<TTaskRecord extends LocalTaskRecord> = ITasksStorage<TTaskRecord>['useTask']
type UseCreateTask<TTaskRecord extends LocalTaskRecord> = ITasksStorage<TTaskRecord>['useCreateTask']
type UseUpdateTask<TTaskRecord extends LocalTaskRecord> = ITasksStorage<TTaskRecord>['useUpdateTask']
type UseDeleteTask<TTaskRecord extends LocalTaskRecord> = ITasksStorage<TTaskRecord>['useDeleteTask']

/**
 * Used to store third-party task records, unknown for Condo API.
 * Third-party task records will come from mini-apps
 * On first page load all locally stored tasks can be fetched to display
 * them in progress panel
 * Uses browser `localstorage`
 * NOTE: not working with SSR because there is no `window` object
 * TODO(antonal): load tasks created by current user only
 */
export class TasksLocalStorage<TTaskRecord extends LocalTaskRecord = LocalTaskRecord> implements ITasksStorage<TTaskRecord> {

    useTasks (
        { status, today }: Parameters<UseTasks<TTaskRecord>>[0],
        user: Parameters<UseTasks<TTaskRecord>>[1]
    ): ReturnType<UseTasks<TTaskRecord>> {
        if (isServerSide) {
            // Gracefully return empty results in SSR mode, no need to throw errors or do something extra
            return { records: [] }
        }
        if (!user) {
            return { records: [] }
        }
        const tasks = this.getAllItemsFromStorage()
        if (!status) {
            return { records: tasks }
        }
        const records = tasks
            .filter(task => task.status === status && task.user && task.user?.id === user.id)
            .filter(task => today ? dayjs(task.createdAt).isToday() : true)
        return { records }
    }

    useTask (id: Parameters<UseTask<TTaskRecord>>[0]): ReturnType<UseTask<TTaskRecord>> {
        const existingRecords = this.getAllItemsFromStorage()
        const record = existingRecords.find(item => item.id === id)

        return { record, stopPolling: StopPollingStub }
    }

    /**
     * Since this is a third-party record Condo API don't knows about,
     * store it locally to fetch it on initial page load
     */
    useCreateTask (
        initialValues: Parameters<UseCreateTask<TTaskRecord>>[0],
        onComplete: Parameters<UseCreateTask<TTaskRecord>>[1]
    ): ReturnType<UseCreateTask<TTaskRecord>> {
        return (values) => {
            const existingRecords = this.getAllItemsFromStorage()
            const newRecord = { ...initialValues, ...values } as TTaskRecord
            if (existingRecords.find(record => record.id === newRecord.id)) {
                console.error({ msg: 'Task record with given id already presented in localStorage', data: { newRecord } })
                return
            }
            const updatedRecords = [...existingRecords, newRecord]
            this.store(updatedRecords)
            onComplete(newRecord)
            return Promise.resolve()
        }
    }

    useUpdateTask (
        initialValues: Parameters<UseUpdateTask<TTaskRecord>>[0],
        onComplete: Parameters<UseUpdateTask<TTaskRecord>>[1]
    ): ReturnType<UseUpdateTask<TTaskRecord>> {
        return (values, obj) => {
            const existingRecords = this.getAllItemsFromStorage()
            const id = initialValues.id || obj.id
            const recordToUpdate = existingRecords.find((record) => record.id === id)
            const recordIndexToUpdate = existingRecords.findIndex((record) => record.id === id)
            if (!recordToUpdate) {
                console.error({ msg: 'Could not find task to update by id', data: { id } })
                return
            }
            const updatedRecord = {
                ...recordToUpdate,
                ...initialValues,
                ...values,
            }
            const updatedRecords = [
                ...existingRecords.slice(0, recordIndexToUpdate),
                updatedRecord,
                ...existingRecords.slice(recordIndexToUpdate + 1),
            ]
            this.store(updatedRecords)
            onComplete(updatedRecord)
            return Promise.resolve()
        }
    }

    useDeleteTask (
        initialObj: Parameters<UseDeleteTask<TTaskRecord>>[0],
        onComplete: Parameters<UseDeleteTask<TTaskRecord>>[1]
    ): ReturnType<UseDeleteTask<TTaskRecord>> {
        return (obj) => {
            const existingRecords = this.getAllItemsFromStorage()
            const id = initialObj.id || obj.id
            const recordToRemove = existingRecords.find(record => record.id === id)

            if (!recordToRemove) {
                console.error({ msg: 'Could not find task to remove by id ', data: { id } })
                return
            }

            this.store(existingRecords.filter((record) => record.id !== id))

            if (isFunction(onComplete)) {
                onComplete(recordToRemove)
            }
            return Promise.resolve()
        }
    }

    private getAllItemsFromStorage (): Array<TTaskRecord> {
        // There is not `localStorage` on server-side
        if (!localStorage) {
            return []
        }
        const resultString = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY)
        if (!resultString) {
            return []
        }
        try {
            return JSON.parse(resultString)
        } catch (e) {
            console.error({ msg: 'Incorrect syntax of stored tasks in localStorage. Wiping them out!' })
            localStorage.removeItem(LOCAL_STORAGE_TASKS_KEY)
            return []
        }
    }

    private store (records: Array<TTaskRecord>) {
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(records))
    }
}

