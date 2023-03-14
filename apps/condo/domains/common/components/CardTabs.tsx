import styled from '@emotion/styled'

import { Tabs } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

// TODO(DOMA-5702): Replace this with Radio.Button from UI-kit
export const CardTabs = styled(Tabs)`
  .condo-tabs-nav-list {
    background-color: ${colors.gray[3]};
    border-radius: 8px;
    padding: 4px;

    .condo-tabs-ink-bar {
      display: none;
    }
  }

  & > .condo-tabs-nav {
    margin: 0 0 20px 0;

    .condo-tabs-tab {
      display: flex;
      flex-direction: row;
      align-items: center;
      transition: 0.15s;
      background: inherit;
      border: none;
      padding: 8px 16px;
      margin: 0;

      &-active {
        background: ${colors.white};
        box-shadow: 0 4px 14px 0 #b2b9d966;
        border-width: 1px;
        border-radius: 6px !important;
      }

      & .condo-tabs-tab-label > span {
        font-size: 14px;
      }

      &:not(.condo-tabs-tab-active):hover .condo-tabs-tab-label * {
        background: linear-gradient(90deg, #4cd174 0%, #6db8f2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }

  &.condo-tabs-right, &.condo-tabs-left {
    .condo-tabs-content-holder {
      display: none;
    }
  }
`