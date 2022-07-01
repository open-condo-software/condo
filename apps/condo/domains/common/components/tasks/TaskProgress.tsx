import React, { useEffect, useState } from 'react'
/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { notification, Progress, Typography, List, Row, Col } from 'antd'
import { useIntl } from '@core/next/intl'
import { TASK_STATUS_REFRESH_POLL_INTERVAL, WORKER_TASK_COMPLETED } from '../../constants/worker'
import { colors } from '../../constants/style'
import { IClientSchema, OnCompleteFunc, TaskRecord, Task, TaskProgressTranslations } from './index'
import { InfoCircleOutlined } from '@ant-design/icons'
import { CrossIcon } from '../icons/CrossIcon'
import { CheckIcon } from '../icons/Check'

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
        )}
    </List.Item>
)

interface ITaskProgressTrackerProps {
    task: TaskRecord
    clientSchema: IClientSchema
    onComplete?: OnCompleteFunc
    translations: TaskProgressTranslations
}

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
            if (onComplete) {
                onComplete(task)
            }
        }
    }, [task])

    return task && (
        <TaskProgress task={task} translations={translations}/>
    )
}

const TasksPanel = styled.div`
  position: fixed;
  right: 20px;
  top: 20px;
  border-radius: 12px;
  background: white;
  padding: 17px;
  width: 376px;
  box-shadow: 0px 4px 10px rgba(230, 232, 241, 0.8);
  z-index: 99;
`

const closeIconStyles = css`
  position: absolute;
  right: 20px;
  top: 20px;
`

const infoIconStyles = css`
  color: ${colors.infoIconColor};
  font-size: 20px;
`

export const TasksProgress = ({ tasks }) => {
    const intl = useIntl()
    const TitleMsg = intl.formatMessage({ id: 'tasks.progressNotification.title' })
    const DescriptionMsg = intl.formatMessage({ id: 'tasks.progressNotification.description' })
    const [visible, setVisible] = useState(true)

    const handleCloseClick = () => {
        setVisible(false)
    }
    return (
        <TasksPanel style={{ display: visible ? 'block' : 'none' }}>
            <CrossIcon className="close-icon" css={closeIconStyles} onClick={handleCloseClick}/>
            <Row>
                <Col span={2}>
                    <InfoCircleOutlined css={infoIconStyles}/>
                </Col>
                <Col span={22}>
                    <Typography.Paragraph strong>
                        {TitleMsg}
                    </Typography.Paragraph>
                    <Typography.Paragraph style={{ color: colors.textSecondary }}>
                        {DescriptionMsg}
                    </Typography.Paragraph>
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
                </Col>
            </Row>
        </TasksPanel>
    )
}

interface IDisplayTasksProgressArgs {
    title: string
    description: string
    tasks: Task[]
}

/**
 * Displays progress for all tasks in one panel
 * NOTE: This component seems to be mounted outside of main App component scope and by trying to use utils from clientSchema,
 * following error occurs:
 * > Error: [React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.
 * Maybe it will be deprecated if it will not be possible to achieve desired UX with `notification` from Ant
 */
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