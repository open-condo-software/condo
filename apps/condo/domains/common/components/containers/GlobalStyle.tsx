import React from 'react'
import { css, Global } from '@emotion/react'
import { colors, DEFAULT_STRONG_TEXT_FONT_WEIGHT, gradients } from '@condo/domains/common/constants/style'

export default function GlobalStyle () {
    return (
        <Global
            styles={css`
              @import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&display=swap');
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
              
             .ant-image-preview {
                .ant-image-preview-img {
                  max-width: calc(100% - 80px);
                  max-height: calc(100% - 80px);
                }
                
                .ant-image-preview-operations {
                  background-color: transparent;
                  
                  .ant-image-preview-operations-operation {
                      .anticon-rotate-left, .anticon-rotate-right, .anticon-zoom-in, .anticon-zoom-out {
                        display: none;
                      }
                  }
                }
              
             }
              
              .ant-radio-wrapper {
                white-space: inherit;
              }
              .ant-radio-inner::after {
                background: ${gradients.sberActionGradient};
              }
              .ant-radio-checked .ant-radio-inner {
                border-color: ${colors.inputBorderGrey};
                
                &::after {
                  border-color: ${colors.inputBorderGrey};
                }
              }
              
              .ant-checkbox-wrapper {
                white-space: inherit;
                
                span {
                  position: relative;
                  bottom: 4px;
                }
              }
              
              .ant-checkbox {
                width: 24px;
                height: 24px;
              }
              
              .ant-checkbox-inner {
                  width: 24px;
                  height: 24px;
              }

              .ant-form-item input[type="checkbox"] {
                width: 24px;
                height: 24px;
              }  
              
              .ant-checkbox-inner::after {
                left: 36%;
                width: 7.714px;
                height: 12.143px;
              }
              
              .ant-checkbox-checked {
                .ant-checkbox-inner {
                  background: ${gradients.sberActionGradient};
                  border: none;
                }
              
                .ant-checkbox-inner::after {
                  border: 3px solid #fff;
                  border-top: 0;
                  border-left: 0;
                  transform: rotate(45deg) scale(1) translate(-75%, -50%);
                }
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

              .react-tel-input .ant-input {
                background-color: ${colors.whiteTranslucent} !important;
                width: 100%;
              }

              .ant-input-affix-wrapper input, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused {
                border-color: ${colors.black};
                box-shadow: none !important;
              }

              .ant-input-affix-wrapper > input.ant-input, .ant-form-item-has-error .ant-input-affix-wrapper > input.ant-input {
                -webkit-box-shadow: none !important;
                box-shadow: none !important;
              }

              .ant-form-item-has-error .ant-input-affix-wrapper > input.ant-input:focus, .ant-input-affix-wrapper > input.ant-input:focus {
                -webkit-box-shadow: none !important;
                box-shadow: none !important;
              }
              
              .ant-checkbox {
                border-color: ${colors.inputBorderGrey};
              }
              
              .ant-checkbox-inner {
                border-radius: 4px;
              }
              
              .ant-checkbox-input:focus:not(:checked) + .ant-checkbox-inner {
                background-color: ${colors.ultraLightGrey};
              }

              .ant-form-item-explain, .ant-form-item-extra {
                margin: 0;
              }

              .ant-tag {
                border-radius: 2px;
              }

              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > thead > tr > th,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-header > table > thead > tr > th,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-body > table > thead > tr > th,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > tbody > tr > td,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-header > table > tbody > tr > td,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-body > table > tbody > tr > td,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > tfoot > tr > th,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-header > table > tfoot > tr > th,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-body > table > tfoot > tr > th,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > tfoot > tr > td,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-header > table > tfoot > tr > td,
              .ant-table.ant-table-bordered > .ant-table-container > .ant-table-body > table > tfoot > tr > td {
                &:not(:last-of-type) {
                  border-right: none;
                }
              }

              .ant-table-pagination.ant-pagination {
                margin: 40px 0 16px;
              }

              .ant-table-column-sorter, .ant-table-filter-trigger {
                visibility: hidden;
              }

              .ant-table-filter-trigger.active {
                visibility: visible;
              }

              .ant-table-cell {
                &:hover {
                  .ant-table-column-sorter, .ant-table-filter-trigger {
                    visibility: visible;
                  }
                }
              }

              .ant-table-thead > tr > th {
                font-weight: 700;
              }

              .ant-table-row {
                &:hover {
                  cursor: pointer;
                }
              }
              
              .ant-table-row-expand-icon-spaced {
                display: none;
              }
              
              h1.ant-typography {
                font-weight: 700;
                line-height: 46px;
                letter-spacing: -0.01em;
              }
              
              a.ant-typography[disabled], 
              .ant-typography a[disabled], 
              a.ant-typography.ant-typography-disabled, 
              .ant-typography a.ant-typography-disabled {
                color: ${colors.green[6]};
                &:hover {
                  color: ${colors.green[6]};
                }
              }
              
              .ant-typography strong {
                font-weight: ${DEFAULT_STRONG_TEXT_FONT_WEIGHT};
              }
              .ant-typography mark {
                background-color: ${colors.markColor};
              }
              .ant-alert-info > .ant-alert-content > .ant-alert-message {
                color: ${colors.blue[6]}
              }
              .ant-alert-warning > .ant-alert-content > .ant-alert-message {
                color: ${colors.orange[6]}
              }
              .ant-alert-success > .ant-alert-content > .ant-alert-message {
                color: ${colors.green[6]}
              }
              .ant-alert-error > .ant-alert-content > .ant-alert-message {
                color: ${colors.red[5]}
              }
              
              .ant-modal-title {
                font-size: 24px;
                line-height: 32px; 
                font-weight: 700;
              }
              
              ${uploadControlCss}
              ${radioGroupCss}
              ${inputControlCss}
              ${page}
              ${carouselCss}
              ${cardCSS}
            `}
        />
    )
}

