import React, { useEffect, useState } from 'react'
import find from 'lodash/find'
import { Task } from './index'
import { displayTasksProgress } from './TaskProgress'
import { notification } from 'antd'

/**
 * Should be used to launch and track specific delayed task
 */
interface ITasksContext {
    addTask: (newTask: Task) => void
    tasks: Task[]
}

const TasksContext = React.createContext({})

/**
 * Abstract implementation of displaying new worker tasks and tracking its progress
 * TODO: Progress should be tracked after closing progress panel
 */
const TasksContextProvider = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([])
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
                console.error('Task record already added for tracking', newTask.record)
            } else {
                setTasks(prevTasks => [...prevTasks, newTask])
            }
        },
        tasks,
    }

    useEffect(() => {
        displayTasksProgress({
            notificationApi,
            tasks,
        })
    }, [tasks])

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