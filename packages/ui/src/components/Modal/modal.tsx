import { Modal as DefaultModal, ModalProps as DefaultModalProps } from 'antd'
import classNames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'

import { Cross } from './cross'

import { Typography } from '../Typography'


type CondoModalWidthType = 'small' | 'big' | 'fit-content'

type CondoModalProps = {
    title?: string | React.ReactElement
    open: boolean
    width?: CondoModalWidthType
    scrollX?: boolean
}

export type ModalProps = Pick<DefaultModalProps,
'children'
| 'footer'
| 'className'
| 'afterClose'
| 'maskClosable'
| 'destroyOnClose'
| 'getContainer'
| 'zIndex'
| 'onCancel'
> & CondoModalProps

const MODAL_CLASS_PREFIX = 'condo-modal'
const CONDO_MODAL_WIDTH: Readonly<Record<CondoModalWidthType, number | string>> = {
    'small': 570,
    'big': 900,
    'fit-content': 'fit-content',
}

const Modal: React.FC<ModalProps> = (props) => {
    const { children, className, title, width = 'small', scrollX = true, footer, ...rest } = props
    const contentChildrenRef = useRef<HTMLDivElement>(null)
    const [isScrolling, setIsScrolling] = useState<boolean>(false)

    const classes = classNames(
        {
            [`${MODAL_CLASS_PREFIX}-scrolling`]: isScrolling,
            [`${MODAL_CLASS_PREFIX}-fixed-width`]: !scrollX,
        },
        className,
    )

    useEffect(() => {
        // NOTE: This logic allows you to find out if the content scrolls inside the Modal
        if (!contentChildrenRef.current) return

        const targetElement = contentChildrenRef.current.parentElement
        const handleScroll = () => {
            const scrollTop = targetElement?.scrollTop
            setIsScrolling(Boolean(scrollTop))
        }
        if (contentChildrenRef.current) {
            targetElement?.addEventListener('scroll', handleScroll)
        }
        return () => {
            targetElement?.removeEventListener('scroll', handleScroll)
        }
    }, [])

    return (
        <DefaultModal
            {...rest}
            prefixCls={MODAL_CLASS_PREFIX}
            centered
            closable
            className={classes}
            closeIcon={<Cross/>}
            footer={footer || null}
            title={<Typography.Title level={3} ellipsis={{ rows: 4 }} children={title}/>}
            width={CONDO_MODAL_WIDTH[width]}
            focusTriggerAfterClose={false}
            // NOTE: this hack need for forwarding ref
            children={<div ref={contentChildrenRef} children={children} className={`${MODAL_CLASS_PREFIX}-wrapper`}/>}
        />
    )
}

export {
    Modal,
}
