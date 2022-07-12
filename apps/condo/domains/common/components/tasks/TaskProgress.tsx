/** @jsx jsx */
import React, { useEffect, useState, useCallback, useContext, useMemo } from 'react'
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { MinusOutlined } from '@ant-design/icons'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import { Progress, Typography, List, Row, Col } from 'antd'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { colors } from '@condo/domains/common/constants/style'
import {
    IClientSchema,
    OnCompleteFunc,
    TaskRecord,
    ITaskTrackableItem,
    TaskProgressTranslations,
    CalculateProgressFunc,
    TaskRecordProgress, TASK_PROGRESS_UNKNOWN, ITasksStorage, TasksContext,
} from './index'
import { CheckIcon } from '@condo/domains/common/components/icons/Check'
import { ExpandIcon } from '@condo/domains/common/components/icons/ExpandIcon'
import { CrossIcon } from '@condo/domains/common/components/icons/CrossIcon'

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
        type="circle"
        width={22}
        strokeWidth={14}
        strokeColor={{
            '0%': '#4CD174',
            '100%': '#6DB8F2',
        }}
        strokeLinecap="square"
        showInfo={false}
        percent={progress === TASK_PROGRESS_UNKNOWN ? 99 : progress}
        css={progress === TASK_PROGRESS_UNKNOWN ? InfiniteSpinningStyle : {}}
    />
)

interface ITaskProgressProps {
    task: TaskRecord
    translations: TaskProgressTranslations
    progress: TaskRecordProgress
    removeTask: () => void
}

const TaskProgressDoneHolder = styled.div`
    cursor: pointer;
  
    .anticon:first-child {
      display: block;
    }
    .anticon:last-child {
      display: none;
    }
  
    &:hover {
      .anticon:first-child {
        display: none;
      }
      .anticon:last-child {
        display: block;
      }
    }
`

const TaskProgressDoneIcon = ({ onClick }) => (
    <TaskProgressDoneHolder onClick={onClick}>
        <CheckIcon />
        <CrossIcon />
    </TaskProgressDoneHolder>
)


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
            <TaskProgressDoneIcon onClick={removeTask}/>
        ) : (
            <CircularProgress progress={progress}/>
        )}
    </List.Item>
)


interface ITaskProgressTrackerProps {
    task: TaskRecord
    storage: ITasksStorage
    calculateProgress: CalculateProgressFunc
    onComplete?: OnCompleteFunc
    translations: TaskProgressTranslations
}

// Prevents calling handle function multiple times when tracking component will be remounted.
// Component will be remounted because recommended technique of updating existing notification by Ant is used,
// that replaces the current instance to new one.
const handledCompletedStatesOfTasksIds = []

/**
 * Polls tasks record for updates and handles its transition to completed status.
 */
export const TaskProgressTracker: React.FC<ITaskProgressTrackerProps> = ({ task, storage, calculateProgress, onComplete, translations }) => {
    const { id } = task

    const { record, stopPolling } = storage.useTask(id)
    const { deleteTask } = useContext(TasksContext)

    const removeTaskCallback = useCallback(() => {
        const removeTask = storage.useDeleteTask({}, () => {
            deleteTask(record)
        })
        removeTask(record)
    }, [record, storage, deleteTask])

    useEffect(() => {
        if (!record) {
            console.error('Could not fetch status of task', task)
            return
        }
        if (record.status === TASK_COMPLETED_STATUS) {
            stopPolling()
            if (onComplete && !handledCompletedStatesOfTasksIds.includes(record.id)) {
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
            removeTask={removeTaskCallback}
        />
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

interface ITasksProgressProps {
    tasks: ITaskTrackableItem[]
}

const PARAGRAPH_DESCRIPTION_STYLE: React.CSSProperties = { color: colors.textSecondary }

/**
 * Summary for all current tasks that has the same layout as `notification` from Ant (with icon, title and description).
 * Can be collapsed or expanded
 */
export const TasksProgress = ({ tasks }: ITasksProgressProps) => {
    const intl = useIntl()
    const TitleMsg = intl.formatMessage({ id: 'tasks.progressNotification.title' })
    const DescriptionMsg = intl.formatMessage({ id: 'tasks.progressNotification.description' })

    const [collapsed, setCollapsed] = useState(false)

    const toggleCollapsed = useCallback(() => {
        setCollapsed(!collapsed)
    }, [collapsed])

    const listStyle = useMemo(() => ({ display: collapsed ? 'none' : 'block' }), [collapsed])

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
                        <Typography.Paragraph style={PARAGRAPH_DESCRIPTION_STYLE}>
                            {DescriptionMsg}
                        </Typography.Paragraph>
                    )}
                    <List
                        style={listStyle}
                        dataSource={tasks}
                        renderItem={({ record, storage, translations, calculateProgress, onComplete }) => (
                            <TaskProgressTracker
                                key={record.id}
                                task={record}
                                storage={storage}
                                translations={translations}
                                calculateProgress={calculateProgress}
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
        description: (
            <TasksProgress tasks={tasks}/>
        ),
    })
}
