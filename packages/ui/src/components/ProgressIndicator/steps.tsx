import React from 'react'


export type ProgressIndicatorStepsProps = {
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

const FiveStepsProgressSVG: React.FC<ProgressIndicatorStepsProps> = ({ stepColors }) => (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g clipPath='url(#clip0_10964_2180)'>
            <path fillRule='evenodd' clipRule='evenodd' d='M4.23193 24.0292C4.70955 24.4944 5.22157 24.9266 5.76486 25.3218L6.93837 23.7084C5.09609 22.3684 3.67311 20.5318 2.83564 18.4133C1.9984 16.2953 1.7809 13.9829 2.20852 11.7459C2.20863 11.7453 2.20875 11.7447 2.20887 11.7441L0.24941 11.3692C0.123167 12.029 0.0450591 12.6945 0.0146083 13.3606C-0.0753578 15.3283 0.250668 17.3008 0.980338 19.1467C1.71001 20.9925 2.82082 22.6548 4.23193 24.0292Z' fill={stepColors[4]} />
            <path fillRule='evenodd' clipRule='evenodd' d='M1.44493 7.80563C2.31648 6.03913 3.5546 4.46936 5.08499 3.20544C6.61539 1.94151 8.39087 1.02241 10.2903 0.500442C10.9328 0.323877 11.5895 0.192754 12.2556 0.109098C12.256 0.109048 12.2564 0.108998 12.2568 0.108948L12.5052 2.08842C10.2449 2.37207 8.11188 3.29301 6.35538 4.74366C4.59889 6.19432 3.2914 8.1148 2.58564 10.2808L0.688797 9.66275C0.689007 9.66211 0.689217 9.66146 0.689427 9.66082C0.897437 9.02274 1.15023 8.40294 1.44493 7.80563Z' fill={stepColors[3]} />
            <path fillRule='evenodd' clipRule='evenodd' d='M21.0514 23.7159C21.0502 23.7167 21.049 23.7176 21.0479 23.7184C19.2049 25.0549 17.0199 25.8399 14.7476 25.9817C12.474 26.1236 10.2069 25.6156 8.21114 24.5171L7.24915 26.2648C7.83769 26.5888 8.44648 26.8687 9.0705 27.1034C10.9142 27.797 12.8909 28.0964 14.8719 27.9728C16.8529 27.8492 18.777 27.3064 20.5202 26.389C21.1102 26.0785 21.6795 25.7251 22.2232 25.3305L21.0514 23.7159Z' fill={stepColors[2]} />
            <path fillRule='evenodd' clipRule='evenodd' d='M25.4184 10.2931C26.1218 12.4599 26.1942 14.7821 25.6271 16.9884C25.0605 19.193 23.8788 21.191 22.2199 22.7494C22.2186 22.7507 22.2172 22.752 22.2158 22.7533L23.5811 24.208C24.0709 23.7482 24.5251 23.2556 24.9411 22.7345C26.1701 21.1951 27.0652 19.4074 27.5593 17.4851C28.0534 15.5627 28.1312 13.5649 27.7969 11.6237C27.6837 10.9666 27.5233 10.3161 27.3159 9.67709L25.4184 10.2931Z' fill={stepColors[1]} />
            <path fillRule='evenodd' clipRule='evenodd' d='M14 1.995C16.2781 1.995 18.5091 2.64318 20.4326 3.86384C22.3556 5.08422 23.8918 6.82645 24.8618 8.88711C24.862 8.88758 24.8622 8.88805 24.8624 8.88852L26.6676 8.03909C26.6669 8.03761 26.6662 8.03613 26.6655 8.03465C26.3799 7.42837 26.0524 6.84574 25.6861 6.29057C24.6014 4.64633 23.1774 3.24294 21.5016 2.17941C19.8257 1.11587 17.9496 0.424993 16 0.143586C15.3401 0.0483378 14.6718 0 14 0V1.995Z' fill={stepColors[0]}/>
        </g>
        <defs>
            <clipPath id='clip0_10964_2180'>
                <rect width='28' height='28' fill='white'/>
            </clipPath>
        </defs>
    </svg>
)


export {
    DisabledSVG,
    DoneSVG,
    WaitingSvg,
    OneStepProgressSVG,
    TwoStepsProgressSVG,
    ThreeStepsProgressSVG,
    FourStepsProgressSVG,
    FiveStepsProgressSVG,
}