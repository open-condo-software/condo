import React, { useEffect, useState } from 'react'
import { notification } from 'antd'
import filter from 'lodash/filter'
import identity from 'lodash/identity'
import findIndex from 'lodash/findIndex'
import { ITask, ITasksContext, ITaskTrackableItem, TaskRecord, TasksContext, TaskRecordProgress } from './index'
import { displayTasksProgress } from './TaskProgress'

// Map of task schema name to its UI interface implementation
type TaskUIInterfacesMap = Record<string, ITask>

type ITasksContextProviderProps = {
    initialTaskRecords: TaskRecord[]
    uiInterfaces: TaskUIInterfacesMap
    children: React.ReactNode
}

/**
 * For each task record determines appropriate UI implementation and composes trackable task item
 */
const buildTrackableTasksFrom = (records: TaskRecord[], uiInterfaces: TaskUIInterfacesMap): ITaskTrackableItem[] => {
    const trackableTasks = records.map(record => {
        if (!record.__typename) {
            console.error('Error: Result of GraphQL query for task should contain "__typename" property', record)
            return null
        }
        const uiInterface = uiInterfaces[record.__typename]
        if (!uiInterface) {
            // Exception is not thrown here to not disturb user in favour of monitoring errors ourselves
            console.error('Error: No UI implementation for task record', record)
            return null
        }
        return {
            record,
            ...uiInterface,
        }
    })
    return filter(trackableTasks, identity)
}

/**
 * Abstract implementation of displaying new worker tasks and tracking its progress
 * TODO: Progress should be tracked after closing progress panel
 */
const TasksContextProvider: React.FC<ITasksContextProviderProps> = ({ initialTaskRecords = [], uiInterfaces, children }) => {
    // Initial state cannot be initialized with `initialTasks` prop, because a hook in parent component that loads tasks
    // in 'processing' status will rerender this component as data comes, so, the state
    // will not be reinitialized
    const initialTasks = buildTrackableTasksFrom(initialTaskRecords, uiInterfaces)
    const [tasks, setTasks] = useState<ITaskTrackableItem[]>(initialTasks)
    const [latestUpdatedTask, setLatestUpdatedTask] = useState<TaskRecordProgress>()

    /**
     * To make notifications work with all context providers of our MyApp component,
     * context of notifications should be mounted inside it.
     * Otherwise it will be mounted by Ant into its own context and following error will occur:
     * > Error: [React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.
     * @see https://ant.design/components/notification/#Why-I-can-not-access-context,-redux,-ConfigProvider-locale/prefixCls-in-notification
     */
    const [notificationApi, contextHolder] = notification.useNotification()

    useEffect(() => {
        if (tasks.length > 0) {
            displayTasksProgress({
                notificationApi,
                tasks,
            })
        } else {
            notification.destroy()
        }
    }, [tasks.length, initialTasks.length, latestUpdatedTask])

    function findExistingTaskById (id: string): [ITaskTrackableItem | null, number] {
        const index = findIndex(tasks, { record: { id } })
        if (index === -1) {
            return [null, -1]
        }
        return [tasks[index], index]
    }

    const tasksContextInterface: ITasksContext = {
        addTask: (newTask) => {
            // TODO(antonal): validate newTask object shape
            const [existingTask] = findExistingTaskById(newTask.record.id)
            if (existingTask) {
                console.error('Task record has already been added for tracking', newTask.record)
            } else {
                setTasks(prevTasks => ([...prevTasks, newTask]))
            }
        },
        updateTask: (record) => {
            const [existingTask, index] = findExistingTaskById(record.id)
            if (!existingTask) {
                console.error('Task record not found to update', record)
                return
            }
            setTasks(prevTasks => {
                const updatedTask = {
                    ...prevTasks[index],
                    record,
                }
                setLatestUpdatedTask(updatedTask.record.progress)

                return [
                    ...prevTasks.slice(0, index),
                    updatedTask,
                    ...prevTasks.slice(index + 1),
                ]
            })
        },
        deleteTask: (record) => {
            const [existingTask] = findExistingTaskById(record.id)
            if (!existingTask) {
                console.error('Task record not found', record)
                return
            }
            setTasks(prevState => prevState.filter((task) => task.record.id !== record.id))
        },
        tasks,
    }

    return (
        <TasksContext.Provider value={tasksContextInterface}>
            {contextHolder}
            {children}
        </TasksContext.Provider>
    )
}

export {
    TasksContextProvider,
    TasksContext,
}
