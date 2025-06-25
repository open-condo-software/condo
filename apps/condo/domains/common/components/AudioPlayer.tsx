import { css } from '@emotion/react'
import { Select } from 'antd'
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'

import { PauseFilled, PlayFilled } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { getRedirectUrl } from '@condo/domains/common/hooks/useDownloadFileFromServer'

const { Option } = Select

const WAVE_WRAPPER_STYLE: CSSProperties = { width: '100%', height: '28px' }
const SPEED_OPTIONS: Array<number> = [0.5, 1, 1.5, 2]
const PLAYER_ROW_STYLE: CSSProperties = {
    display: 'flex',
    flexFlow: 'row',
    gap: '12px',
    alignItems: 'center',
    width: '100%',
    fontSize: '32px',
    whiteSpace: 'nowrap',
}
const WAVEFORM_CONTAINER_STYLE: CSSProperties = { flex: 'auto' }
const SELECT_STYLE: CSSProperties = { width: '75px' }

interface IAudioPlayerProps {
    src: string
    trackId: string
    autoPlay?: boolean
}

const createGradient = (): CanvasGradient => {
    if (typeof document === 'undefined') {
        return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, '#4CD174')
    gradient.addColorStop(1, '#6DB8F2')

    return gradient
}

const MAIN_SPACE_CSS = css`
  & > .condo-space-item:first-child {
    flex: auto
  }
`

export const AudioPlayer: React.FC<IAudioPlayerProps> = ({ trackId, src, autoPlay }) => {
    const intl = useIntl()
    const SpeedMessage = intl.formatMessage({ id: 'ticket.callRecord.speed' })

    const [playing, setPlaying] = useState(false)
    const [currentSeconds, setCurrentSeconds] = useState(0)
    const [totalTime, setTotalTime] = useState('00:00')
    const [speed, setSpeed] = useState(1)
    const [url, setUrl] = useState<string>()

    const waveformRef = useRef<HTMLDivElement>(null)
    const waveform = useRef(null)

    const handlePlay = useCallback(() => {
        setPlaying(!playing)

        if (waveform.current) {
            waveform.current.playPause()
        }
    }, [playing])

    const handleSpeedChange = useCallback((value: number) => {
        setSpeed(value)

        if (waveform.current) {
            if (playing) {
                waveform.current.pause()
                waveform.current.setPlaybackRate(value, true)
                waveform.current.play()
            } else {
                waveform.current.setPlaybackRate(value, true)
            }
        }
    }, [playing])

    const formatTime = useCallback((time: number): string => {
        const hours = Math.floor(time / 3600).toString().padStart(2, '0')
        const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0')
        const seconds = Math.floor(time % 60).toString().padStart(2, '0')

        if (hours === '00') {
            return `${minutes}:${seconds}`
        } else {
            return `${hours}:${minutes}:${seconds}`
        }
    }, [])

    const initWaveSurfer = useCallback(async () => {
        const WaveSurfer = (await import('wavesurfer.js')).default
        const track: HTMLMediaElement = document.querySelector(`#${trackId}`)

        waveform.current = WaveSurfer.create({
            container: waveformRef.current,
            height: 28,
            progressColor: createGradient(),
            waveColor: colors.gray[5],
            responsive: true,
            barGap: 1,
            barWidth: 2,
            barHeight: 28,
            cursorWidth: 0,
            hideScrollbar: true,
            xhr: {
                cache: 'default',
                mode: 'cors',
                method: 'GET',
                credentials: 'include',
            },
        })

        waveform.current.on('ready', () => {
            const duration = waveform.current.getDuration()
            setTotalTime(formatTime(duration))

            if (autoPlay) {
                waveform.current.play()
                setPlaying(true)
            }
        })

        waveform.current.on('audioprocess', () => {
            setCurrentSeconds(Math.floor(waveform.current.getCurrentTime()))
        })

        waveform.current.on('finish', () => {
            setPlaying(false)
        })

        waveform.current.load(track)
    }, [autoPlay, formatTime, trackId])

    useEffect(() => {
        (async () => {
            try {
                const firstResponse = await fetch(src, {
                    credentials: 'include',
                    headers: {
                        'shallow-redirect': 'true',
                    },
                })
                if (!firstResponse.ok) throw new Error('Failed to download file')

                const redirectUrl = await getRedirectUrl(firstResponse)
                await fetch(redirectUrl, {
                    credentials: 'include',
                })

                setUrl(redirectUrl)
            } catch (e) {
                console.error(e)
                setUrl(src)
            }
        })()
    }, [src])

    useEffect(() => {
        if (typeof document !== 'undefined' && self !== undefined && url) {
            initWaveSurfer()

            return () => {
                if (waveform.current) {
                    waveform.current.destroy()
                }
            }
        }
    }, [autoPlay, initWaveSurfer, trackId, url])

    if (!url) {
        return null
    }

    const PlayerIcon = playing ? PauseFilled : PlayFilled

    return (
        <Space size={40} width='100%' css={MAIN_SPACE_CSS}>
            <div style={PLAYER_ROW_STYLE}>
                <PlayerIcon color={colors.gray[7]} size='auto' onClick={handlePlay}/>
                <div style={WAVEFORM_CONTAINER_STYLE}>
                    <div id='waveform' ref={waveformRef} style={WAVE_WRAPPER_STYLE}/>
                    <audio id={trackId} src={url}/>
                </div>
                <Typography.Text size='small'>
                    {`${formatTime(currentSeconds)}/${totalTime}`}
                </Typography.Text>
            </div>
            <Space size={8}>
                <Typography.Text size='medium' type='secondary'>{SpeedMessage}</Typography.Text>
                <Select value={speed} onChange={handleSpeedChange} style={SELECT_STYLE}>
                    {
                        SPEED_OPTIONS.map((value) => (
                            <Option key={value} value={value}>{value}x</Option>
                        ))
                    }
                </Select>
            </Space>
        </Space>
    )
}
