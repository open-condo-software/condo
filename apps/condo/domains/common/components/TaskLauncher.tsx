import { DatabaseFilled } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { useLazyQuery } from '@core/next/apollo'
import { Form, notification } from 'antd'
import { DocumentNode } from 'graphql'
import { get } from 'lodash'
import React, { useCallback, useContext } from 'react'
import { TasksContext } from './TasksContextProvider'
import { OnCompleteFunc } from './TasksContextProvider'

interface ITaskLauncherProps {
    label: string
    launchTaskMutation: DocumentNode
    taskClientSchema: any,
    buildMutationVariables: () => any
    onComplete: OnCompleteFunc
    disabled?: boolean
    hidden?: boolean
}

export const TaskLauncher: React.FC<ITaskLauncherProps> = (props) => {
    const {
        label,
        taskClientSchema,
        buildMutationVariables,
        onComplete,
        launchTaskMutation,
        hidden = false,
        disabled = false,
    } = props

    // @ts-ignore
    const { addTask } = useContext(TasksContext.Consumer)

    const [
        launchTask,
        { loading },
    ] = useLazyQuery(
        launchTaskMutation,
        {
            onError: error => {
                const message = get(error, ['graphQLErrors', 0, 'extensions', 'messageForUser']) || error.message
                notification.error({ message })
            },
            onCompleted: data => {
                addTask({
                    record: data.task,
                    clientSchema: taskClientSchema,
                    onComplete,
                })
            },
        },
    )

    const data = buildMutationVariables()

    const handleClick = useCallback(() => {
        launchTask({ variables: { data } })
    }, [launchTask, data])

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
