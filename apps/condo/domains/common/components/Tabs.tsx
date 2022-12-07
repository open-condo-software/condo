import styled from '@emotion/styled'
import { Tabs } from 'antd'
import { colors, fontSizes, shadows } from '@condo/domains/common/constants/style'
import React, { CSSProperties } from 'react'
import { ITrackingComponent, TrackingEventType, useTracking } from './TrackingContext'
import { StarIcon } from './icons/Star'

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

const TAB_STYLES: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' }

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
        <div style={TAB_STYLES} onClick={onClickCallback}>
            {showIcon && (
                icon
            )}
            {title}
        </div>
    )
}
