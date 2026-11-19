import React, { useCallback, useMemo } from 'react'

import { IFRAME_METADATA_SCHEMA } from '@open-condo/miniapp-utils/helpers/iframe'

import { useTasks } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { TASK_PROCESSING_STATUS } from '@condo/domains/common/constants/tasks'
import { MiniAppTaskRecord } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'

import { useProgressBarActions } from './ProgressBarActionsContext'

type ProgressBarBackgroundFrameProps = Pick<MiniAppTaskRecord, 'id' | 'processingFrame' | 'sourceMetadata'>

const ProgressBarBackgroundFrame: React.FC<ProgressBarBackgroundFrameProps> = ({ processingFrame, id, sourceMetadata }) => {
    const { registerProgressBarFrame } = useProgressBarActions()
    const sourceMetadataKey = JSON.stringify(sourceMetadata)
    const metadata = useMemo(() => {
        const parsedSourceMetadata = sourceMetadataKey ? JSON.parse(sourceMetadataKey) : undefined
        const { success, data } = IFRAME_METADATA_SCHEMA.safeParse(parsedSourceMetadata)
        return success ? data : undefined
    }, [sourceMetadataKey])

    const onRegister = useCallback((event) => registerProgressBarFrame(id, event), [id, registerProgressBarFrame])

    if (!processingFrame) return null

    return <B2BAppFrame hidden metadata={metadata} src={processingFrame.url} onRegister={onRegister}/>
}

export const ProgressBarBackgroundFrames: React.FC = () => {
    const { tasks } = useTasks<MiniAppTaskRecord>()
    const records = tasks
        .map((task) => task.record)
        .filter((task) => task.__typename === 'MiniAppTask' && (task.status === TASK_PROCESSING_STATUS || task.actions?.length))

    return (
        <>
            {records.map((task) => {
                return (
                    <ProgressBarBackgroundFrame
                        key={task.id}
                        processingFrame={task.processingFrame}
                        id={task.id}
                        sourceMetadata={task.sourceMetadata}
                    />
                )
            })}
        </>
    )
}
