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
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: ${colors.lightGrey[5]};
  border-radius: 8px;
  margin-right: 16px;
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
            {props.icon && <IconContainer className='icon'>{props.icon}</IconContainer>}
            <Typography.Text className='text'>
                {intl.formatMessage({ id: props.locale })}
            </Typography.Text>
        </StyledButton>
    )
}
