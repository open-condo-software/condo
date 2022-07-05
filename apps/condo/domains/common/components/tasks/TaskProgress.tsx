import React, { useEffect, useState } from 'react'
/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Progress, Typography, List, Row, Col } from 'antd'
import { useIntl } from '@core/next/intl'
import { TASK_STATUS_REFRESH_POLL_INTERVAL, WORKER_TASK_COMPLETED } from '../../constants/worker'
import { colors } from '../../constants/style'
import { IClientSchema, OnCompleteFunc, TaskRecord, Task, TaskProgressTranslations } from './index'
import { InfoCircleOutlined } from '@ant-design/icons'
import { CheckIcon } from '../icons/Check'
import { MinusOutlined } from '@ant-design/icons'
import { ExpandIcon } from '../icons/ExpandIcon'

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
        {task.status === WORKER_TASK_COMPLETED ? (
            <CheckIcon/>
        ) : (
            <Progress
                type="circle"
                width={22}
                strokeWidth={14}
                strokeColor={{
                    '0%': '#4CD174',
                    '100%': '#6DB8F2',
                }}
                strokeLinecap="square"
                showInfo={false}
            />
        )}
    </List.Item>
)

interface ITaskProgressTrackerProps {
    task: TaskRecord
    clientSchema: IClientSchema
    onComplete?: OnCompleteFunc
    translations: TaskProgressTranslations
}

// Prevents calling handle function multiple times when tracking component will be remounted.
// Component will be remounted because recommended technique of updating existing notification by Ant is used,
// that replaces the current instance to new one.
const handledCompletedStatesOfTasksIds = []

export const TaskProgressTracker = ({ task: { id }, clientSchema, onComplete, translations }: ITaskProgressTrackerProps) => {
    const { obj: task, stopPolling } = clientSchema.useObject({
        where: { id },
    }, {
        pollInterval: TASK_STATUS_REFRESH_POLL_INTERVAL,
    })

    useEffect(() => {
        if (!task) {
            console.error('Could not fetch task status')
            return
        }
        if (task.status === WORKER_TASK_COMPLETED) {
            stopPolling()
            if (onComplete && !handledCompletedStatesOfTasksIds.includes(task.id)) {
                handledCompletedStatesOfTasksIds.push(task.id)
                onComplete(task)
            }
        }
    }, [task])

    return task && (
        <TaskProgress task={task} translations={translations}/>
    )
}

const VisibilityControlButton = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  z-index: 1;
  cursor: pointer;
`

const infoIconStyles = css`
  color: ${colors.infoIconColor};
  font-size: 20px;
`

export const TasksProgress = ({ tasks }) => {
    const intl = useIntl()
    const TitleMsg = intl.formatMessage({ id: 'tasks.progressNotification.title' })
    const DescriptionMsg = intl.formatMessage({ id: 'tasks.progressNotification.description' })
    const [collapsed, setCollapsed] = useState(false)

    const toggleCollapsed = () => {
        setCollapsed(!collapsed)
    }
    return (
        <div>
            <VisibilityControlButton
                onClick={toggleCollapsed}
            >
                {collapsed ? (
                    <ExpandIcon/>
                ) : (
                    <MinusOutlined/>
                )}
            </VisibilityControlButton>
            <Row>
                <Col span={2}>
                    <InfoCircleOutlined css={infoIconStyles}/>
                </Col>
                <Col span={22}>
                    <Typography.Paragraph strong>
                        {TitleMsg}
                    </Typography.Paragraph>
                    {!collapsed && (
                        <Typography.Paragraph style={{ color: colors.textSecondary }}>
                            {DescriptionMsg}
                        </Typography.Paragraph>
                    )}
                    <List
                        style={{ display: collapsed ? 'none' : 'block' }}
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
                </Col>
            </Row>
        </div>
    )
}

interface IDisplayTasksProgressArgs {
    notificationApi: any
    title: string
    description: string
    tasks: Task[]
}

/**
 * Displays progress for all tasks using one panel
 */
export const displayTasksProgress = ({ notificationApi, tasks }: IDisplayTasksProgressArgs) => {
    notificationApi.open({
        key: 'tasks',
        className: 'tasks',
        duration: 0,
        description: (
            <TasksProgress tasks={tasks}/>
        ),
    })
}