import React, { useEffect, useState } from 'react'
import find from 'lodash/find'
import { useIntl } from '@core/next/intl'
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
     * Displays progress for all tasks in one panel
     * To make notifications to work with all context providers of our MyApp component,
     * context of notifications should be mounted inside of MyApp components tree.
     * Otherwise it will be mounted with Ant into its own context by default and following error will occur:
     * > Error: [React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.
     * @see https://ant.design/components/notification/#Why-I-can-not-access-context,-redux,-ConfigProvider-locale/prefixCls-in-notification
     */
    const [notificationApi, contextHolder] = notification.useNotification()
    const intl = useIntl()
    const TitleMsg = intl.formatMessage({ id: 'tasks.progressNotification.title' })
    const DescriptionMsg = intl.formatMessage({ id: 'tasks.progressNotification.description' })

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
        // TODO(antonal): remove this example notification, added for layout testing
        notificationApi.open({
            description: 'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.',
            duration: 0,
        })
        displayTasksProgress({
            notificationApi,
            title: TitleMsg,
            description: DescriptionMsg,
            tasks,
        })
        // TODO(antonal): remove this example notification, added for layout testing
        notificationApi.open({
            message: 'Nullam quis',
            description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam.',
            duration: 0,
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