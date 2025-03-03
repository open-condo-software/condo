import {
    type GetMeterReadingExportTasksQuery,
    type GetContactExportTasksQuery,
    type GetIncidentExportTasksQuery,
    type GetTicketExportTasksQuery,
    type GetNewsItemRecipientsExportTasksQuery,
} from '@app/condo/gql'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { BaseTaskRecord, ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'

import type { DocumentNode } from '@apollo/client'


type ExportTaskMergedType = {
    MeterReadingExportTask: GetMeterReadingExportTasksQuery['tasks'][number]
    IncidentExportTask: GetIncidentExportTasksQuery['tasks'][number]
    TicketExportTask: GetTicketExportTasksQuery['tasks'][number]
    ContactExportTask: GetContactExportTasksQuery['tasks'][number]
    NewsItemRecipientsExportTask: GetNewsItemRecipientsExportTasksQuery['tasks'][number] & {
        exportedRecordsCount: number
        totalRecordsCount: number
    }
}

type ExportTaskNames = keyof ExportTaskMergedType

type UseExportTaskUIInterfaceProps<TExportTaskName extends ExportTaskNames> = {
    schemaName: TExportTaskName
    getTasksDocument: DocumentNode
    createTaskDocument: DocumentNode
    updateTaskDocument: DocumentNode
}

type UseExportTaskUIInterfaceReturn<TTaskRecord extends BaseTaskRecord> = { TaskUIInterface: ITask<TTaskRecord> }

export const useExportTaskUIInterface = <TExportTaskName extends keyof ExportTaskMergedType, TTaskRecord extends ExportTaskMergedType[TExportTaskName] = ExportTaskMergedType[TExportTaskName]> ({
    schemaName,
    getTasksDocument,
    createTaskDocument,
    updateTaskDocument,
}: UseExportTaskUIInterfaceProps<TExportTaskName>): UseExportTaskUIInterfaceReturn<TTaskRecord> => {
    const intl = useIntl()
    const ExportTaskProgressTitle = intl.formatMessage({ id: `tasks.${schemaName}.progress.title` })
    const ExportTaskProgressDescriptionPreparing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.preparing` })
    const ExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.processing` })
    const ExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed` })
    const ExportTaskProgressDescriptionCompletedLinkLabel = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed.link.label` })

    const { downloadFile } = useDownloadFileFromServer()

    const tryToDownloadFile = useCallback(async (taskRecord: TTaskRecord) => {
        const publicUrl = taskRecord?.file?.publicUrl
        const filename = taskRecord?.file?.originalFilename
        if (publicUrl && filename) {
            await downloadFile({ url: publicUrl, name: filename })
        } else {
            // this log entry for development & support purposes on end user browser
            // no important logs can be hided by injected external console.log formatters
            // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
            console.error(`File is missing in ${schemaName}`, taskRecord)
        }
    }, [downloadFile, schemaName])

    /**
     * We need this separation of behavior from data to determine which behaviour
     * to use for initial loaded tasks by `__typename` field value
     */
    const TaskUIInterface: ITask<TTaskRecord> = useMemo(() => ({
        storage: new TasksCondoStorage({
            getTasksDocument,
            createTaskDocument,
            updateTaskDocument,
        }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => ExportTaskProgressTitle,
            description: (taskRecord) => {
                const taskStatus = taskRecord?.status
                const totalRecordsCount = taskRecord?.totalRecordsCount
                const exportedRecordsCount = taskRecord?.exportedRecordsCount
                const publicUrl = taskRecord?.file?.publicUrl

                return taskStatus === TASK_COMPLETED_STATUS
                    ? (
                        <>
                            <Typography.Text
                                type='secondary'
                                size='small'
                            >
                                {ExportTaskProgressDescriptionCompleted}
                            </Typography.Text>
                            {publicUrl && (
                                <>
                                    <br/>
                                    <Typography.Link size='large' href={publicUrl}>
                                        {ExportTaskProgressDescriptionCompletedLinkLabel}
                                    </Typography.Link>
                                </>
                            )}
                        </>
                    ) : !totalRecordsCount || !exportedRecordsCount
                        ? ExportTaskProgressDescriptionPreparing
                        : ExportTaskProgressDescriptionProcessing
                            .replace('{exported}', String(exportedRecordsCount || 0))
                            .replace('{total}', String(totalRecordsCount || 0))
            },
            link: (taskRecord) => {
                const taskStatus = taskRecord?.status
                if (taskStatus === TASK_COMPLETED_STATUS) {
                    return {
                        label: ExportTaskProgressDescriptionCompletedLinkLabel,
                        url: taskRecord?.file?.publicUrl,
                    }
                }
                return null
            },
        },
        calculateProgress: (totalRecordsCount: TTaskRecord) => {
            return Math.floor(totalRecordsCount.exportedRecordsCount / totalRecordsCount.totalRecordsCount * 100)
        },
        onComplete: tryToDownloadFile,
        onCancel: tryToDownloadFile,
    }), [getTasksDocument, createTaskDocument, updateTaskDocument, tryToDownloadFile, ExportTaskProgressTitle, ExportTaskProgressDescriptionCompleted, ExportTaskProgressDescriptionCompletedLinkLabel, ExportTaskProgressDescriptionPreparing, ExportTaskProgressDescriptionProcessing])

    return { TaskUIInterface }
}
