import React, { useEffect, useState } from 'react'
import find from 'lodash/find'
import { useIntl } from '@core/next/intl'
import { Task } from './index'
import { displayTasksProgress } from './TaskProgress'

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
    const intl = useIntl()
    const [tasks, setTasks] = useState<Task[]>([])

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
        if (tasks.length === 0) return
        const TitleMsg = intl.formatMessage({ id: 'tasks.progressNotification.title' })
        const DescriptionMsg = intl.formatMessage({ id: 'tasks.progressNotification.description' })
        displayTasksProgress({
            title: TitleMsg,
            description: DescriptionMsg,
            tasks,
        })
    }, [tasks])

    return (
        <TasksContext.Provider value={tasksContextInterface}>
            {children}
        </TasksContext.Provider>
    )
}

export {
    TasksContextProvider,
    TasksContext,
}