import React, { useState, useMemo, useEffect } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { SNOWFLAKES_COUNT } from '@condo/domains/common/constants/featureflags'

import './Snowfall.css'


const generateSnowflakes = (snowflakeCount: number) =>
    Array.from({ length: snowflakeCount }).map(() => ({
        id: Math.random(),
        left: Math.random() * 100,
        size: Math.random() * 10 + 5,
        animationDuration: Math.random() * 5 + 6,
        animationDelay: Math.random() * 9,
    }))

const DefaultSnowfall: React.FC<{ snowflakeCount?: number }> = ({ snowflakeCount = 50 }) => {
    const [snowflakes, setSnowflakes] = useState([])

    useEffect(() => {
        setSnowflakes(generateSnowflakes(snowflakeCount))
    }, [snowflakeCount])

    if (typeof window === 'undefined') return null

    return (
        <div className='snowfall'>
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className='snowflake'
                    style={{
                        left: `${flake.left}vw`,
                        width: `${flake.size}px`,
                        height: `${flake.size}px`,
                        fontSize: `${flake.size}px`,
                        animationDuration: `${flake.animationDuration}s`,
                        animationDelay: `${flake.animationDelay}s`,
                    }}
                >
                    ❄️
                </div>
            ))}
        </div>
    )
}

const MemoizedSnowfall = React.memo(DefaultSnowfall)

const SnowfallWrapper: React.FC = () => {
    const { useFlagValue } = useFeatureFlags()
    const { breakpoints } = useLayoutContext()

    const snowflakeCountFromFeatureFlag = useFlagValue(SNOWFLAKES_COUNT) || 0
    const snowflakesCount = useMemo(() => {
        if (!snowflakeCountFromFeatureFlag
            || typeof snowflakeCountFromFeatureFlag !== 'number'
            || !Number.isInteger(snowflakeCountFromFeatureFlag)
            || snowflakeCountFromFeatureFlag < 1
            || snowflakeCountFromFeatureFlag > 500
        ) return 0

        // NOTE: The smaller the screen, the fewer snowflakes should be shown
        if (breakpoints.DESKTOP_LARGE) return snowflakeCountFromFeatureFlag
        if (breakpoints.DESKTOP_SMALL) return Math.ceil(snowflakeCountFromFeatureFlag * 0.8)
        if (breakpoints.TABLET_LARGE) return Math.ceil(snowflakeCountFromFeatureFlag * 0.6)
        if (breakpoints.TABLET_SMALL) return Math.ceil(snowflakeCountFromFeatureFlag * 0.4)
        return Math.ceil(snowflakeCountFromFeatureFlag * 0.2)
    }, [breakpoints, snowflakeCountFromFeatureFlag])

    if (snowflakesCount < 1) return null

    return <MemoizedSnowfall snowflakeCount={snowflakesCount} />
}

export const Snowfall = SnowfallWrapper
