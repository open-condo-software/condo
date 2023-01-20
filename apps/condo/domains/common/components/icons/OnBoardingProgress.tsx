import styled from '@emotion/styled'
import React, { useEffect, useRef } from 'react'

import { colors } from '@condo/domains/common/constants/style'
import { useOnBoardingContext } from '@condo/domains/onboarding/components/OnBoardingContext'

const Canvas = styled.canvas`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`

const CanvasSegment: React.FC<{ progress: number }> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const progressToDegrees = ( 2 * Math.PI / 100 * props.progress ) - Math.PI / 2

    useEffect(() => {
        if (canvasRef) {
            const canvasContext = canvasRef.current.getContext('2d')

            canvasContext.fillStyle = colors.sberGrey[1]
            canvasContext.fillRect(0, 0, 20, 20)

            const gradient = canvasContext.createLinearGradient(15, 0, 5, 20)

            gradient.addColorStop(0.1, colors.indigo)
            gradient.addColorStop(1, colors.turquoiseBlue)
            canvasContext.fillStyle = gradient

            canvasContext.beginPath()
            canvasContext.moveTo(10, 10)
            canvasContext.arc(10, 10, 20, -Math.PI / 2, progressToDegrees)
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
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    background-color: ${colors.sberGrey[1]};
`

export const OnBoardingProgress: React.FC = () => {
    const { progress } = useOnBoardingContext()

    return (
        <Progress>
            <CanvasSegment progress={progress || 20}/>
        </Progress>
    )
}
