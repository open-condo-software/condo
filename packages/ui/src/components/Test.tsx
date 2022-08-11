import React from 'react'
import { styled } from '@linaria/react'
import './Test.css'

const StyledDiv = styled.div`
  color: blue;
`

export const Test: React.FC = () => {
    return (
        <>
            <div style={{ color: 'red' }}>Div with CSS-IN-JS</div>
            <div className={'my-div'}>Div with imported css</div>
            <StyledDiv>Linaria div</StyledDiv>
            <StyledDiv className={'multi-div'} >Linaria div</StyledDiv>
        </>
    )
}