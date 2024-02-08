import React, { useMemo } from 'react'

import { colors } from '@open-condo/ui/colors'


export type ProgressIndicatorStep = 'todo' | 'done' | 'waiting'

export type ProgressIndicatorProps = {
    steps: readonly [ProgressIndicatorStep, ProgressIndicatorStep?, ProgressIndicatorStep?, ProgressIndicatorStep?]
    disabled?: boolean
}

type ProgressIndicatorStepsProps = {
    stepColors: readonly string[]
}

const DisabledSVG = () => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g opacity='0.5'>
            <circle cx='14' cy='14' r='14' fill='#D0D3E5'/>
            <path fillRule='evenodd' clipRule='evenodd' d='M9.33334 12.6685C8.22877 12.6685 7.33334 13.5639 7.33334 14.6685V19.3352C7.33334 20.4398 8.22877 21.3352 9.33334 21.3352H18.6667C19.7712 21.3352 20.6667 20.4398 20.6667 19.3352V14.6685C20.6667 13.5639 19.7712 12.6685 18.6667 12.6685H18V10.6667C18 10.3333 17.6667 6.66852 14 6.66852C10.3333 6.66852 10 10.0019 10 10.6685V12.6685H9.33334ZM9.33334 14.0019C8.96515 14.0019 8.66668 14.3003 8.66668 14.6685V19.3352C8.66668 19.7034 8.96515 20.0019 9.33334 20.0019H18.6667C19.0349 20.0019 19.3333 19.7034 19.3333 19.3352V14.6685C19.3333 14.3003 19.0349 14.0019 18.6667 14.0019H9.33334ZM14 8.00185C16.3333 8.00185 16.6667 10 16.6667 10.6685V12.6685H11.3333V10.6685C11.3333 10.0019 11.6667 8.00185 14 8.00185Z' fill='#222222'/>
        </g>
    </svg>
)

const DoneSVG = () => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='14' cy='14' r='14' fill='url(#paint0_linear_8744_215)'/>
        <path fillRule='evenodd' clipRule='evenodd' d='M19.8283 9.50502C20.1017 9.77839 20.1017 10.2216 19.8283 10.495L12.495 17.8283C12.2216 18.1017 11.7784 18.1017 11.505 17.8283L8.1717 14.495C7.89833 14.2216 7.89833 13.7784 8.1717 13.505C8.44507 13.2317 8.88828 13.2317 9.16165 13.505L12 16.3434L18.8384 9.50502C19.1117 9.23166 19.5549 9.23166 19.8283 9.50502Z' fill='white'/>
        <defs>
            <linearGradient id='paint0_linear_8744_215' x1='0' y1='14' x2='28' y2='14' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
        </defs>
    </svg>
)

const WaitingSvg = () => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='14' cy='14' r='14' fill='#FFBF66'/>
        <g clipPath='url(#clip0_8744_221)'>
            <path fillRule='evenodd' clipRule='evenodd' d='M14 8C10.6863 8 7.99999 10.6863 7.99999 14C7.99999 17.3137 10.6863 20 14 20C17.3137 20 20 17.3137 20 14C20 10.6863 17.3137 8 14 8ZM6.66666 14C6.66666 9.94991 9.9499 6.66667 14 6.66667C18.0501 6.66667 21.3333 9.94991 21.3333 14C21.3333 18.0501 18.0501 21.3333 14 21.3333C9.9499 21.3333 6.66666 18.0501 6.66666 14Z' fill='#DA7F00'/>
            <path fillRule='evenodd' clipRule='evenodd' d='M14 9.33333C14.3682 9.33333 14.6667 9.63181 14.6667 10V12.9213L16.3685 12.0704C16.6978 11.9057 17.0983 12.0392 17.2629 12.3685C17.4276 12.6978 17.2941 13.0983 16.9648 13.263L14.2981 14.5963C14.0915 14.6996 13.846 14.6886 13.6495 14.5671C13.453 14.4456 13.3333 14.2311 13.3333 14V10C13.3333 9.63181 13.6318 9.33333 14 9.33333Z' fill='#DA7F00'/>
        </g>
        <defs>
            <clipPath id='clip0_8744_221'>
                <rect width='16' height='16' fill='white' transform='translate(6 6)'/>
            </clipPath>
        </defs>
    </svg>
)

const OneStepProgressSVG: React.FC<ProgressIndicatorStepsProps> = ({ stepColors }) => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='14' cy='14' r='13' stroke={stepColors[0]} strokeWidth='2'/>
    </svg>
)

