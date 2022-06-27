import { DatabaseFilled } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { Form } from 'antd'
import React, { useCallback, useContext, useState } from 'react'
import { TasksContext, TaskProgressTranslations } from './TasksContextProvider'
import { OnCompleteFunc } from './TasksContextProvider'

interface ITaskLauncherProps {
    label: string
    taskClientSchema: any
    attrs: any
    translations: TaskProgressTranslations
    onComplete: OnCompleteFunc
    disabled?: boolean
    hidden?: boolean
}

/**
 * Launches specified task by creating it's record with `useCreate`
 * and adds it's progress representation using ITasksContext interface
 * @param props
 * @constructor
 */
export const TaskLauncher: React.FC<ITaskLauncherProps> = (props) => {
    const {
        label,
        taskClientSchema,
        attrs,
        translations,
        onComplete,
        hidden = false,
        disabled = false,
    } = props

    const [loading, setLoading] = useState(false)

    // TODO(antonal): load in-progress tasks and set loading state
    // @ts-ignore
    const { addTask } = useContext(TasksContext.Consumer)

    const launchTask = taskClientSchema.useCreate(attrs, record => {
        setLoading(true)
        addTask({
            record,
            clientSchema: taskClientSchema,
            translations,
            onComplete: (result) => {
                setLoading(false)
                onComplete(result)
            },
        })
    })
    
    const handleClick = useCallback(() => {
        launchTask()
    }, [launchTask])

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
