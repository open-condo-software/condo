import styled from '@emotion/styled'
import { Col, Row, Select } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

import { Pause, Play } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

const { Option } = Select

const StyledSelect = styled(Select)`
    .ant-select-selector {
      border: none !important;
      box-shadow: none !important;
      
      .ant-select-selection-item {
        font-size: 14px;
      }
    }
`

const PLAYER_ROW_GUTTER: [Gutter, Gutter] = [40, 0]
const RECORD_ROW_GUTTER: [Gutter, Gutter] = [12, 0]
const SPEED_ROW_GUTTER: [Gutter, Gutter] = [8, 0]
const PLAYER_ICON_WRAPPER_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' }
const WAVE_WRAPPER_STYLE: CSSProperties = { width: '100%', height: '28px' }

interface IAudioPlayerProps {
    src: string
    trackId: string
    autoPlay?: boolean
}

export const AudioPlayer: React.FC<IAudioPlayerProps> = ({ trackId, src, autoPlay }) => {
    const intl = useIntl()
    const SpeedMessage = intl.formatMessage({ id: 'ticket.callRecord.speed' })

    const [playing, setPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState('00:00')
    const [totalTime, setTotalTime] = useState('00:00')
    const [speed, setSpeed] = useState(1)
    const waveformRef = useRef<HTMLDivElement>(null)
    const waveform = useRef<WaveSurfer>()

    useEffect(() => {
        if (typeof window !== 'undefined') {
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
            })

            waveform.current.on('ready', () => {
                setTotalTime(formatTime(waveform.current.getDuration()))

                if (autoPlay) {
                    waveform.current.play()
                    setPlaying(true)
                }
            })

            waveform.current.on('audioprocess', () => {
                setCurrentTime(formatTime(waveform.current.getCurrentTime()))
            })

            waveform.current.on('finish', () => {
                setPlaying(false)
            })

            waveform.current.load(track)

            return () => {
                if (waveform.current) {
                    waveform.current.destroy()
                }
            }
        }
    }, [])

    const handlePlay = () => {
        setPlaying(!playing)
        waveform.current.playPause()
    }

    const handleSpeedChange = (value: number) => {
        setSpeed(value)
        waveform.current.setPlaybackRate(value)
    }

    const PlayerIcon = playing ? Pause : Play

    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60).toString().padStart(2, '0')
        const seconds = Math.floor(time % 60).toString().padStart(2, '0')
        return `${minutes}:${seconds}`
    }

    const createGradient = (): CanvasGradient => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
        gradient.addColorStop(0, '#4CD174')
        gradient.addColorStop(1, '#6DB8F2')

        return gradient
    }

    return (
        <Row gutter={PLAYER_ROW_GUTTER} align='middle'>
            <Col span={18}>
                <Row gutter={RECORD_ROW_GUTTER} align='middle'>
                    <Col span={2} style={PLAYER_ICON_WRAPPER_STYLE}>
                        <PlayerIcon color={colors.gray[7]} onClick={handlePlay} />
                    </Col>
                    <Col span={18}>
                        <div id='waveform' ref={waveformRef} style={WAVE_WRAPPER_STYLE} />
                        <audio id={trackId} src={src} />
                    </Col>
                    <Col span={4}>
                        <Typography.Text size='small'>
                            {`${currentTime}/${totalTime}`}
                        </Typography.Text>
                    </Col>
                </Row>
            </Col>
            <Col span={6}>
                <Row gutter={SPEED_ROW_GUTTER} align='middle' justify='end'>
                    <Col>
                        <Typography.Text size='medium' type='secondary'>{SpeedMessage}</Typography.Text>
                    </Col>
                    <Col>
                        <StyledSelect value={speed} onChange={handleSpeedChange}>
                            <Option value={0.5}>0.5x</Option>
                            <Option value={1}>1x</Option>
                            <Option value={1.5}>1.5x</Option>
                            <Option value={2}>2x</Option>
                        </StyledSelect>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