const radioGroupCss = css`
  .sberRadioGroup .ant-radio-button-wrapper-checked:not([class*=' ant-radio-button-wrapper-disabled']).ant-radio-button-wrapper:first-child{
    border-right-color:${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):first-child{
    border-color:${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled){
    color: ${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover{
    color: ${colors.white};
    border-color: ${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled){
    color: ${colors.white};
    background-color: ${colors.black};
    border-color: ${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before{
    background-color: ${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper{
    border-color: ${colors.black};
    --antd-wave-shadow-color: ${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper:first-child{
    border-left-color: ${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper:hover{
    color: ${colors.black};
  }
  .sberRadioGroup .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover::before{
    background-color:${colors.black};
  }
`


const uploadControlCss = css`
  .upload-control-wrapper .ant-upload-list-text-container {
    transition: none;
  }
  .upload-control-wrapper .ant-upload-list-item-info .ant-upload-text-icon .anticon,
  .upload-control-wrapper a.ant-upload-list-item-name,
  .upload-control-wrapper a.ant-upload-list-item-name:active,
  .upload-control-wrapper a.ant-upload-list-item-name:focus {
    color: ${colors.green[7]};
  }
  .upload-control-wrapper .ant-upload-list-item:hover a,
  .upload-control-wrapper .ant-upload-list-item:hover .ant-upload-text-icon > .anticon.anticon-paper-clip,
  .upload-control-wrapper .ant-upload-list-item:hover .ant-upload-list-item-info.ant-upload-text-icon.anticon {
    color: ${colors.green[5]};
  }
  .upload-control-wrapper .ant-upload-list-item.ant-upload-list-item-error .ant-upload-list-item-info .ant-upload-text-icon .anticon,
  .upload-control-wrapper .ant-upload-list-item.ant-upload-list-item-error:hover .ant-upload-list-item-info .ant-upload-text-icon .anticon {
    color: ${colors.sberDanger[5]};
  }
  .upload-control-wrapper .ant-upload-list-item:hover .ant-upload-list-item-info {
    background-color: transparent;
  }
  .upload-control-wrapper > span {
    display: flex;
    flex-direction: column;
  }
  .upload-control-wrapper .ant-upload.ant-upload-select {
    order:1;
    margin-top:5px;
  }
  .upload-control-wrapper .ant-upload-list-item-card-actions .anticon.anticon-delete {
    font-size:18px;
  }
  .upload-control-wrapper .ant-upload-list-item-card-actions {
    margin-left: 50px;
  }
`

const inputControlCss = css`
  .ant-input.white {
    background: ${colors.white};
    &:focus, &:active {
      background: ${colors.white} !important;
    }
  }
`

const page = css`
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
`

const carouselCss = css`
  .ant-carousel {
    width: 100%;
    background: ${colors.backgroundLightGrey};
    padding: 12px;
    border-radius: 12px;
  }
  .slick-slide {
    padding: 12px;
  }
`

const cardCSS = css`
  .ant-card-bordered {
    border: 1px solid ${colors.backgroundWhiteSecondary};
  }
  .ant-card-head {
    border-color: ${colors.backgroundWhiteSecondary};
  }
`
