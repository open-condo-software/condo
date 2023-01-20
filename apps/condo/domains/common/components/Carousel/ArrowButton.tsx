import styled from '@emotion/styled'
import React, { useMemo } from 'react'

import { colors, shadows } from '@condo/domains/common/constants/style'

import { ArrowBoldRight } from '../icons/ArrowBold'

interface ArrowButtonTypeProp {
    type: 'next' | 'prev'
}

interface ArrowButtonProps extends React.HTMLAttributes<HTMLDivElement>, ArrowButtonTypeProp {}

interface ArrowCircleProps extends ArrowButtonProps {
    isDisabled: boolean,
}

const ArrowCircle = styled.div<ArrowCircleProps>`
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  margin-top: -20px;
  width: 40px;
  height: 40px;
  border: 1px solid ${colors.backgroundWhiteSecondary};
  border-radius: 50%;
  display: ${(props) => props.isDisabled ? 'none' : 'flex'};
  justify-content: center;
  align-items: center;
  box-shadow: ${shadows.main};
  background: ${colors.white};
  cursor: pointer;
  ${(props) => props.type === 'next' ? 'right' : 'left'}: -32px;
  transition-property: color, border;
  transition-duration: .3s;
  transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1);
  z-index: 9;
  &:hover {
    border: 1px solid ${colors.blue[4]};
    color: ${colors.blue[4]};
  }
`

const IconHolder = styled.div<ArrowButtonTypeProp>`
  ${(props) => props.type === 'next' ? 'margin-left' : 'margin-right'}: 2px;
  transform: rotate(${(props) => props.type === 'next' ? 0 : 180}deg);
  
`

export const ArrowButton: React.FC<ArrowButtonProps> = (props) => {
    const { className, onClick, type } = props
    const isDisabled = useMemo(() => {
        if (!className) return true
        return className.split(' ').includes('slick-disabled')
    }, [className])

    return (
        <ArrowCircle onClick={onClick} isDisabled={isDisabled} type={type}>
            <IconHolder type={type}>
                <ArrowBoldRight/>
            </IconHolder>
        </ArrowCircle>
    )
}