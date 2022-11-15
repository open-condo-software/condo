import styled from '@emotion/styled'
import { TabPaneProps, Tabs } from 'antd'
import React, { CSSProperties } from 'react'
import { colors, fontSizes, shadows } from '@condo/domains/common/constants/style'
import { StarIcon } from '@condo/domains/common/components/icons/Star'
import { ITrackingComponent, TrackingEventType, useTracking } from '../TrackingContext'

export type SettingsTabPaneDescriptor = TabPaneProps & {
    key: string,
    title: string,
    content?: React.ReactElement
    eventName?: string
    onClick?: (e) => void
}

export const SettingsTabs = styled(Tabs)`
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

export const SettingsTabsSmall = styled(Tabs)`
  & > .ant-tabs-content-holder {
    border: none;
  }
`

const SETTINGS_TAB_STYLES: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' }

interface ISettingsTabProps extends ITrackingComponent {
    title: string
    onClick?: (e) => void
}

export const SettingsTab: React.FC<ISettingsTabProps> = ({ title, eventName: propEventName, onClick }) => {
    const { getTrackingWrappedCallback, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Click)
    const onClickCallback = eventName ? getTrackingWrappedCallback(eventName, {}, onClick) : onClick

    return (
        <div style={SETTINGS_TAB_STYLES} onClick={onClickCallback}>
            <StarIcon/>
            {title}
        </div>
    )
}

