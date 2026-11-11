import type { ShowProgressBarParams } from '@open-condo/bridge'
import type { IFrameMetadata } from '@open-condo/miniapp-utils/helpers/iframe'

import { ITask, LocalTaskRecord, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksLocalStorage } from '@condo/domains/common/components/tasks/storage/TasksLocalStorage'
import { useOpenMiniappModal } from '@condo/domains/miniapp/components/MiniappModalContext'

export type MiniAppTaskRecord = LocalTaskRecord & {
    action?: NonNullable<ShowProgressBarParams['action']>
    background?: NonNullable<ShowProgressBarParams['background']>
    disableCancel?: ShowProgressBarParams['disableCancel']
    sourceMetadata?: IFrameMetadata
}

type UseMiniappTaskUIInterfaceType = () => ({ MiniAppTask: ITask<MiniAppTaskRecord> })
export const useMiniappTaskUIInterface: UseMiniappTaskUIInterfaceType = () => {
    const openMiniappModal = useOpenMiniappModal()
    const TaskUIInterface: ITask<MiniAppTaskRecord> = {
        storage: new TasksLocalStorage(),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL, TASK_REMOVE_STRATEGY.STORAGE],
        translations: {
            title: (taskRecord) => taskRecord.title,
            description: (taskRecord) => taskRecord.description,
            link: (taskRecord) => {
                const action = taskRecord.action
                if (!action) return null

                if (action.type === 'link') {
                    return { label: action.label, url: action.url }
                }

                return {
                    label: action.label,
                    onClick: () => openMiniappModal?.({ ...action.modal, metadata: taskRecord.sourceMetadata }),
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
