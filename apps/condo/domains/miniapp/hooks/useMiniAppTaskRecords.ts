import dayjs from 'dayjs'
import { useMemo } from 'react'

import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'

type MiniAppTaskUIInterfaceType = ReturnType<typeof useMiniappTaskUIInterface>['MiniAppTask']
type MiniAppTaskUser = Parameters<MiniAppTaskUIInterfaceType['storage']['useTasks']>[1]

export function useMiniAppTaskRecords (user: MiniAppTaskUser | null) {
    const { MiniAppTask: MiniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const { records: processingTasks, loading } = MiniAppTaskUIInterface.storage.useTasks(
        { status: 'processing' },
        user,
    )
    const records = useMemo(
        () => processingTasks.filter((task) => task.processingFrame || dayjs(task.createdAt).isToday()),
        [processingTasks],
    )

    return { MiniAppTaskUIInterface, records, loading }
}
