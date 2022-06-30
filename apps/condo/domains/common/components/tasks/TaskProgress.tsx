import React, { useEffect } from 'react'
import { notification, Progress, Typography, List } from 'antd'
import { TASK_STATUS_REFRESH_POLL_INTERVAL, WORKER_TASK_COMPLETED } from '../../constants/worker'
import { colors, fontSizes } from '../../constants/style'
import { IClientSchema, OnCompleteFunc, TaskRecord, Task, TaskProgressTranslations } from './index'
import { InfoCircleOutlined } from '@ant-design/icons'

interface ITaskProgressProps {
    task: TaskRecord
    translations: TaskProgressTranslations
}

export const TaskProgress = ({ task, translations }: ITaskProgressProps) => (
    <List.Item>
        <List.Item.Meta
            title={
                <Typography.Text strong>
                    {translations.title}
                </Typography.Text>
            }
            description={translations.description(task)}
        />
        <Progress
            type="circle"
            percent={33}
            width={22}
            strokeWidth={14}
            strokeColor={{
                '0%': '#4CD174',
                '100%': '#6DB8F2',
            }}
            strokeLinecap="square"
            showInfo={false}
        />
    </List.Item>
)

interface ITaskProgressTrackerProps {
    task: TaskRecord
    clientSchema: IClientSchema
    onComplete: OnCompleteFunc
    translations: TaskProgressTranslations
}

export const TaskProgressTracker = ({ task/*: { id }*/, clientSchema, onComplete, translations }: ITaskProgressTrackerProps) => {
    // const { obj: task } = clientSchema.useObject({
    //     where: { id },
    // }, {
    //     pollInterval: TASK_STATUS_REFRESH_POLL_INTERVAL,
    // })

    useEffect(() => {
        if (task.status === WORKER_TASK_COMPLETED) {
            onComplete(task)
        }
    }, [task.status, task.progress])

    return (
        <TaskProgress task={task} translations={translations}/>
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
            <Typography.Text strong>
                {title}
            </Typography.Text>
        ),
        icon: (
            <InfoCircleOutlined style={{ color: colors.infoIconColor }}/>
        ),
        duration: 0,
        description: (
            <>
                <Typography.Text style={{ color: colors.textSecondary }}>
                    {description}
                </Typography.Text>
                <List
                    dataSource={tasks}
                    renderItem={({ record, clientSchema, translations, onComplete }) => (
                        <TaskProgressTracker
                            key={record.id}
                            task={record}
                            clientSchema={clientSchema}
                            translations={translations}
                            onComplete={onComplete}
                        />
                    )}
                />
            </>
        ),
    })
}