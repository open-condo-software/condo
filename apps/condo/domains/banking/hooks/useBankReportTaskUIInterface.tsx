import { notification } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'
import type { ButtonProps } from '@open-condo/ui'

import { BankAccountReportTask } from '@condo/domains/banking/utils/clientSchema'
import { ITask, TASK_REMOVE_STRATEGY, TASK_STATUS } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import type {
    BankAccountReportTask as BankAccountReportTaskType,
    BankAccount as BankAccountType,
} from '@app/condo/schema'

export const useBankReportTaskUIInterface = () => {
    const intl = useIntl()
    const TaskProgressTitle = intl.formatMessage({ id: 'tasks.BankReportTask.progress.title' })
    const TaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.BankReportTask.progress.description.processing' })
    const TaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.BankReportTask.progress.description.completed' })
    const UpdateTitle = intl.formatMessage({ id: 'Update' })

    const { reload } = useRouter()

    const TaskUIInterface: ITask = {
        storage: new TasksCondoStorage({
            clientSchema: BankAccountReportTask,
        }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => TaskProgressTitle,
            description: (taskRecord) => {
                return taskRecord.status === TASK_STATUS.COMPLETED
                    ? TaskProgressDescriptionCompleted
                    : TaskProgressDescriptionProcessing
            },
        },
        calculateProgress: (task: BankAccountReportTaskType) => {
            return task.progress
        },
        onComplete: () => {
            notification.success({
                message: TaskProgressDescriptionCompleted,
                btn: <Button onClick={() => reload()} type='primary'>{UpdateTitle}</Button>,
            })
        },
        onCancel: () => null,
    }

    return {
        BankReportTask: TaskUIInterface,
    }
}

type UserBankReportTaskButtonProps = {
    organizationId: string,
    user: Record<string, 'unknown'>,
    bankAccount: BankAccountType,
    type?: ButtonProps['type']
}

export const useBankReportTaskButton = (props: UserBankReportTaskButtonProps) => {
    const intl = useIntl()
    const CreateReportTitle = intl.formatMessage({ id: 'property.report.createReport.title' })

    const { organizationId, user, bankAccount, type = 'primary' } = props

    const { BankReportTask: TaskUIInterface } = useBankReportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        account: { connect: { id: bankAccount.id } },
        progress: 0,
        organization: { connect: { id: organizationId } },
        user: { connect: { id: get(user, 'id') } },
    })

    const BankReportTaskButton = useCallback(() => (
        <Button type={type} onClick={handleRunTask} loading={loading}>
            {CreateReportTitle}
        </Button>
    ), [CreateReportTitle, handleRunTask, loading, type])

    return {
        BankReportTaskButton,
        TaskUIInterface,
    }
}
