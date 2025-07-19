import {
    GetTicketDocumentGenerationTasksDocument,
    CreateTicketDocumentGenerationTaskDocument,
    UpdateTicketDocumentGenerationTaskDocument,
} from '@app/condo/gql'
import get from 'lodash/get'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'

import type { GetTicketDocumentGenerationTasksQuery } from '@app/condo/gql'


type TaskRecordType = GetTicketDocumentGenerationTasksQuery['tasks'][number]
type UseTicketDocumentGenerationTaskUIInterfaceType = () => ({ TicketDocumentGenerationTask: ITask<TaskRecordType> })

export const useTicketDocumentGenerationTaskUIInterface: UseTicketDocumentGenerationTaskUIInterfaceType = () => {
    const intl = useIntl()
    const TaskProgressTitle = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.title' })
    const TaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.description.processing' })
    const TaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.description.completed' })
    const ExportTaskProgressDescriptionCompletedLinkLabel = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.description.completed.link.label' })

    const { downloadFile } = useDownloadFileFromServer()

    const tryToDownloadFile = useCallback(async (taskRecord: TaskRecordType) => {
        const publicUrl = taskRecord?.file?.publicUrl
        const filename = taskRecord?.file?.originalFilename
        if (publicUrl && filename) {
            await downloadFile({ url: publicUrl, name: filename })
        } else {
            console.error('File is missing in TicketDocumentGenerationTask', taskRecord)
        }
    }, [downloadFile])

    const TaskUIInterface: ITask<TaskRecordType> = {
        storage: new TasksCondoStorage({
            getTasksDocument: GetTicketDocumentGenerationTasksDocument,
            createTaskDocument: CreateTicketDocumentGenerationTaskDocument,
            updateTaskDocument: UpdateTicketDocumentGenerationTaskDocument,
        }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => TaskProgressTitle,
            description: (taskRecord) => {
                const publicUrl = get(taskRecord, 'file.publicUrl')

                return taskRecord.status === TASK_COMPLETED_STATUS
                    ? (
                        <>
                            <Typography.Text
                                type='secondary'
                                size='small'
                            >
                                {TaskProgressDescriptionCompleted}
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
                    )
                    : TaskProgressDescriptionProcessing
            },
        },
        calculateProgress: (task: TaskRecordType) => {
            return task.progress
        },
        onComplete: tryToDownloadFile,
        onCancel: tryToDownloadFile,
    }

    return {
        TicketDocumentGenerationTask: TaskUIInterface,
    }
}
