/** @jsx jsx */
import { InfoCircleOutlined } from '@ant-design/icons'
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, List, notification, Progress, Row, Typography } from 'antd'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ChevronIcon } from '@condo/domains/common/components/icons/ChevronIcon'
import { colors } from '@condo/domains/common/constants/style'
import { TASK_COMPLETED_STATUS, TASK_ERROR_STATUS, TASK_PROCESSING_STATUS, TASK_CANCELLED_STATUS } from '@condo/domains/common/constants/tasks'

import { CheckIcon } from '../icons/Check'
import { CloseCircleIcon } from '../icons/CloseCircleIcon'
import { CrossIcon } from '../icons/CrossIcon'

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
                taskStatus === TASK_COMPLETED_STATUS ? (isHovered ? <CrossIcon/> : <CheckIcon/>) :
                    taskStatus === TASK_ERROR_STATUS ? <CloseCircleIcon/> :
                        (isHovered ? <CrossIcon/> : <CircularProgress progress={progress}/>)
            }
        </TaskIconsWrapper>
    )
}

interface ITaskProgressProps {
    task: TaskRecord
    translations: TaskProgressTranslations
    progress: TaskRecordProgress
    removeTask: () => void
}

/**
 * Displays task as an item in tasks list on panel
 */
export const TaskProgress = ({ task, translations, progress, removeTask }: ITaskProgressProps) => (
    <List.Item>
        <List.Item.Meta
            title={
                <Typography.Text strong>
                    {translations.title(task)}
                </Typography.Text>
            }
            description={translations.description(task)}
        />
        <TaskIconsHoverSwitcher
            progress={progress}
            taskStatus={task.status}
            removeTask={removeTask}
        />
    </List.Item>
)



interface ITaskProgressTrackerProps {
    task: ITaskTrackableItem
}

// Prevents calling handle function multiple times when tracking component will be remounted.
// Component will be remounted because recommended technique of updating existing notification by Ant is used,
// that replaces the current instance to new one.
const handledTerminalStatesOfTasksIds = []

/**
 * Polls tasks record for updates and handles its transition to completed status.
 */
export const TaskProgressTracker: React.FC<ITaskProgressTrackerProps> = ({ task }) => {
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
        />
    )
}

const VisibilityControlButton = styled.div`
  position: absolute;
  right: 20px;
  top: 19px;
  z-index: 1;
  cursor: pointer;
`

const ChevronCollapseIconStyle = css`
  transform-origin: center;
  transform: rotate(180deg);
`

const infoIconStyles = css`
  color: ${colors.infoIconColor};
  font-size: 20px;
`

const TasksProgressTitleStyle = css`
  font-size: 16px;
  line-height: 1.25;
  margin-bottom: 0;
`

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
                    <ChevronIcon/>
                ) : (
                    <ChevronIcon css={ChevronCollapseIconStyle}/>
                )}
            </VisibilityControlButton>
            <Row>
                <Col span={2}>
                    <InfoCircleOutlined css={infoIconStyles}/>
                </Col>
                <Col span={22}>
                    <Typography.Paragraph strong css={TasksProgressTitleStyle}>
                        {TitleMsg}
                    </Typography.Paragraph>
                    <List
                        style={{ display: collapsed ? 'none' : 'block' }}
                        dataSource={tasks}
                        renderItem={(task) => (
                            <TaskProgressTracker
                                key={task.record.id}
                                task={task}
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
        description: (
            <TasksProgress tasks={tasks}/>
        ),
    })
}

export const closeTasksProgress = () => {
    // NOTE: `notificationApi` obtained via `notification.useNotification` does not have `close` method ;) That's why we have a little inconsistency here
    notification.close('tasks')
}