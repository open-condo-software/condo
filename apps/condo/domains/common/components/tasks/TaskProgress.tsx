/** @jsx jsx */
import { InfoCircleOutlined } from '@ant-design/icons'
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, List, notification, Progress, Row } from 'antd'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import { ChevronDown, ChevronUp, Check, Close } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Space } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import {
    TASK_COMPLETED_STATUS,
    TASK_ERROR_STATUS,
    TASK_PROCESSING_STATUS,
    TASK_CANCELLED_STATUS,
} from '@condo/domains/common/constants/tasks'

import { CloseCircleIcon } from '../icons/CloseCircleIcon'

import {
    ITaskTrackableItem,
    TASK_PROGRESS_UNKNOWN,
    TASK_REMOVE_STRATEGY,
    TASK_STATUS,
    TaskProgressTranslations,
    TaskRecord,
    TaskRecordProgress,
    TasksContext,
} from './index'


const InfiniteSpinningStyle = css`
  @keyframes rotate {
    100% {
        transform: rotate(1turn);
    }
  }
  .ant-progress-circle {
    animation: rotate 1.6s linear infinite;
  }
`

type ICircularProgressProps = {
    progress: TaskRecordProgress,
}

/**
 * Gradient-colored circle that can be displayed in two states depending on value of a `progress` prop:
 * 1. Known progress displaying as partially filled circle
 * 2. Unknown progress displaying as "fully" filled spinning circle
 * "Fully" filling is implemented as 99 percents to prevent displaying Ant `Progress` component in completed state
 */
export const CircularProgress = ({ progress }: ICircularProgressProps) => (
    <Progress
        type='circle'
        width={18}
        strokeWidth={14}
        strokeColor={{
            '0%': '#4CD174',
            '100%': '#6DB8F2',
        }}
        strokeLinecap='square'
        showInfo={false}
        percent={progress === TASK_PROGRESS_UNKNOWN ? 99 : progress}
        css={progress === TASK_PROGRESS_UNKNOWN ? InfiniteSpinningStyle : {}}
    />
)

const TaskIconsWrapper = styled.div`
    cursor: pointer;
    align-self: flex-start;
    position: absolute;
    top: 12px;
    right: 0;

    > * {
      position: relative;
      right: 3px;
    }
`

const TaskIconsHoverSwitcher = ({ progress, taskStatus, removeTask }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <TaskIconsWrapper
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={removeTask}
        >
            {
                taskStatus === TASK_COMPLETED_STATUS
                    ? (isHovered
                        ? <Close size='medium' color={colors.red['5']} />
                        : <Check size='medium' color={colors.green['5']} />
                    ) : taskStatus === TASK_ERROR_STATUS
                        ? <CloseCircleIcon />
                        : (isHovered ? <Close size='medium' color={colors.red['5']} /> : <CircularProgress progress={progress}/>)
            }
        </TaskIconsWrapper>
    )
}

interface ITaskProgressProps {
    task: TaskRecord
    translations: TaskProgressTranslations
    progress: TaskRecordProgress
    removeTask: () => void
    isDesktop: boolean
}

/**
 * Displays task as an item in tasks list on panel
 */
export const TaskProgress = ({ task, translations, progress, removeTask, isDesktop }: ITaskProgressProps) => {
    const intl = useIntl()
    const CloseTitle = intl.formatMessage({ id: 'Close' })
    const CancelTitle = intl.formatMessage({ id: 'Cancel' })

    return (
        <List.Item style={{ position: 'relative' }}>
            <Space direction='vertical' size={16} width='100%'>
                <List.Item.Meta
                    title={
                        <Typography.Title level={5}>
                            {translations.title(task)}
                        </Typography.Title>
                    }
                    description={translations.description(task)}
                />
                {!isDesktop && (
                    <Typography.Text type='danger' onClick={removeTask}>
                        {task.status === TASK_STATUS.PROCESSING ? CancelTitle : CloseTitle}
                    </Typography.Text>
                )}
            </Space>
            <TaskIconsHoverSwitcher
                progress={progress}
                taskStatus={task.status}
                removeTask={removeTask}
            />
        </List.Item>
    )
}
interface ITaskProgressTrackerProps {
    task: ITaskTrackableItem
    isDesktop: boolean
}

// Prevents calling handle function multiple times when tracking component will be remounted.
// Component will be remounted because recommended technique of updating existing notification by Ant is used,
// that replaces the current instance to new one.
const handledTerminalStatesOfTasksIds = []

/**
 * Polls tasks record for updates and handles its transition to completed status.
 */
