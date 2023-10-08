import { notification } from 'antd'
import filter from 'lodash/filter'
import findIndex from 'lodash/findIndex'
import get from 'lodash/get'
import identity from 'lodash/identity'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import React, { useEffect, useState, useReducer, useRef } from 'react'

import { useAuth } from '@open-condo/next/auth'

import { closeTasksProgress, displayTasksProgress } from './TaskProgress'

import { ITask, ITasksContext, ITaskTrackableItem, TaskRecord, TasksContext } from './index'


// Map of task schema name to its UI interface implementation
type TaskUIInterfacesMap = Record<string, ITask>

type ITasksContextProviderProps = {
    preloadedTaskRecords: TaskRecord[]
    uiInterfaces: TaskUIInterfacesMap
    children: React.ReactNode
}

/**
 * For each task record determines appropriate UI implementation and composes trackable task item
 */
const buildTrackableTasksFrom = (records: TaskRecord[], uiInterfaces: TaskUIInterfacesMap): ITaskTrackableItem[] => {
    const trackableTasks = records.map(record => {
        const typeName = get(record, '__typename')
        if (!typeName) {
            console.error('Error: Result of GraphQL query for task should contain "__typename" property', record)
            return null
        }
        const uiInterface = uiInterfaces[typeName]
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
const TasksContextProvider: React.FC<ITasksContextProviderProps> = ({ preloadedTaskRecords = [], uiInterfaces, children }) => {
    const { user } = useAuth()
    // NOTE: Initial state of `tasks` cannot be initialized with `preloadedTaskRecords` prop, because a hook in parent component that loads tasks
    // will rerender this component as data comes, so, the state will not be reinitialized.
    const [tasks, setTasks] = useState<ITaskTrackableItem[]>([])
    // Timestamp of latest update in tasks without changing length of trackable tasks array
    // Used to trigger `useEffects` when tasks are updated or deleted. Relying on length of tasks is not enough in effects
    const [lastUpdated, forceUpdate] = useReducer(x => x + 1, 0)

    // After first render we can await tasks from network requests
    // As they will come, we should add them to state
    // Count of tasks in `deps` of this effect is enough, because we need to handle upcoming tasks only
    useEffect(() => {
        const preloadedTasks = buildTrackableTasksFrom(preloadedTaskRecords, uiInterfaces)
        setTasks(prevTasks => (
            uniqBy([...prevTasks, ...preloadedTasks], 'record.id')
        ))
    }, [preloadedTaskRecords.length])

    // Clean up tasks to hide progress panel when user is logged out
    useEffect(() => {
        if (!user) {
            setTasks([])
            forceUpdate()
        }
    }, [user])

    // Keep reference to the variable, because functions in `tasksContextInterface` will lose it after assignment to `TasksContext.Provider`
    const tasksRef = useRef(tasks)
    useEffect(() => {
        tasksRef.current = tasks
    }, [tasks])

    useEffect(() => {
        if (!isEmpty(tasks)) {
            displayTasksProgress({
                notificationApi,
                tasks,
            })
        } else (
            closeTasksProgress()
        )
    }, [tasks.length, lastUpdated])

    /**
     * To make notifications work with all context providers of our MyApp component,
     * context of notifications should be mounted inside it.
     * Otherwise it will be mounted by Ant into its own context and following error will occur:
     * > Error: [React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.
     * @see https://ant.design/components/notification/#Why-I-can-not-access-context,-redux,-ConfigProvider-locale/prefixCls-in-notification
     */
    const [notificationApi, contextHolder] = notification.useNotification()

    function findExistingTaskById (id: string): [ITaskTrackableItem | null, number] {
        const index = findIndex(tasksRef.current, { record: { id } })
        if (index === -1) {
            return [null, -1]
        }
        return [tasksRef.current[index], index]
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
                forceUpdate()
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
            forceUpdate()
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