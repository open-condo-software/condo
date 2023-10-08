import styled from '@emotion/styled'
import { Tabs } from 'antd'
import { Col } from 'antd'
import React, { useState, useEffect, useRef } from 'react'

import { ChevronRight } from '@open-condo/icons'
import { colors } from '@open-condo/ui/dist/colors'

import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'

export const StyledTabs = styled(Tabs)`
    > .condo-tabs-nav {
        margin: 0;
        height: 46px;

        .condo-tabs-ink-bar {
          display: none;
        }

        .condo-tabs-tab {
          padding: 12px;
          border: 1px solid ${colors.gray[3]};
          border-radius: 1000px;
  
          &.condo-tabs-tab-active {
            background-color: ${colors.gray[3]};
            transition: background-color 0.3s ease-out;
          }

          & + .condo-tabs-tab {
            margin-left: 8px;
          }

          & .condo-tabs-tab-label {
            font-size: 14px;
            line-height: 22px;
          }
        }
      .condo-tabs-nav-operations {
        display: none;
      }
    }
`

interface Template {
    key: string
    label: string
}

interface INewsFormProps {
    onChange?: (value: string) => void
    items: Template[]
}

const TABS_CLASS_PREFIX = 'condo-tabs'
const CONTROL_PREFIX = 'condo-control'
const PIXEL_SPEED = 40

function getTabsPane (): HTMLElement {
    return document.querySelector('.condo-tabs-nav-list')
}
function getTabsWrap (): HTMLElement {
    return document.querySelector('.condo-tabs-nav-wrap')
}

export const TemplatesTabs: React.FC<INewsFormProps> = ({ items, onChange }) => {

    const [translateTabs, setTranslateTabs] = useState(0)
    const [isPressed, setIsPressed] = useState(false)
    const [leftButton, setLeftButton] = useState(false)
    const [rightButton, setRightButton] = useState(false)
    const [isTabsWidthLarger, setIsTabsWidthLarger] = useState(false)
    const maxPxTranform = useRef(0)
    const pressedSide = useRef(null)
    const tabsOffsetWidth = useRef(0)
    const tabsDiv = useRef(null)
    const tabsWrapDiv = useRef(null)

    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()

    useEffect(() => {
        tabsDiv.current = getTabsPane()
        tabsWrapDiv.current =  getTabsWrap()
        tabsOffsetWidth.current = tabsDiv.current.offsetWidth
    }, [])

    useEffect(() => {
        if (width < tabsOffsetWidth.current) {
            setIsTabsWidthLarger(true)
        } else {
            setIsTabsWidthLarger(false)
        }
    }, [width])

    useEffect(() => {
        let intervalId

        const incrementTabs = () => {
            setTranslateTabs(prevTranslateTabs => {
                if (prevTranslateTabs + PIXEL_SPEED > maxPxTranform.current)
                    return maxPxTranform.current
                return prevTranslateTabs + PIXEL_SPEED
            })
        }

        const decrementTabs = () => {
            setTranslateTabs(prevTranslateTabs => {
                if (prevTranslateTabs - PIXEL_SPEED < 0)
                    return 0
                return prevTranslateTabs - PIXEL_SPEED
            })
        }

        if (isPressed && pressedSide.current) {
            if (pressedSide.current === 'right')
                intervalId = setInterval(incrementTabs, 100)
            if (pressedSide.current === 'left')
                intervalId = setInterval(decrementTabs, 100)
        }

        return () => {
            clearInterval(intervalId)
        }
    }, [isPressed])

    useEffect(() => {
        if (!tabsDiv.current || !tabsWrapDiv.current) return

        maxPxTranform.current = tabsOffsetWidth.current - tabsWrapDiv.current.offsetWidth
        if (!isTabsWidthLarger) {
            setRightButton(false)
            setLeftButton(false)
            return
        }

        tabsDiv.current.style.transform = `translate(-${translateTabs}px, 0px)`

        if (maxPxTranform.current === translateTabs) {
            if (rightButton) {
                setRightButton(false)
                pressedSide.current = null
                setIsPressed(false)
            }
        } else {
            setRightButton(true)
        }

        if (translateTabs === 0) {
            if (leftButton) {
                setLeftButton(false)
                pressedSide.current = null
                setIsPressed(false)
            }
        } else {
            setLeftButton(true)
        }
    }, [isTabsWidthLarger, translateTabs])

    const handleMouseDown = (side) => () => {
        pressedSide.current = side
        setIsPressed(true)
    }

    const handleMouseUp = () => {
        pressedSide.current = null
        setIsPressed(false)
    }

    const itemsWithIcons = items.map(item => ({
        ...item,
        label: (
            <div className={`${TABS_CLASS_PREFIX}-tab-label`}>
                <span>{item.label}</span>
            </div>
        ),
    }))
    return (
        <Col ref={setRef}>
            <StyledTabs
                prefixCls='condo-tabs'
                onChange={onChange}
                items={itemsWithIcons}
                tabBarExtraContent={
                    {
                        right: rightButton &&
                        <div
                            style={{ cursor: 'pointer', justifyContent: 'center' }}
                            className={`${CONTROL_PREFIX} ${CONTROL_PREFIX}-next ${CONTROL_PREFIX}-large`}
                            onMouseDown={handleMouseDown('right')}
                            onMouseUp={handleMouseUp}>
                            <ChevronRight size='medium'/>
                        </div>,
                        left: leftButton &&
                        <div
                            style={{ cursor: 'pointer', justifyContent: 'center' }}
                            className={`${CONTROL_PREFIX} ${CONTROL_PREFIX}-prev ${CONTROL_PREFIX}-large`}
                            onMouseDown={handleMouseDown('left')}
                            onMouseUp={handleMouseUp}>
                            <ChevronRight size='medium'/>
                        </div>,
                    }
                }
            />
        </Col>
    )
}
