import styled from '@emotion/styled'
import { TabPaneProps, Tabs } from 'antd'
import React, { CSSProperties } from 'react'
import { colors, fontSizes, shadows } from '@condo/domains/common/constants/style'
import { StarIcon } from '@condo/domains/common/components/icons/Star'

export type SettingsTabPaneDescriptor = TabPaneProps & {
    key: string,
    title: string,
    content?: React.ReactElement
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

    & > .ant-tabs-nav-wrap > .ant-tabs-nav-list > .ant-tabs-tab {
      background-color: transparent;
      border: 1px solid ${colors.inputBorderGrey};
      border-radius: 8px;
      padding: 17px;
      font-size: ${fontSizes.label};

      &.ant-tabs-tab-active {
        border: 1px solid ${colors.black};
        background-color: ${colors.black};

        .ant-tabs-tab-btn {
          color: ${colors.white};
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

export const SettingsTab = ({ title }) => (
    <div style={SETTINGS_TAB_STYLES}>
        <StarIcon/>
        {title}
    </div>
)
