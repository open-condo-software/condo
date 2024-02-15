import React, { useMemo } from 'react'

import {
    DisabledSVG,
    DoneSVG,
    OneStepProgressSVG,
    WaitingSvg,
    ThreeStepsProgressSVG,
    FourStepsProgressSVG,
    ProgressIndicatorStepsProps,
    TwoStepsProgressSVG,
} from './steps'

import { colors } from '../../colors'


export type ProgressIndicatorStep = 'todo' | 'done' | 'waiting'

export type ProgressIndicatorProps = {
    steps: readonly [ProgressIndicatorStep, ProgressIndicatorStep?, ProgressIndicatorStep?, ProgressIndicatorStep?]
    disabled?: boolean
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, disabled }) => {
    const filteredSteps = useMemo(() => steps.filter(step => Boolean(step)),
        [steps])
    const isAllStepsDone = useMemo(() => filteredSteps.every(step => step === 'done'),
        [filteredSteps])
    const isAllStepsWaiting = useMemo(() => filteredSteps.every(step => step === 'waiting'),
        [filteredSteps])

    if (disabled) return <DisabledSVG />
    if (isAllStepsDone) return <DoneSVG />
    if (isAllStepsWaiting) return <WaitingSvg />

    const arrayLengthToIndicator: Record<number, React.FC<ProgressIndicatorStepsProps>> = {
        1: OneStepProgressSVG,
        2: TwoStepsProgressSVG,
        3: ThreeStepsProgressSVG,
        4: FourStepsProgressSVG,
    }

    const Component = arrayLengthToIndicator[filteredSteps.length]
    const stepColors = filteredSteps.map((step, index) => {
        switch (step) {
            case 'waiting': return colors.orange[5]
            case 'done': return `url(#gradient-${index})`
            case 'todo': return colors.gray[5]
            default: return ''
        }
    })

    return <Component stepColors={stepColors} />
}

export {
    ProgressIndicator,
}