export const TaskProgressTracker: React.FC<ITaskProgressTrackerProps> = ({ task, isDesktop }) => {
    const { storage, removeStrategy, calculateProgress, onComplete, onCancel, onError, translations } = task
    const { record, stopPolling } = storage.useTask(task.record.id)

    const { deleteTask: deleteTaskFromContext } = useContext(TasksContext)

    const removeTaskFromStorage = storage.useDeleteTask({}, () => {
        if (removeStrategy.includes(TASK_REMOVE_STRATEGY.PANEL)) {
            deleteTaskFromContext(record)
        }
    })

    const removeTaskFromUI = () => {
        if (removeStrategy.includes(TASK_REMOVE_STRATEGY.STORAGE)) {
            removeTaskFromStorage(record)
        } else if (removeStrategy.includes(TASK_REMOVE_STRATEGY.PANEL)) {
            deleteTaskFromContext(record)
        }
    }

    const cancelTaskAndRemoveFromUI = storage.useUpdateTask({ status: TASK_STATUS.CANCELLED }, removeTaskFromUI)

    const handleRemoveTask = useCallback(async () => {
        // Tasks under processing should be cancelled before removing from UI
        if (record.status === TASK_STATUS.PROCESSING) {
            cancelTaskAndRemoveFromUI({}, record)
        } else {
            removeTaskFromUI()
        }
    }, [record, removeTaskFromUI])

    useEffect(() => {
        if (record && record.status !== TASK_PROCESSING_STATUS) {
            stopPolling()
            if (!handledTerminalStatesOfTasksIds.includes(record.id)) {
                if (record.status === TASK_COMPLETED_STATUS && isFunction(onComplete)) {
                    handledTerminalStatesOfTasksIds.push(record.id)
                    onComplete(record)
                }
                if (record.status === TASK_CANCELLED_STATUS && isFunction(onCancel)) {
                    handledTerminalStatesOfTasksIds.push(record.id)
                    onCancel(record)
                }
                if (record.status === TASK_ERROR_STATUS && isFunction(onError)) {
                    handledTerminalStatesOfTasksIds.push(record.id)
                    onError(record)
                }
            }
        }
    }, [record])

    if (!record) {
        return null
    }

    return (
        <TaskProgress
            task={record}
            progress={calculateProgress(record)}
            translations={translations}
            removeTask={handleRemoveTask}
            isDesktop={isDesktop}
        />
    )
}

const RIGHT_ALIGN_STYLE: React.CSSProperties = {
    position: 'absolute',
    right: '2px',
    top: 0,
    cursor: 'pointer',
    zIndex: 1,
}
const INFO_ICON_STYLE: React.CSSProperties = {
    fontSize: '24px',
    color: colors.blue['5'],
}
const RELATIVE_CONTAINER_STYLE: React.CSSProperties = {
    position: 'relative',
}

interface ITasksProgressProps {
    tasks: ITaskTrackableItem[]
}

/**
 * Summary for all current tasks that has the same layout as `notification` from Ant (with icon, title and description).
 * Can be collapsed or expanded
 */
export const TasksProgress = ({ tasks }: ITasksProgressProps) => {
    const intl = useIntl()
    const TitleMsg = intl.formatMessage({ id: 'tasks.progressNotification.title' })

    const { breakpoints: { TABLET_LARGE: isDesktop } } = useLayoutContext()
    const { deleteAllTasks } = useContext(TasksContext)

    const [collapsed, setCollapsed] = useState(!isDesktop)

    const toggleCollapsed = () => {
        setCollapsed(!collapsed)
    }

    const listStyle: React.CSSProperties = {
        display: collapsed ? 'none' : 'block',
        maxHeight: isDesktop ? 'calc(100vh - 260px)' : 'calc(100vh - 60px)',
        overflowY: 'auto',
    }

    const isAllTasksFinished = tasks.every(task => task.record.status !== TASK_STATUS.PROCESSING)

    return (
        <div>
            <Row gutter={[12, 12]}>
                <Col>
                    <InfoCircleOutlined style={INFO_ICON_STYLE} />
                </Col>
                <Col flex={1} style={RELATIVE_CONTAINER_STYLE}>
                    <Space direction='horizontal' size={4} align='center'>
                        <Typography.Title level={4} onClick={toggleCollapsed}>
                            {TitleMsg}
                        </Typography.Title>
                        {!isDesktop ? (<>{collapsed ? <ChevronDown size='medium' /> : <ChevronUp size='medium' />}</>) : null}
                    </Space>
                    {isDesktop && (
                        <div style={{ ...RIGHT_ALIGN_STYLE, right: '10px' }}>
                            <Space direction='horizontal' align='baseline' size={12}>
                                <div onClick={toggleCollapsed}>
                                    {collapsed ? <ChevronDown size='medium' /> : <ChevronUp size='medium' />}
                                </div>
                                {isAllTasksFinished && <Close size='medium' onClick={deleteAllTasks} />}
                            </Space>
                        </div>
                    )}
                    {!isDesktop && (
                        <div style={RIGHT_ALIGN_STYLE}>
                            <Close size='medium' onClick={deleteAllTasks} />
                        </div>
                    )}
                    <List
                        style={listStyle}
                        dataSource={tasks}
                        renderItem={(task) => (
                            <TaskProgressTracker
                                key={task.record.id}
                                task={task}
                                isDesktop={isDesktop}
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
    tasks: ITaskTrackableItem[]
}

/**
 * Displays progress for all tasks using one panel
 */
export const displayTasksProgress = ({ notificationApi, tasks }: IDisplayTasksProgressArgs) => {
    notificationApi.open({
        key: 'tasks',
        className: 'tasks',
        duration: 0,
        top: 60,
        getContainer: () => document.getElementById('tasks-container') || document.body,
        description: (
            <TasksProgress tasks={tasks}/>
        ),
    })
}

export const closeTasksProgress = () => {
    // NOTE: `notificationApi` obtained via `notification.useNotification` does not have `close` method ;) That's why we have a little inconsistency here
    notification.destroy()
}
