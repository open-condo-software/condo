import React, { useEffect, useState } from 'react'
import { useApolloClient } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { notification, Progress, Typography } from 'antd'
import { WORKER_TASK_COMPLETED, TASK_STATUS_REFRESH_POLL_INTERVAL } from '@condo/domains/common/constants/worker'

const TasksContext = React.createContext({})


type TaskRecord = {
    id: string
    progress: number
    __typename: string
}

export type OnCompleteFunc = (taskRecord: any) => void

type Task = {
    record: TaskRecord
    onComplete: OnCompleteFunc
    clientSchema: any
}

interface ITasksContext {
    addTask: (newTask: Task) => void
}

const TaskProgress = ({ id, title, description, clientSchema, onComplete }) => {
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
                {title}
            </Typography.Paragraph>
            <Typography.Paragraph>
                {description.replace('{n}', task.exportedRecordsCount)}
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
 * @param tasksProgressList component that displays progress of all launched tasks
 */
const displayTasksProgress = ({ title, description, tasks }) => {
    notification.open({
        key: 'task-notification',
        message: title,
        description: () => (
            <>
                <Typography.Paragraph>{description}</Typography.Paragraph>
                {tasks.map(({ record, clientSchema, onComplete }) => (
                    <TaskProgress
                        key={record.id}
                        id={record.id}
                        title={'Excel-файл'}
                        description={'Экспортировано записей {n}'}
                        clientSchema={clientSchema}
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
 * @param {String} query GraphQL query string
 * @param {SubscriptionRecords} map iterator over obtained records
 */
const TasksContextProvider = ({ children }) => {
    const intl = useIntl()
    const [tasks, setTasks] = useState<Task[]>([])

    const tasksContextInterface: ITasksContext = {
        addTask: (newTask) => {
            setTasks([...tasks, newTask])
        },
    }

    useEffect(() => {
        if (tasks.length === 0) return
        const lastTask = tasks[tasks.length - 1]
        const lastTaskRecord = lastTask.record
        const TitleMsg = intl.formatMessage({ id: `task.${lastTaskRecord.__typename}.title` })
        const DescriptionMsg = intl.formatMessage({ id: `task.${lastTaskRecord.__typename}.description` })
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