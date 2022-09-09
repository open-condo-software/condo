import React, { useMemo } from 'react'
import styled from '@emotion/styled'
import { Modal as AntdModal, ModalProps as AntdModalProps, Typography } from 'antd'
import isString from 'lodash/isString'
import isNumber from 'lodash/isNumber'

import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { CrossIcon } from '@condo/domains/common/components/icons/CrossIcon'

type StyledModalProps = AntdModalProps & {
    maxWidth?: string
}

const StyledModal = styled(AntdModal)<StyledModalProps>`
  max-width: ${({ maxWidth }) => maxWidth};
  margin: 40px 0;
    
  button.ant-modal-close {
    top: 42px;
    right: 40px;
    
    .ant-modal-close-x {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .ant-modal-content {
    padding: 0;
    max-height: calc(100vh - 80px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
    
  .ant-modal-header {    
    flex-shrink: 0;
    border-bottom: none;
    padding: 40px 40px 20px;
    
    .ant-typography {
      width: calc(100% - 40px);
      font-weight: 700;
      font-size: ${fontSizes.large};
      line-height: 28px;
    }
  }
    
  .ant-modal-body {
    overflow: auto;
    overflow: overlay; // scrollbar does not reduce content width. Not supported in all browsers
    padding: 20px 40px 40px 40px;
  }
  
  .ant-modal-footer {
    flex-shrink: 0;
    padding: 20px 40px;
    border-top: 1px solid ${colors.backgroundWhiteSecondary};
  }
`

type ModalProps = AntdModalProps & {
    titleText?: string
}

export const Modal: React.FC<ModalProps> = ({ title, titleText, width = 570, ...otherProps }) => {
    const Title = useMemo(() => {
        if (titleText) {
            return <Typography.Title level={3}>{titleText}</Typography.Title>
        }
        if (isString(title)) {
            return <Typography.Title level={3}>{title}</Typography.Title>
        }
        return title
    }, [title, titleText])

    const maxWidth = useMemo(() => {
        return isNumber(width) ? `${width}px` : width
    }, [width])

    return (
        <StyledModal
            centered
            closeIcon={<CrossIcon />}
            title={Title}
            maxWidth={maxWidth}
            width={null}
            {...otherProps}
        />
    )
}