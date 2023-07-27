import styled from '@emotion/styled'
import { Space, Typography } from 'antd'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { ChevronIcon } from '@condo/domains/common/components/icons/ChevronIcon'

import { colors } from '../constants/style'

type ChevronIconWrapperProps = {
    direction: 'down' | 'up',
}

const ChevronIconWrapper = styled.div<ChevronIconWrapperProps>`
    transform: rotate(${props => props.direction === 'down' ? 0 : 180}deg);
    display: flex;
`

const SHOW_MORE_BUTTON_STYLE = { padding: 0, backgroundColor: 'transparent' }

export const ShowMoreFieldsButton = ({ isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed }) => {
    const intl = useIntl()
    const MoreParametersMessage = intl.formatMessage({ id: 'moreParameters' })
    const LessParametersMessage = intl.formatMessage({ id: 'lessParameters' })

    const handleShowMoreButtonClick = useCallback(() => setIsAdditionalFieldsCollapsed(isCollapsed => !isCollapsed)
        , [setIsAdditionalFieldsCollapsed])

    return (
        <Button
            type='text'
            color={colors.black}
            onClick={handleShowMoreButtonClick}
            style={SHOW_MORE_BUTTON_STYLE}
        >
            <Typography.Text strong>
                <Space direction='horizontal' align='center'>
                    {isAdditionalFieldsCollapsed ? MoreParametersMessage : LessParametersMessage}
                    <ChevronIconWrapper direction={isAdditionalFieldsCollapsed ? 'down' : 'up'}>
                        <ChevronIcon />
                    </ChevronIconWrapper>
                </Space>
            </Typography.Text>
        </Button>
    )
}

