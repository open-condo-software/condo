import type { ShowProgressBarParams } from '@open-condo/bridge'
import type { IFrameMetadata } from '@open-condo/miniapp-utils/helpers/iframe'

import { ITask, LocalTaskRecord, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksLocalStorage } from '@condo/domains/common/components/tasks/storage/TasksLocalStorage'
import { useProgressBarActions } from '@condo/domains/miniapp/components/ProgressBarActionsContext'

export type MiniAppTaskRecord = LocalTaskRecord & {
    action?: NonNullable<ShowProgressBarParams['action']>
    background?: NonNullable<ShowProgressBarParams['background']>
    disableCancel?: ShowProgressBarParams['disableCancel']
    sourceMetadata?: IFrameMetadata
}

type UseMiniappTaskUIInterfaceType = () => ({ MiniAppTask: ITask<MiniAppTaskRecord> })
export const useMiniappTaskUIInterface: UseMiniappTaskUIInterfaceType = () => {
    const { sendProgressBarAction } = useProgressBarActions()
    const TaskUIInterface: ITask<MiniAppTaskRecord> = {
        storage: new TasksLocalStorage(),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL, TASK_REMOVE_STRATEGY.STORAGE],
        translations: {
            title: (taskRecord) => taskRecord.title,
            description: (taskRecord) => taskRecord.description,
            link: (taskRecord) => {
                const action = taskRecord.action
                if (!action) return null

                return {
                    label: action.label,
                    onClick: () => sendProgressBarAction(taskRecord.id, action.actionId),
                }
            },
        },
        canCancel: (taskRecord) => !taskRecord.disableCancel,
        calculateProgress: (taskRecord) => {
            return taskRecord.progress
        },
        onComplete: (taskRecord) => {
            console.debug('Completed third-party taskRecord', taskRecord)
        },
        onCancel: (taskRecord) => {
            console.debug('Cancelled third-party taskRecord', taskRecord)
        },
    }

    return {
        MiniAppTask: TaskUIInterface,
    }
}
