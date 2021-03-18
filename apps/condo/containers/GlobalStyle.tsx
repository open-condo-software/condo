import React from 'react'
import { css, Global } from '@emotion/core'
import { colors } from '../constants/style'

export default function GlobalStyle () {
    return (
        <Global
            styles={css`
        $@import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&display=swap');
        body {
          max-width: 100%;
          overflow-x: hidden;
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif;
          line-height: 1.5;

          text-decoration-skip: ink;
          text-rendering: optimizeLegibility;
          -ms-overflow-style: -ms-autohiding-scrollbar;
          -moz-font-feature-settings: 'liga on';
          -moz-osx-font-smoothing: grayscale;
          -webkit-font-smoothing: antialiased;
        }
        #__next {
          height: 100%;
        }
        
        .ant-radio-wrapper {
            white-space: inherit;
        }
        .ant-checkbox-wrapper {
            white-space: inherit;
        }
        
        .ant-list-item-action > li:last-child {
            padding-right: 0;
        }
        
        .ant-form .ant-non-field-error .ant-form-item-control-input {
            display: none;
        }
        .ant-form .ant-non-field-error .ant-form-item-explain {
            margin-bottom: 24px;
        }
        .ant-form .ant-non-field-error {
            margin-bottom: 0;
        }
        
        .ant-card .ant-card-head {
            margin-bottom: 0;
        }
        
        /*TODO(Dimitreee): remove select style ovveride after select customization*/
        .ant-select-single.ant-select-open .ant-select-selection-item {
            color: #434343;
        }

        /*TODO(Dimitreee): remove input style ovveride after select customization*/
        .ant-input {
          &:focus, &:active {
            background-color: ${colors.white};
          }
        }
        
        /*TODO(Dimitreee): remove select style ovveride after select customization*/
        .ant-select-focused {
            &.ant-select:not(.ant-select-customize-input):not(disabled) .ant-select-selector {
                background-color: ${colors.white};
            }
        }
        
        .ant-checkbox-input:focus:not(:checked) + .ant-checkbox-inner {
          background-color: ${colors.white};
        }
        
        .ant-form-item-explain, .ant-form-item-extra {
          margin: 0;
        }
        
        .ant-tag {
          border-radius: 2px;
        }

        ${page}
      `}
        />
    )
}

const page = css`
.top-menu-only-layout .side-menu {display: none}
.top-menu-only-layout .side-menu-substrate {display: none}
.top-menu-only-layout .page-header {display: none}
.top-menu-only-layout .top-menu-side-menu-toggle {display: none}
.top-menu-only-layout .page-wrapper {
    flex: auto;
    align-self: center;
    max-width: 600px;
    min-width: initial;
    padding-top: 64px;
    padding-bottom: 64px;
    margin: 0 auto;
}
@media (max-width: 768px) {
    .top-menu-only-layout .page-wrapper {
        min-width: initial;
    }
}
@media (max-width: 480px) {
    .top-menu-only-layout .page-wrapper {
        min-width: 100%;
        padding-top: 0;
        padding-bottom: 0;
    }
}

.transparent-page-content .page-content {
    padding: 0;
    background: inherit;
}

.centered-page-content .page-wrapper {
    flex: auto;
    align-self: center;
    max-width: 600px;
    min-width: initial;
}

.hided-side-menu .side-menu {
    display: none
}
`
