import { notification, Progress, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import find from 'lodash/find'
import { WORKER_TASK_COMPLETED, WORKER_TASK_PROCESSING, TASK_STATUS_REFRESH_POLL_INTERVAL } from '@condo/domains/common/constants/worker'

/**
 * Basic set of fields, describing a task, obtained from condo API
 * Expected from all task records.
 */
type TaskRecord = {
    id: string
    status: WORKER_TASK_COMPLETED | WORKER_TASK_PROCESSING
    progress: number
}

// It's impossible to use IHookResult here because it is a Generic Type,
// requires to set specific type params, but we have an array of tasks,
// where each item has clientSchema utils from specific domain
type IClientSchema = any

/**
 * I18n keys for title and description for TaskProgress,
 */
export type TaskProgressTranslations = {
    title: string
    description: (task: TaskRecord) => string
}

/**
 * Used to fetch actual state, display information in UI
 */
interface Task {
    record: TaskRecord
    onComplete: OnCompleteFunc
    translations: TaskProgressTranslations
    clientSchema: IClientSchema
}

/**
 * Should be used to launch and track specific delayed task
 */
interface ITasksContext {
    addTask: (newTask: Task) => void
    tasks: Task[]
}

const TasksContext = React.createContext({})

export type OnCompleteFunc = (taskRecord: any) => void

interface ITaskProgressProps {
    task: TaskRecord
    clientSchema: IClientSchema
    onComplete: OnCompleteFunc
    translations: TaskProgressTranslations
}

const TaskProgress = ({ task: { id }, clientSchema, onComplete, translations }: ITaskProgressProps) => {
    const { obj: task } = clientSchema.useObject({
        where: { id },
    }, {
        pollInterval: TASK_STATUS_REFRESH_POLL_INTERVAL,
    })

    useEffect(() => {
        if (task.status === WORKER_TASK_COMPLETED) {
            onComplete(task)
        }
    }, [task.status, task.progress])

    return (
        <>
            <Typography.Paragraph>
                {translations.title}
            </Typography.Paragraph>
            <Typography.Paragraph>
                {translations.description(task)}
            </Typography.Paragraph>
            <Progress percent={33}/>
        </>
    )
}

/**
 * By design only one notification panel is supposed to be displayed to user.
 * In one panel it displays progress for all tasks
 * @param title
 * @param description
 * @param {Array<Task>} tasks to track and display
 */
const displayTasksProgress = ({ title, description, tasks }) => {
    notification.open({
        key: 'task-notification',
        message: (
            <Typography.Paragraph>
                {title}
            </Typography.Paragraph>
        ),
        duration: 0,
        description: (
            <>
                <Typography.Paragraph>{description}</Typography.Paragraph>
                {tasks.map(({ record, clientSchema, translations, onComplete }) => (
                    <TaskProgress
                        key={record.id}
                        task={record}
                        clientSchema={clientSchema}
                        translations={translations}
                        onComplete={onComplete}
                    />
                ))}
            </>
        ),
    })
}

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
                setTasks([...tasks, newTask])
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