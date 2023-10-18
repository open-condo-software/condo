import {
    ContactExportTask as ContactExportTaskType,
    IncidentExportTask as IncidentExportTaskType,
    NewsItemRecipientsExportTask as NewsItemRecipientsExportTaskType,
    TicketExportTask as TicketExportTaskType,
} from '@app/condo/schema'
import get from 'lodash/get'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { ContactExportTask } from '@condo/domains/contact/utils/clientSchema'
import { NewsItemRecipientsExportTask } from '@condo/domains/news/utils/clientSchema'
import { IncidentExportTask, TicketExportTask } from '@condo/domains/ticket/utils/clientSchema'


type ExportTaskTypes =
    IncidentExportTaskType
    | TicketExportTaskType
    | ContactExportTaskType
    | (NewsItemRecipientsExportTaskType & { exportedRecordsCount: number, totalRecordsCount: number })

type ExportTaskClientSchemas =
    typeof IncidentExportTask
    | typeof TicketExportTask
    | typeof ContactExportTask
    | typeof NewsItemRecipientsExportTask

type ExportTaskSchemaNames =
    'IncidentExportTask'
    | 'TicketExportTask'
    | 'ContactExportTask'
    | 'NewsItemRecipientsExportTask'

type UseExportTaskUIInterfaceProps = {
    clientSchema: ExportTaskClientSchemas
    schemaName: ExportTaskSchemaNames
}

type UseExportTaskUIInterfaceReturn = { TaskUIInterface: ITask }

export const useExportTaskUIInterface = <T extends ExportTaskTypes> ({
    clientSchema,
    schemaName,
}: UseExportTaskUIInterfaceProps): UseExportTaskUIInterfaceReturn => {
    const intl = useIntl()
    const ExportTaskProgressTitle = intl.formatMessage({ id: `tasks.${schemaName}.progress.title` })
    const ExportTaskProgressDescriptionPreparing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.preparing` })
    const ExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.processing` })
    const ExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed` })
    const ExportTaskProgressDescriptionCompletedLinkLabel = intl.formatMessage({ id: `tasks.${schemaName}.progress.description.completed.link.label` })

    const { downloadFile } = useDownloadFileFromServer()

    const tryToDownloadFile = useCallback(async (taskRecord: T) => {
        const publicUrl = get(taskRecord, 'file.publicUrl')
        const filename = get(taskRecord, 'file.originalFilename')
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
    const TaskUIInterface: ITask = useMemo(() => ({
        storage: new TasksCondoStorage({ clientSchema }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => ExportTaskProgressTitle,
            description: (taskRecord) => {
                const taskStatus = get(taskRecord, 'status')
                const totalRecordsCount = get(taskRecord, 'totalRecordsCount')
                const exportedRecordsCount = get(taskRecord, 'exportedRecordsCount')
                const publicUrl = get(taskRecord, 'file.publicUrl')

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
                            .replace('{exported}', exportedRecordsCount || 0)
                            .replace('{total}', totalRecordsCount || 0)
            },
            link: (taskRecord) => {
                const taskStatus = get(taskRecord, 'status')
                if (taskStatus === TASK_COMPLETED_STATUS) {
                    return {
                        label: ExportTaskProgressDescriptionCompletedLinkLabel,
                        url: get(taskRecord, 'file.publicUrl'),
                    }
                }
                return null
            },
        },
        calculateProgress: (totalRecordsCount: T) => {
            return Math.floor(totalRecordsCount.exportedRecordsCount / totalRecordsCount.totalRecordsCount * 100)
        },
        onComplete: tryToDownloadFile,
        onCancel: tryToDownloadFile,
    }), [ExportTaskProgressDescriptionCompleted, ExportTaskProgressDescriptionPreparing, ExportTaskProgressDescriptionProcessing, ExportTaskProgressTitle, ExportTaskProgressDescriptionCompletedLinkLabel, clientSchema, tryToDownloadFile])

    return { TaskUIInterface }
}
