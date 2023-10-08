import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'

import { ITasksStorage, OnCompleteFunc } from '../index'

dayjs.extend(isToday)

const LOCAL_STORAGE_TASKS_KEY = 'tasks'

// TODO(antonal): implement polling a task record from browser's Local Storage
const StopPollingStub = () => {
    return
}

const isServerSide = typeof window === 'undefined'

/**
 * Used to store third-party task records, unknown for Condo API.
 * Third-party task records will come from mini-apps
 * On first page load all locally stored tasks can be fetched to display
 * them in progress panel
 * Uses browser `localstorage`
 * NOTE: not working with SSR because there is no `window` object
 * TODO(antonal): load tasks created by current user only
 */
export class TasksLocalStorage implements ITasksStorage {

    useTasks ({ status, today }, user) {
        if (isServerSide) {
            // Gracefully return empty results in SSR mode, no need to throw errors or do something extra
            return { records: [] }
        }
        if (!user) {
            return { records: [] }
        }
        const tasks = this.getAllItemsFromStorage()
        if (!status) {
            return tasks
        }
        const records = tasks
            .filter(task => task.status === status && task.user && get(task, 'user.id') === user.id)
            .filter(task => today ? dayjs(task.createdAt).isToday() : true)
        return { records }
    }

    useTask (id) {
        const existingRecords = this.getAllItemsFromStorage()
        const record = existingRecords.find(item => item.id === id)

        return { record, stopPolling: StopPollingStub }
    }

    /**
     * Since this is a third-party record Condo API don't knows about,
     * store it locally to fetch it on initial page load
     */
    useCreateTask (attrs: any, onComplete: OnCompleteFunc) {
        return (extraAttrs: any) => {
            const existingRecords = this.getAllItemsFromStorage()
            const newRecord = { ...attrs, ...extraAttrs }
            if (find(existingRecords, { id: newRecord.id })) {
                console.error('Task record with given id already presented in localStorage', newRecord)
                return
            }
            const updatedRecords = [ ...existingRecords, newRecord ]
            this.store(updatedRecords)
            onComplete(newRecord)
        }
    }

    useUpdateTask (attrs: any, onComplete: OnCompleteFunc) {
        return (extraAttrs: any, obj: any) => {
            const existingRecords = this.getAllItemsFromStorage()
            const id = attrs.id || obj.id
            const recordToUpdate = find(existingRecords, { id })
            const recordIndexToUpdate = findIndex(existingRecords, { id })
            if (!recordToUpdate) {
                console.error('Could not find task to update by id', id)
                return
            }
            const updatedRecord = {
                ...recordToUpdate,
                ...attrs,
                ...extraAttrs,
            }
            const updatedRecords = [
                ...existingRecords.slice(0, recordIndexToUpdate),
                updatedRecord,
                ...existingRecords.slice(recordIndexToUpdate + 1),
            ]
            this.store(updatedRecords)
            onComplete(updatedRecord)
            return Promise.resolve(updatedRecord)
        }
    }

    useDeleteTask (attrs: any, onComplete: OnCompleteFunc) {
        return (extraAttrs: any) => {
            const existingRecords = this.getAllItemsFromStorage()
            const id = attrs.id || extraAttrs.id
            const recordsToRemove = find(existingRecords, { id })

            if (!recordsToRemove) {
                console.error('Could not find task to remove by id ', id)
                return
            }

            this.store(existingRecords.filter((record) => record.id !== id))

            if (isFunction(onComplete)) {
                onComplete(id)
            }
        }
    }

    private getAllItemsFromStorage () {
        // There is not `localStorage` on server-side
        if (!localStorage) {
            return []
        }
        const resultString = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY)
        if (!resultString) {
            return []
        }
        try {
            const items = JSON.parse(resultString)
            return items
        } catch (e) {
            console.error('Incorrect syntax of stored tasks in localStorage. Wiping them out!')
            localStorage.removeItem(LOCAL_STORAGE_TASKS_KEY)
            return []
        }
    }

    private store (records) {
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(records))
    }
}

