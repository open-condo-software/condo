import styled from '@emotion/styled'
import { Tabs } from 'antd'
import React from 'react'

import { colors, fontSizes, shadows } from '@condo/domains/common/constants/style'

import { StarIcon } from './icons/Star'
import { ITrackingComponent, TrackingEventType, useTracking } from './TrackingContext'

const IconWrapper = styled.span`
  display: flex;
  justify-items: center;
  align-items: center;
`

export const TopRowTabs = styled(Tabs)`
  & > .ant-tabs-content-holder {
    border: none;
  }
`

export const SideBlockTabs = styled(Tabs)`
  & > .ant-tabs-content-holder {
    border: none;
  }

  & > .ant-tabs-nav {
    position: sticky;
    top: 40px;
    margin-left: 72px;
    width: 280px;
    height: fit-content;
    padding: 20px;
    border-radius: 8px;
    box-shadow: ${shadows.main};

    & > .ant-tabs-nav-wrap {
      word-break: break-word;
      white-space: inherit;
      
      & > .ant-tabs-nav-list > .ant-tabs-tab {
        background-color: transparent;
        border: 1px solid ${colors.inputBorderGrey};
        border-radius: 8px;
        padding: 17px;
        font-size: ${fontSizes.label};
        text-align: inherit;

        &.ant-tabs-tab-active {
          border: 1px solid ${colors.black};
          background-color: ${colors.black};
          font-weight: 600;
          transition: 0s;

          .ant-tabs-tab-btn {
            color: ${colors.white};
          }
        }
      }
    }
  }
`

const TabWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  & > *:not(:last-child) {
    margin-right: 12px;
  }
`

interface TabProps extends ITrackingComponent {
    title: string
    showIcon?: boolean
    icon?: React.ReactNode
    onClick?: React.MouseEventHandler<HTMLDivElement>
}

export const Tab: React.FC<TabProps> = ({
    title,
    showIcon = true,
    icon = <StarIcon/>,
    eventName: propEventName,
    onClick,
}) => {
    const { getTrackingWrappedCallback, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Click)
    const onClickCallback = eventName ? getTrackingWrappedCallback(eventName, {}, onClick) : onClick

    return (
        <TabWrapper onClick={onClickCallback}>
            {showIcon && (
                <IconWrapper>
                    {icon}
                </IconWrapper>
            )}
            <span>
                {title}
            </span>
        </TabWrapper>
    )
}
