import styled from '@emotion/styled'
import React, { useEffect, useRef } from 'react'
import { colors } from '@condo/domains/common/constants/style'

const Canvas = styled.canvas`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`

const CanvasSegment: React.FC<{ progress: number }> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const progressToDegrees = 360 / 100 * props.progress

    useEffect(() => {
        const rad = Math.PI / 180

        if (canvasRef) {
            const canvasContext = canvasRef.current.getContext('2d')
            canvasContext.fillStyle = colors.sberGrey[1]
            canvasContext.fillRect(0, 0, 20, 20)

            const gradient = canvasContext.createLinearGradient(15, 0, 5, 20)

            gradient.addColorStop(0.1, '#5473C3')
            gradient.addColorStop(1, '#6BEAC7')
            canvasContext.fillStyle = gradient

            canvasContext.beginPath()
            canvasContext.moveTo(10, 10)
            canvasContext.arc(10, 10, 20, -Math.PI / 2, (progressToDegrees * rad) - Math.PI / 2)
            canvasContext.fill()
        }
    }, [canvasRef, props.progress])


    return (
        <Canvas ref={canvasRef} width='20' height='20'/>
    )
}

const Progress = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    position: relative;
    background-color: ${colors.sberGrey[1]};
`

export const OnBoardingProgress: React.FC = (props) => {
    // TODO(Dimitreee): get progress from backend/clientSide context

    const progress = 40

    return (
        <Progress>
            <CanvasSegment progress={progress}/>
        </Progress>
    )
}
