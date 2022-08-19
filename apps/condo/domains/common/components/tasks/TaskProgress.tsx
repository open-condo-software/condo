/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { InfoCircleOutlined, MinusOutlined } from '@ant-design/icons'
import { useIntl } from '@condo/next/intl'
import { Col, List, notification, Progress, Row, Typography } from 'antd'
import isFunction from 'lodash/isFunction'
import { TASK_COMPLETED_STATUS, TASK_ERROR_STATUS } from '../../constants/tasks'
import { colors } from '../../constants/style'
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
import { CheckIcon } from '../icons/Check'
import { ExpandIcon } from '../icons/ExpandIcon'
import { CrossIcon } from '../icons/CrossIcon'
import { CloseCircleIcon } from '../icons/CloseCircleIcon'

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
        width={22}
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

const TaskIconsHoverSwitcher = styled.div`
     cursor: pointer;
  
    > * {
      position: relative;
      right: 7px;
      
      &.ant-progress-circle {
        right: 2px;
      }
    }
   
     > *:first-child {
       display: block;
     }
     > *:last-child {
       display: none;
     }
   
     &:hover {
       > *:first-child {
         display: none;
       }
       > *:last-child {
         display: block;
       }
     }
`

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
        {task.status === TASK_COMPLETED_STATUS ? (
            <TaskIconsHoverSwitcher onClick={removeTask}>
                <CheckIcon />
                <CrossIcon />
            </TaskIconsHoverSwitcher>
        ) : (task.status === TASK_ERROR_STATUS) ? (
            <CloseCircleIcon onClick={removeTask} />
        ) : (
            <TaskIconsHoverSwitcher onClick={removeTask}>
                <CircularProgress progress={progress}/>
                <CrossIcon />
            </TaskIconsHoverSwitcher>
        )}
    </List.Item>
)


interface ITaskProgressTrackerProps {
    task: ITaskTrackableItem
}

// Prevents calling handle function multiple times when tracking component will be remounted.
// Component will be remounted because recommended technique of updating existing notification by Ant is used,
// that replaces the current instance to new one.
const handledCompletedStatesOfTasksIds = []

/**
 * Polls tasks record for updates and handles its transition to completed status.
 */
export const TaskProgressTracker: React.FC<ITaskProgressTrackerProps> = ({ task }) => {
    const { storage, removeStrategy, calculateProgress, onComplete, translations } = task
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
        if (record?.status === TASK_COMPLETED_STATUS) {
            stopPolling()
            if (isFunction(onComplete) && !handledCompletedStatesOfTasksIds.includes(record.id)) {
                handledCompletedStatesOfTasksIds.push(record.id)
                onComplete(record)
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
  right: 30px;
  top: 20px;
  z-index: 1;
  cursor: pointer;
`

const infoIconStyles = css`
  color: ${colors.infoIconColor};
  font-size: 20px;
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