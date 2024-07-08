import { MeterReadingsImportTask } from '@app/condo/schema'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { TASK_COMPLETED_STATUS, TASK_ERROR_STATUS } from '@condo/domains/common/constants/tasks'
import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { MeterReadingsImportTask as MeterReadingsImportTaskApi } from '@condo/domains/meter/utils/clientSchema'


export const useMeterReadingsImportTaskUIInterface = () => {
    const schemaName = 'MeterReadingsImportTask'

    // @ts-ignore
    const { TaskUIInterface } = useExportTaskUIInterface<MeterReadingsImportTask>({
        schemaName,
        clientSchema: MeterReadingsImportTaskApi,
    })

    const intl = useIntl()
    const ExportTaskProgressTitle = intl.formatMessage({ id: `tasks.${schemaName}.progress.title` })
    const ExportTaskProgressDescriptionPreparing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.preparing` })
    const ExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.processing` })
    const ExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed` })
    const ExportTaskProgressDescriptionPartiallyCompleted = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.partiallyCompleted` })
    const ExportTaskProgressDescriptionError = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.error` })
    const ExportTaskProgressDescriptionCompletedLinkLabel = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed.link.label` })


    // override translations:
    TaskUIInterface.translations = {
        title: (taskRecord) => ExportTaskProgressTitle,
        description: (taskRecord) => {
            const taskStatus = get(taskRecord, 'status')
            const errorFilePublicUrl = get(taskRecord, 'errorFile.publicUrl')
            const errorMessage = get(taskRecord, 'errorMessage')
            const totalRecordsCount = get(taskRecord, 'totalRecordsCount')
            const processedRecordsCount = get(taskRecord, 'processedRecordsCount')
            
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
                        .replace('{imported}', processedRecordsCount || 0)
                        .replace('{total}', totalRecordsCount || 0)
            }

        },
    }

    // override progress calculations
    TaskUIInterface.calculateProgress = (taskRecord) => {
        const totalRecordsCount = get(taskRecord, 'totalRecordsCount')
        const processedRecordsCount = get(taskRecord, 'processedRecordsCount', 0) || 0
        return !totalRecordsCount ? 0 : Math.floor(processedRecordsCount / totalRecordsCount * 100)
    }

    // override default logic for downloading file
    // since here we are the source of such files
    TaskUIInterface.onComplete = console.log
    TaskUIInterface.onCancel = console.log

    return {
        MeterReadingsImportTask: TaskUIInterface,
    }
}

export const useMeterReadingsImportTask = ({ file, userId, organizationId }) => {
    const { MeterReadingsImportTask: TaskUIInterface } = useMeterReadingsImportTaskUIInterface()

    // there must be all args to create MeterReadingsImportTask job
    const { handleRunTask } = useTaskLauncher(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        user: { connect: { id: userId } },
        organization: { connect: { id: organizationId } },
        file,
    })

    return {
        handleRunTask,
    }
}

