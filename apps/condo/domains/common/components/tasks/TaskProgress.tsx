import React, { useEffect } from 'react'
import { notification, Progress, Typography } from 'antd'
import { TASK_STATUS_REFRESH_POLL_INTERVAL, WORKER_TASK_COMPLETED } from '../../constants/worker'
import { IClientSchema, OnCompleteFunc, TaskRecord, Task, TaskProgressTranslations } from './index'

interface ITaskProgressProps {
    task: TaskRecord
    clientSchema: IClientSchema
    onComplete: OnCompleteFunc
    translations: TaskProgressTranslations
}

export const TaskProgress = ({ task: { id }, clientSchema, onComplete, translations }: ITaskProgressProps) => {
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
            <Progress
                type="circle"
                percent={33}
                width={20}
            />
        </>
    )
}

interface IDisplayTasksProgressArgs {
    title: string
    description: string
    tasks: Task[]
}

// Displays progress for all tasks in one panel
export const displayTasksProgress = ({ title, description, tasks }: IDisplayTasksProgressArgs) => {
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