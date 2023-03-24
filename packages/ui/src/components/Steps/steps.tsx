import classNames from 'classnames'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Carousel, CarouselRef } from '@open-condo/ui/src'

import { Step } from './step'

import { useContainerSize } from '../_utils/hooks'

import type { StepItem, StepProps } from './step'

export type StepsProps = {
    current?: number
    items: Array<StepItem>
    onChange?: (currentStep: number) => void
    itemSize?: 'large' | 'small'
}

const STEP_GAP = 24
const STEP_LG_MAX_WIDTH = 40 + 12 + 220 // index circle + gap + text
const STEP_SM_MAX_WIDTH = 32 + 12 + 200 // index circle + gap + text

const STEPS_CLASS_PREFIX = 'condo-steps'

export const Steps: React.FC<StepsProps> = ({ items, current = 0, onChange, itemSize = 'large' }) => {
    // NOTE: Internal state controls view
    const [currentItem, setCurrentItem] = useState(current)
    const [{ width }, setContainerRef] = useContainerSize<HTMLDivElement>()
    const carouselRef = useRef<CarouselRef>(null)

    const totalItems = items.length
    const stepMaxWidth = itemSize == 'small' ? STEP_SM_MAX_WIDTH : STEP_LG_MAX_WIDTH
    const stepsToShow = Math.min(totalItems, Math.max(Math.floor((width + STEP_GAP) / stepMaxWidth), 1))

    const className = classNames(STEPS_CLASS_PREFIX, {
        [`${STEPS_CLASS_PREFIX}-${itemSize}`]: itemSize,
    })

    // NOTE: Sync internal state with prop, limiting it to [0; items.length)
    useEffect(() => {
        const rightBorder = Math.max(totalItems - 1, 0)
        setCurrentItem(Math.max(0, Math.min(rightBorder, current)))
    }, [current, totalItems])

    // NOTE: Sliding to last slide in carousel will require multiple prev button clicks to go back
    // So, we're limiting it to first slide in a row:
    // [X . . .]
    useEffect(() => {
        const maxAllowedSlide = totalItems - stepsToShow
        carouselRef.current?.goTo(Math.min(maxAllowedSlide, currentItem))
    }, [currentItem, totalItems, stepsToShow])

    useEffect(() => {
        if (onChange) {
            onChange(currentItem)
        }
    }, [currentItem, onChange])

    const handleStepClick = useCallback((idx: number) => {
        return function onClick () {
            setCurrentItem(idx)
        }
    }, [])

    const steps = useMemo(() => {
        const modifiedItems: Array<StepItem & { previousBreakPoint: number }> = []
        for (let i = 0; i < items.length; i++) {
            if (i === 0) {
                modifiedItems.push({ ...items[i], previousBreakPoint: -1 })
            } else {
                const previousBreakPoint = items[i - 1].breakPoint ? i - 1 : modifiedItems[i - 1].previousBreakPoint
                modifiedItems.push({ ...items[i], previousBreakPoint })
            }
        }

        return modifiedItems
    }, [items])

    return (
        <div className={className} ref={setContainerRef}>
            <Carousel
                infinite={false}
                dots={false}
                slidesToShow={stepsToShow}
                ref={carouselRef}
                controlsSize={itemSize}
            >
                {steps.map((step, idx) => {
                    let type: StepProps['type']  = 'active'
                    if (idx > currentItem) {
                        type = 'disabled'
                    }
                    if (idx <= steps[currentItem].previousBreakPoint) {
                        type = 'done'
                    }

                    const onClick = type == 'active' ? handleStepClick(idx) : undefined

                    return (
                        <Step
                            key={idx}
                            title={step.title}
                            index={idx + 1}
                            size={itemSize}
                            type={type}
                            onClick={onClick}
                        />
                    )
                })}
            </Carousel>
        </div>
    )
}