import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { Space, Typography } from 'antd'
import { colors } from '../constants/style'
import React, { useMemo } from 'react'
import styled from '@emotion/styled'
import { Button } from './Button'

const IconContainer = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${colors.lightGrey[5]};
  border-radius: 8px;
`

const StyledButton = styled(Button)`
  padding: 0;
  height: 24px;
  
  &:hover {
    .icon {
      border: 1px solid ${colors.lightGrey[6]};
      background-color: ${colors.lightGrey[6]};
    }
  }
`

interface ILinkWithIconProps {
    path: string,
    locale: string
    icon?: React.ReactNode
}

export const LinkWithIcon = (props: ILinkWithIconProps) => {
    const intl = useIntl()
    const router = useRouter()
    const handleClick = useMemo(() => {
        return () => {
            router.push(props.path)
        }
    }, [props.path])

    return (
        <StyledButton type='link' onClick={handleClick}>
            <Space size={16}>
                {props.icon && <IconContainer className='icon'>{props.icon}</IconContainer>}
                <Typography.Text className='text' style={{ fontSize: '12px' }}>
                    {intl.formatMessage({ id: props.locale })}
                </Typography.Text>
            </Space>
        </StyledButton>
    )
}
