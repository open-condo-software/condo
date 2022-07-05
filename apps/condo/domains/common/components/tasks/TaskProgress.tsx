import React, { useEffect, useState } from 'react'
/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Progress, Typography, List, Row, Col } from 'antd'
import { useIntl } from '@core/next/intl'
import { TASK_POLL_INTERVAL, TASK_COMPLETED_STATUS } from '../../constants/tasks'
import { colors } from '../../constants/style'
import {
    IClientSchema,
    OnCompleteFunc,
    TaskRecord,
    ITaskTrackableItem,
    TaskProgressTranslations,
    CalculateProgressFunc,
    TaskDisplayProgressValue, TASK_PROGRESS_UNKNOWN,
} from './index'
import { InfoCircleOutlined } from '@ant-design/icons'
import { CheckIcon } from '../icons/Check'
import { MinusOutlined } from '@ant-design/icons'
import { ExpandIcon } from '../icons/ExpandIcon'

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
    progress: TaskDisplayProgressValue,
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
    progress: TaskDisplayProgressValue
}

/**
 * Displays task as an item in tasks list on panel
 */
export const TaskProgress = ({ task, translations, progress }: ITaskProgressProps) => (
    <List.Item>
        <List.Item.Meta
            title={
                <Typography.Text strong>
                    {translations.title}
                </Typography.Text>
            }
            description={translations.description(task)}
        />
        {task.status === TASK_COMPLETED_STATUS ? (
            <CheckIcon/>
        ) : (
            <CircularProgress progress={progress}/>
        )}
    </List.Item>
)

interface ITaskProgressTrackerProps {
    task: TaskRecord
    clientSchema: IClientSchema
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
export const TaskProgressTracker: React.FC<ITaskProgressTrackerProps> = ({ task: { id }, clientSchema, calculateProgress, onComplete, translations }) => {
    const { obj: task, stopPolling } = clientSchema.useObject({
        where: { id },
    }, {
        pollInterval: TASK_POLL_INTERVAL,
    })

    useEffect(() => {
        if (!task) {
            console.error('Could not fetch task status')
            return
        }
        if (task.status === TASK_COMPLETED_STATUS) {
            stopPolling()
            if (onComplete && !handledCompletedStatesOfTasksIds.includes(task.id)) {
                handledCompletedStatesOfTasksIds.push(task.id)
                onComplete(task)
            }
        }
    }, [task])

    const progress: TaskDisplayProgressValue = calculateProgress(task)

    return task && (
        <TaskProgress task={task} progress={progress} translations={translations}/>
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
                        renderItem={({ record, clientSchema, translations, calculateProgress, onComplete }) => (
                            <TaskProgressTracker
                                key={record.id}
                                task={record}
                                clientSchema={clientSchema}
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