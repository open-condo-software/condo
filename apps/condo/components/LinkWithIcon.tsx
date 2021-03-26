import { useRouter } from 'next/router'
import { Space, Typography } from 'antd'
import { colors } from '../constants/style'
import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { Button } from './Button'

const IconContainer = styled.div`
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: ${colors.lightGrey[5]};
  border-radius: 8px;
`

const StyledButton = styled(Button)`
  border: none;
  padding: 0;
  height: 24px;
  box-sizing: border-box;
  font-size: 12px;

  &:hover {
    .icon {
      background-color: ${colors.lightGrey[6]};
    }
  }
`

interface ILinkWithIconProps {
    path: string,
    icon?: React.ReactNode
    children?: React.ReactNode
}

export const LinkWithIcon: React.FC<ILinkWithIconProps> = (props: ILinkWithIconProps) => {
    const router = useRouter()
    const handleClick = useCallback(() => {
        router.push(props.path)
    }, [props.path])

    return (
        <StyledButton type='link' onClick={handleClick}>
            <Space size={16}>
                {props.icon && <IconContainer className='icon'>{props.icon}</IconContainer>}
                <Typography.Text className='text'>
                    {props.children}
                </Typography.Text>
            </Space>
        </StyledButton>
    )
}
