import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { Modal as AntdModal, ModalProps as AntdModalProps, Typography } from 'antd'
import isString from 'lodash/isString'

import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { CrossIcon } from '@condo/domains/common/components/icons/CrossIcon'

interface StyledModalProps {
    isScrolling?: boolean
}

const StyledModal = styled(AntdModal)<StyledModalProps>`
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
    padding: 40px 104px 19px 40px;
    border-bottom: 1px solid transparent;
    border-bottom-color: ${({ isScrolling }) => isScrolling ? colors.backgroundWhiteSecondary : 'transparent'};
  }
  
  .ant-modal-body {
    overflow: auto;
    overflow: overlay; // scrollbar does not reduce content width. Not supported in all browsers
    padding: 20px 40px 40px 40px;
  }
  
  .ant-modal-footer {
    flex-shrink: 0;
    padding: 19px 40px 20px;
    border-top: 1px solid ${colors.backgroundWhiteSecondary};
  }
`

type ModalProps = AntdModalProps & {
    titleText?: string
}

const TITLE_STYLE: React.CSSProperties = { fontWeight: 700, fontSize: fontSizes.large, lineHeight: '28px' }

export const Modal: React.FC<ModalProps> = ({ children, title, titleText, width = 570, ...otherProps }) => {
    const contentChildrenRef = useRef<HTMLDivElement>()
    const [isScrolling, setIsScrolling] = useState<boolean>(false)

    const Title = useMemo(() => {
        if (titleText) {
            return <Typography.Title level={3} style={TITLE_STYLE}>{titleText}</Typography.Title>
        }
        if (isString(title)) {
            return <Typography.Title level={3} style={TITLE_STYLE}>{title}</Typography.Title>
        }
        return title
    }, [title, titleText])

    useEffect(() => {
        if (!contentChildrenRef.current) return

        const targetElement = contentChildrenRef.current.parentElement
        const handler = () => {
            const scrollTop = targetElement.scrollTop
            setIsScrolling(Boolean(scrollTop))
        }
        if (contentChildrenRef.current) {
            targetElement.addEventListener('scroll', handler)
        }
        return () => {
            targetElement.removeEventListener('scroll', handler)
        }
    }, [])

    return (
        <StyledModal
            centered
            closeIcon={<CrossIcon />}
            title={Title}
            width={width}
            isScrolling={isScrolling}

            // this hack need for forwarding ref
            forceRender
            children={<div ref={contentChildrenRef}>{children}</div>}
            {...otherProps}
        />
    )
}