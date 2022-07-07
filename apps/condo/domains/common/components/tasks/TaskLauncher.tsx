import React, { useCallback, useContext, useState } from 'react'
import { Form } from 'antd'
import { DatabaseFilled } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { TasksContext } from './TasksContextProvider'
import { ITask } from './index'

interface ITaskLauncherProps {
    label: string
    taskUIInterface: ITask
    attrs: any
    hidden?: boolean
    disabled?: boolean
}

/**
 * Launches specified task by creating its record with `useCreate`
 * and adds its progress representation using ITasksContext interface
 */
export const TaskLauncher: React.FC<ITaskLauncherProps> = (props) => {
    const {
        label,
        taskUIInterface,
        attrs,
        hidden = false,
        disabled = false,
    } = props

    const [loading, setLoading] = useState(false)

    // TODO(antonal): load in-progress tasks and set loading state
    // @ts-ignore
    const { addTask } = useContext(TasksContext)

    const launchTask = taskUIInterface.storage.useCreateTask({}, record => {
        setLoading(true)
        addTask({
            record,
            ...taskUIInterface,
            onComplete: (result) => {
                setLoading(false)
                taskUIInterface.onComplete(result)
            },
        })
    })

    const handleClick = useCallback(() => {
        launchTask(attrs)
    }, [launchTask, attrs])

    return (
        <Form.Item noStyle>
            <ActionBar hidden={hidden}>
                <Button
                    type={'sberBlack'}
                    secondary
                    icon={<DatabaseFilled/>}
                    loading={loading}
                    onClick={handleClick}
                    disabled={disabled}
                >
                    {label}
                </Button>
            </ActionBar>
        </Form.Item>
    )
}
