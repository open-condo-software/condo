import { type TicketDocumentGenerationTask as TicketDocumentGenerationTaskType } from '@app/condo/schema'
import get from 'lodash/get'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { ITask, TASK_REMOVE_STRATEGY, TASK_STATUS } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { TicketDocumentGenerationTask } from '@condo/domains/ticket/utils/clientSchema'


export const useTicketDocumentGenerationTaskUIInterface = () => {
    const intl = useIntl()
    const TaskProgressTitle = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.title' })
    const TaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.description.processing' })
    const TaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.description.completed' })
    const ExportTaskProgressDescriptionCompletedLinkLabel = intl.formatMessage({ id: 'tasks.TicketDocumentGenerationTask.progress.description.completed.link.label' })

    const { downloadFile } = useDownloadFileFromServer()

    const tryToDownloadFile = useCallback(async (taskRecord: TicketDocumentGenerationTaskType) => {
        const publicUrl = get(taskRecord, 'file.publicUrl')
        const filename = get(taskRecord, 'file.originalFilename')
        if (publicUrl && filename) {
            await downloadFile({ url: publicUrl, name: filename })
        } else {
            console.error('File is missing in TicketDocumentGenerationTask', taskRecord)
        }
    }, [downloadFile])

    const TaskUIInterface: ITask = {
        storage: new TasksCondoStorage({
            clientSchema: TicketDocumentGenerationTask,
        }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => TaskProgressTitle,
            description: (taskRecord) => {
                const publicUrl = get(taskRecord, 'file.publicUrl')

                return taskRecord.status === TASK_STATUS.COMPLETED
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
        calculateProgress: (task: TicketDocumentGenerationTaskType) => {
            return task.progress
        },
        onComplete: tryToDownloadFile,
        onCancel: tryToDownloadFile,
    }

    return {
        TicketDocumentGenerationTask: TaskUIInterface,
    }
}
