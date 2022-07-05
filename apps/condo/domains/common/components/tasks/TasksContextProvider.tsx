import React, { useEffect, useState } from 'react'
import find from 'lodash/find'
import { ITask, ITaskTrackableItem, TaskRecord } from './index'
import { displayTasksProgress } from './TaskProgress'
import { notification } from 'antd'
import { filter, identity } from 'lodash'

/**
 * Should be used to launch and track specific delayed task
 */
interface ITasksContext {
    addTask: (newTask: ITaskTrackableItem) => void
    tasks: ITaskTrackableItem[]
}

const TasksContext = React.createContext({})

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
        }
        const uiInterface = uiInterfaces[record.__typename]
        if (!uiInterface) {
            // Exception is not thrown here to not disturb user in favour of monitoring errors ourselves
            console.error('Error: No UI implementation for task record', record)
            return null
        }
        const trackableTask = {
            record,
            ...uiInterface,
        }
        console.debug('Built trackable task item', trackableTask)
        return trackableTask
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
    const [tasks, setTasks] = useState<ITaskTrackableItem[]>([])
    const initialTasks = buildTrackableTasksFrom(initialTaskRecords, uiInterfaces)

    const allTasks = [
        ...tasks,
        ...initialTasks,
    ]

    useEffect(() => {
        if (allTasks.length > 0) {
            displayTasksProgress({
                notificationApi,
                tasks: allTasks,
            })
        }
    }, [tasks.length, initialTasks.length])

    /**
     * To make notifications work with all context providers of our MyApp component,
     * context of notifications should be mounted inside it.
     * Otherwise it will be mounted by Ant into its own context and following error will occur:
     * > Error: [React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.
     * @see https://ant.design/components/notification/#Why-I-can-not-access-context,-redux,-ConfigProvider-locale/prefixCls-in-notification
     */
    const [notificationApi, contextHolder] = notification.useNotification()

    const tasksContextInterface: ITasksContext = {
        addTask: (newTask) => {
            if (find(tasks, { id: newTask.record.id })) {
                console.error('Task record has already been added for tracking', newTask.record)
            } else {
                setTasks(prevTasks => [...prevTasks, newTask])
            }
        },
        tasks: allTasks,
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