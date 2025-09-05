import {
    GetMeterReadingsImportTasksDocument,
    CreateMeterReadingsImportTaskDocument,
    UpdateMeterReadingsImportTaskDocument,
    type GetMeterReadingsImportTasksQuery,
} from '@app/condo/gql'
import { MeterReadingsImportTaskCreateInput }  from '@app/condo/schema'
import React from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { TASK_COMPLETED_STATUS, TASK_ERROR_STATUS } from '@condo/domains/common/constants/tasks'


type TaskRecordType = GetMeterReadingsImportTasksQuery['tasks'][number]

type UseMeterReadingsImportTaskUIInterfaceType = (isPropertyMeters?: boolean) => ({ MeterReadingsImportTask: ITask<TaskRecordType> })

export const useMeterReadingsImportTaskUIInterface: UseMeterReadingsImportTaskUIInterfaceType = (isPropertyMeters = false) => {
    const schemaName = isPropertyMeters ? 'PropertyMeterReadingsImportTask' : 'MeterReadingsImportTask'

    const intl = useIntl()
    const ExportTaskProgressTitle = intl.formatMessage({ id: `tasks.${schemaName}.progress.title` })
    const ExportTaskProgressDescriptionPreparing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.preparing` })
    const ExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.processing` })
    const ExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed` })
    const ExportTaskProgressDescriptionPartiallyCompleted = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.partiallyCompleted` })
    const ExportTaskProgressDescriptionError = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.error` })
    const ExportTaskProgressDescriptionCompletedLinkLabel = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed.link.label` })

    const TaskUIInterface: ITask<TaskRecordType> = {
        storage: new TasksCondoStorage({
            getTasksDocument: GetMeterReadingsImportTasksDocument,
            createTaskDocument: CreateMeterReadingsImportTaskDocument,
            updateTaskDocument: UpdateMeterReadingsImportTaskDocument,
        }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => ExportTaskProgressTitle,
            description: (taskRecord) => {
                const taskStatus = taskRecord?.status
                const errorFilePublicUrl = taskRecord?.errorFile?.publicUrl
                const errorMessage = taskRecord?.errorMessage
                const totalRecordsCount = taskRecord?.totalRecordsCount
                const processedRecordsCount = taskRecord?.processedRecordsCount

                if (taskStatus === TASK_COMPLETED_STATUS) {
                    return (
                        <>
                            <Typography.Text
                                type='secondary'
                                size='small'
                            >
                                {ExportTaskProgressDescriptionCompleted}
                            </Typography.Text>
                        </>
                    )
                } else if (taskStatus === TASK_ERROR_STATUS && totalRecordsCount > 0 && processedRecordsCount > 0) {
                    return (
                        <>
                            <Typography.Text
                                type='secondary'
                                size='small'
                            >
                                {ExportTaskProgressDescriptionPartiallyCompleted}
                            </Typography.Text>
                            {errorFilePublicUrl && (
                                <>
                                    <br/>
                                    <Typography.Link size='large' href={errorFilePublicUrl}>
                                        {ExportTaskProgressDescriptionCompletedLinkLabel}
                                    </Typography.Link>
                                </>
                            )}
                        </>
                    )
                } else if (taskStatus === TASK_ERROR_STATUS) {
                    return ExportTaskProgressDescriptionError
                        .replace('{errorMessage}', errorMessage)
                } else {
                    return !totalRecordsCount
                        ? ExportTaskProgressDescriptionPreparing
                        : ExportTaskProgressDescriptionProcessing
                            .replace('{imported}', String(processedRecordsCount || 0))
                            .replace('{total}', String(totalRecordsCount || 0))
                }

            },
        },
        calculateProgress: (taskRecord) => {
            const totalRecordsCount = taskRecord?.totalRecordsCount
            const processedRecordsCount = taskRecord?.processedRecordsCount || 0
            return !totalRecordsCount ? 0 : Math.floor(processedRecordsCount / totalRecordsCount * 100)
        },
        onComplete: console.log,
        onCancel: console.log,
    }

    return {
        MeterReadingsImportTask: TaskUIInterface,
    }
}

export const useMeterReadingsImportTask = ({ file, userId, organizationId, isPropertyMeters }) => {
    const { MeterReadingsImportTask: TaskUIInterface } = useMeterReadingsImportTaskUIInterface(isPropertyMeters)

    // there must be all args to create MeterReadingsImportTask job
    const { handleRunTask } = useTaskLauncher<MeterReadingsImportTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        user: { connect: { id: userId } },
        organization: { connect: { id: organizationId } },
        file,
        isPropertyMeters,
    })

    return {
        handleRunTask,
    }
}
