import styled from '@emotion/styled'
import { Input  } from 'antd'
import { TextAreaProps } from 'antd/es/input'
import React from 'react'

import { colors } from '@open-condo/ui/colors'


const StyledTextArea = styled(Input.TextArea)`
  &.ant-input-textarea-show-count::after {
    position: relative;
    bottom: 38px;
    right: 10px;
    background-color: ${colors.gray[7]};
    color: ${colors.white};
    border-radius: 14px;
    padding: 2px 10px;
    font-weight: 600;
  }

  textarea {
    padding-bottom: 44px;
  }
`

// TODO(DOMA-8953): move to UI kit
export const TextArea: React.FC<TextAreaProps> = (props) => {
    return (
        <StyledTextArea
            autoSize={{ minRows: 3 }}
            maxLength={1000}
            {...props}
            showCount={{
                formatter: ({ count, maxLength }) => {
                    return `${count}/${maxLength}`
                },
            }}
        />
    )
}
