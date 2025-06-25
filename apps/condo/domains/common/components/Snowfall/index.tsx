import React, { useState, useMemo } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { SNOWFLAKES_SETTINGS } from '@condo/domains/common/constants/featureflags'

import styles from './Snowfall.module.css'


type MinMaxType = {
    min: number
    max: number
}

type SnowflakesSettings = {
    snowflakeCount: number
    snowflakeSizePx: MinMaxType
    animationDurationSec: MinMaxType
    animationDelaySec: MinMaxType
}

function getRandomNumber (min: number, max: number): number {
    return Math.random() * (max - min) + min
}

function getInteger (value: any, defaultValue: number): number {
    if (typeof value !== 'number') return defaultValue
    if (!Number.isInteger(value)) return defaultValue
    return value
}

function generateSnowflakes ({ snowflakeCount, animationDelaySec, animationDurationSec, snowflakeSizePx }: SnowflakesSettings) {
    return Array.from({ length: snowflakeCount }).map(() => ({
        id: Math.random(),
        left: getRandomNumber(0, 100),
        sizePx: getRandomNumber(snowflakeSizePx.min, snowflakeSizePx.max),
        animationDurationSec: getRandomNumber(animationDurationSec.min, animationDurationSec.max),
        animationDelaySec: getRandomNumber(animationDelaySec.min, animationDelaySec.max),
    }))
}

const DefaultSnowfall: React.FC<{ snowflakesSettings: SnowflakesSettings }> = ({ snowflakesSettings }) => {
    const [snowflakes, setSnowflakes] = useState([])

    useDeepCompareEffect(() => {
        setSnowflakes(generateSnowflakes(snowflakesSettings))
    }, [snowflakesSettings])

    return (
        <div className={styles.snowfall}>
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className={styles.snowflake}
                    style={{
                        left: `${flake.left}vw`,
                        width: `${flake.sizePx}px`,
                        height: `${flake.sizePx}px`,
                        fontSize: `${flake.sizePx}px`,
                        animationDuration: `${flake.animationDurationSec}s`,
                        animationDelay: `${flake.animationDelaySec}s`,
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

    const snowflakeSettingsFromFeatureFlag = useFlagValue<SnowflakesSettings>(SNOWFLAKES_SETTINGS)

    // NOTE: The smaller the screen, the fewer snowflakes should be shown
    const displaySizeMultiplier = useMemo(() => {
        if (breakpoints.DESKTOP_LARGE) return 1
        if (breakpoints.DESKTOP_SMALL) return 0.8
        if (breakpoints.TABLET_LARGE) return 0.6
        if (breakpoints.TABLET_SMALL) return 0.4
        return 0.2
    }, [breakpoints])

    const snowflakeSettings: SnowflakesSettings = useMemo(() => {
        return {
            snowflakeCount: Math.ceil(
                getInteger(snowflakeSettingsFromFeatureFlag?.snowflakeCount, 0) * displaySizeMultiplier
            ),
            snowflakeSizePx: {
                min: getInteger(snowflakeSettingsFromFeatureFlag?.snowflakeSizePx?.min, 5),
                max: getInteger(snowflakeSettingsFromFeatureFlag?.snowflakeSizePx?.max, 15),
            },
            animationDurationSec: {
                min: getInteger(snowflakeSettingsFromFeatureFlag?.animationDurationSec?.min, 6),
                max: getInteger(snowflakeSettingsFromFeatureFlag?.animationDurationSec?.max, 11),
            },
            animationDelaySec: {
                min: getInteger(snowflakeSettingsFromFeatureFlag?.animationDelaySec?.min, 0),
                max: getInteger(snowflakeSettingsFromFeatureFlag?.animationDelaySec?.max, 9),
            },
        }
    }, [displaySizeMultiplier, snowflakeSettingsFromFeatureFlag])

    if (snowflakeSettings.snowflakeCount < 1) return null

    return <MemoizedSnowfall snowflakesSettings={snowflakeSettings} />
}

export const Snowfall = SnowfallWrapper
