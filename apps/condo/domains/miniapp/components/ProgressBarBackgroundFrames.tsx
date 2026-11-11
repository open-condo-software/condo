import React, { useMemo } from 'react'

import { IFRAME_METADATA_SCHEMA } from '@open-condo/miniapp-utils/helpers/iframe'

import { useTasks } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { TASK_PROCESSING_STATUS } from '@condo/domains/common/constants/tasks'
import { MiniAppTaskRecord } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'

type ProgressBarBackgroundFrameProps = Pick<MiniAppTaskRecord, 'background' | 'sourceMetadata'>

const ProgressBarBackgroundFrame: React.FC<ProgressBarBackgroundFrameProps> = ({ background, sourceMetadata }) => {
    const sourceMetadataKey = JSON.stringify(sourceMetadata)
    const metadata = useMemo(() => {
        const parsedSourceMetadata = sourceMetadataKey ? JSON.parse(sourceMetadataKey) : undefined
        const { success, data } = IFRAME_METADATA_SCHEMA.safeParse(parsedSourceMetadata)
        return success ? data : undefined
    }, [sourceMetadataKey])

    if (!background) return null

    return <B2BAppFrame hidden metadata={metadata} src={background.url}/>
}

export const ProgressBarBackgroundFrames: React.FC = () => {
    const { tasks } = useTasks<MiniAppTaskRecord>()
    const records = tasks
        .map((task) => task.record)
        .filter((task) => task.__typename === 'MiniAppTask' && task.status === TASK_PROCESSING_STATUS)

    return (
        <>
            {records.map((task) => {
                return (
                    <ProgressBarBackgroundFrame
                        key={task.id}
                        background={task.background}
                        sourceMetadata={task.sourceMetadata}
                    />
                )
            })}
        </>
    )
}
