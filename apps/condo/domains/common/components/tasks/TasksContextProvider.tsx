import React, { useEffect, useState } from 'react'
import find from 'lodash/find'
import { useIntl } from '@core/next/intl'
import { Task } from './index'
import { displayTasksProgress, TasksProgress } from './TaskProgress'

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
    const [tasksProgressVisible, setTasksProgressVisible] = useState(false)

    const tasksContextInterface: ITasksContext = {
        addTask: (newTask) => {
            if (find(tasks, { id: newTask.record.id })) {
                console.error('Task record already added for tracking', newTask.record)
            } else {
                setTasks(prevTasks => [...prevTasks, newTask])
            }
            setTasksProgressVisible(true)
        },
        tasks,
    }

    return (
        <TasksContext.Provider value={tasksContextInterface}>
            {tasksProgressVisible && (
                <TasksProgress tasks={tasks}/>
            )}
            {children}
        </TasksContext.Provider>
    )
}

export {
    TasksContextProvider,
    TasksContext,
}