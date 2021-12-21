import { Space, Typography } from 'antd'
import { ChevronIcon } from '@condo/domains/common/components/icons/ChevronIcon'
import React, { useCallback, useState } from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { colors } from '../constants/style'

type ChevronIconWrapperProps = {
    direction: 'down' | 'up',
}

const ChevronIconWrapper = styled.div<ChevronIconWrapperProps>`
    transform: rotate(${props => props.direction === 'down' ? 0 : 180}deg);
    display: flex;
`

const SHOW_MORE_BUTTON_STYLE = { padding: 0 }

export const useShowMoreFieldsButton = () => {
    const intl = useIntl()
    const MoreParametersMessage = intl.formatMessage({ id: 'MoreParameters' })
    const LessParametersMessage = intl.formatMessage({ id: 'LessParameters' })

    const [isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed] = useState<boolean>(true)
    const handleShowMoreButtonClick = useCallback(() => { setIsAdditionalFieldsCollapsed(isCollapsed => !isCollapsed) }, [])

    const ShowMoreFieldsButton = useCallback(() => (
        <Button
            type="text"
            color={colors.black}
            onClick={handleShowMoreButtonClick}
            style={SHOW_MORE_BUTTON_STYLE}
        >
            <Typography.Text strong>
                <Space direction={'horizontal'} align={'center'}>
                    {isAdditionalFieldsCollapsed ? MoreParametersMessage : LessParametersMessage}
                    <ChevronIconWrapper direction={isAdditionalFieldsCollapsed ? 'down' : 'up'}>
                        <ChevronIcon />
                    </ChevronIconWrapper>
                </Space>
            </Typography.Text>
        </Button>
    ), [LessParametersMessage, MoreParametersMessage, handleShowMoreButtonClick, isAdditionalFieldsCollapsed])

    return { ShowMoreFieldsButton, isAdditionalFieldsCollapsed }
}