const TwoStepsProgressSVG: React.FC<ProgressIndicatorStepsProps> = ({ stepColors }) => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g clipPath='url(#clip0_2016_17159)'>
            <path d='M13 2.04107C6.84047 2.54922 2 7.70933 2 14C2 20.2907 6.84047 25.4508 13 25.9589V27.9648C5.73473 27.4521 0 21.3957 0 14C0 6.60424 5.73472 0.547903 13 0.0351562V2.04107Z' fill={stepColors[1]}/>
            <path d='M28 14C28 6.60424 22.2653 0.547903 15 0.0351562V2.04107C21.1595 2.54922 26 7.70933 26 14C26 20.2907 21.1595 25.4508 15 25.9589V27.9648C22.2653 27.4521 28 21.3957 28 14Z' fill={stepColors[0]}/>
        </g>
        <defs>
            <linearGradient id='gradient-1' x1='2.50928' y1='24.5' x2='25.4905' y2='24.5' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <linearGradient id='gradient-0' x1='15' y1='14' x2='28' y2='14' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <clipPath id='clip0_2016_17159'>
                <rect width='28' height='28' fill='white'/>
            </clipPath>
        </defs>
    </svg>
)

const ThreeStepsProgressSVG: React.FC<ProgressIndicatorStepsProps> = ({ stepColors }) => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g clipPath='url(#clip0_2016_17161)'>
            <path d='M13 0.0351562C5.73472 0.547903 0 6.60424 0 14C0 16.1472 0.483383 18.1815 1.34727 20L3.08809 19C2.38949 17.4779 2 15.7844 2 14C2 7.70933 6.84047 2.54922 13 2.04107V0.0351562Z' fill={stepColors[2]}/>
            <path d='M13.9999 28C18.7574 28 22.9606 25.627 25.4905 22L23.7478 21C21.5694 24.0281 18.0149 26 13.9999 26C9.98485 26 6.43035 24.0281 4.25199 21L2.50928 22C5.03917 25.627 9.24241 28 13.9999 28Z' fill={stepColors[1]}/>
            <path d='M26 14C26 7.70933 21.1595 2.54922 15 2.04107V0.0351562C22.2653 0.547903 28 6.60424 28 14C28 16.1472 27.5166 18.1815 26.6527 20L24.9119 19C25.6105 17.4779 26 15.7844 26 14Z' fill={stepColors[0]}/>
        </g>
        <defs>
            <linearGradient id='gradient-2' x1='0.0351562' y1='21.4824' x2='13' y2='21.4824' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <linearGradient id='gradient-1' x1='2.50928' y1='24.5' x2='25.4905' y2='24.5' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <linearGradient id='gradient-0' x1='15' y1='10.0176' x2='28' y2='10.0176' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <clipPath id='clip0_2016_17161'>
                <rect width='28' height='28' fill='white'/>
            </clipPath>
        </defs>
    </svg>
)

const FourStepsProgressSVG: React.FC<ProgressIndicatorStepsProps> = ({ stepColors }) => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g clipPath='url(#clip0_3062_20849)'>
            <path d='M13 2.04107V0.0351562C6.06502 0.524592 0.524588 6.06502 0.0351562 13H2.04107C2.52201 7.1702 7.17019 2.52201 13 2.04107Z' fill={stepColors[3]}/>
            <path d='M13 27.9648V25.9589C7.17019 25.478 2.52201 20.8298 2.04107 15H0.0351562C0.524588 21.935 6.06502 27.4754 13 27.9648Z' fill={stepColors[2]}/>
            <path d='M15 25.9589V27.9648C21.935 27.4754 27.4754 21.935 27.9648 15L25.9589 15C25.478 20.8298 20.8298 25.478 15 25.9589Z' fill={stepColors[1]}/>
            <path d='M15 0.0351562V2.04107C20.8298 2.52201 25.478 7.1702 25.9589 13H27.9648C27.4754 6.06502 21.935 0.524592 15 0.0351562Z' fill={stepColors[0]}/>
        </g>
        <defs>
            <linearGradient id='gradient-3' x1='0.0351562' y1='21.4824' x2='13' y2='21.4824' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <linearGradient id='gradient-2' x1='0.0351562' y1='21.4824' x2='13' y2='21.4824' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <linearGradient id='gradient-1' x1='15' y1='21.4824' x2='27.9648' y2='21.4824' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <linearGradient id='gradient-0' x1='15' y1='6.51758' x2='27.9648' y2='6.51758' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#26C756'/>
                <stop offset='1' stopColor='#4BA2E4'/>
            </linearGradient>
            <clipPath id='clip0_3062_20849'>
                <rect width='28' height='28' fill='white'/>
            </clipPath>
        </defs>
    </svg>
)

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