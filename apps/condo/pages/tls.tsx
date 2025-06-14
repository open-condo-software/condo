import fs from 'fs'
import path from 'path'

import Icon from '@ant-design/icons'
import styled from '@emotion/styled'
import { Anchor, Col, Collapse, Image, Row } from 'antd'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback } from 'react'

import conf from '@open-condo/config'
import { QuestionCircle } from '@open-condo/icons'
import { extractReqLocale } from '@open-condo/locales/extractReqLocale'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Markdown, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { ConvertToUTF8 } from '../domains/banking/utils/serverSchema/converters/convertToUTF8'
import EmptyLayout from '@condo/domains/common/components/containers/EmptyLayout'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { Logo } from '@condo/domains/common/components/Logo'
import { Poster } from '@condo/domains/common/components/Poster'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { PageComponentType } from '@condo/domains/common/types'
import { PosterWrapper } from '@condo/domains/user/components/containers/styles'

import type { GetServerSideProps } from 'next'


const LOGO_HEADER_STYLES = { width: '100%', justifyContent: 'space-between' }
const HEADER_LOGO_STYLE: React.CSSProperties = { cursor: 'pointer' }
const TEXT_CENTER_STYLE: React.CSSProperties = { textAlign: 'center' }

const { publicRuntimeConfig: { defaultLocale } } = getConfig()

const AndroidIcon = () => (
    <svg width='12' height='15' viewBox='0 0 12 15' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M1.8 6.39043V10.0094C1.8 10.4904 1.422 10.8749 0.9405 10.8749C0.4625 10.8749 0 10.4874 0 10.0094V6.39043C0 5.91843 0.4625 5.53093 0.9405 5.53093C1.4125 5.53093 1.8 5.91843 1.8 6.39043ZM2.1375 11.2969C2.1375 11.8094 2.55 12.2219 3.0625 12.2219H3.6845L3.694 14.1314C3.694 15.2844 5.419 15.2754 5.419 14.1314V12.2219H6.58147V14.1314C6.58147 15.2784 8.316 15.2814 8.316 14.1314V12.2219H8.947C9.06807 12.2215 9.18787 12.1973 9.29953 12.1506C9.4112 12.1039 9.5126 12.0357 9.59787 11.9497C9.6832 11.8639 9.75073 11.762 9.79667 11.6499C9.84253 11.5379 9.86593 11.418 9.86553 11.2969V5.69093H2.1375V11.2969ZM9.88747 5.38743H2.103C2.103 4.04993 2.903 2.88743 4.0905 2.28143L3.4935 1.17843C3.406 1.02543 3.628 0.928433 3.703 1.05943L4.309 2.17193C5.39947 1.68743 6.653 1.71243 7.69347 2.17193L8.29647 1.06243C8.37453 0.927933 8.59347 1.02793 8.506 1.18143L7.909 2.28143C9.087 2.88743 9.88747 4.05043 9.88747 5.38743ZM4.553 3.65293C4.553 3.56594 4.51844 3.48251 4.45693 3.421C4.39542 3.35949 4.31199 3.32493 4.225 3.32493C4.047 3.32493 3.9065 3.47493 3.9065 3.65293C3.9065 3.83093 4.0505 3.98093 4.225 3.98093C4.4095 3.98093 4.553 3.83093 4.553 3.65293ZM8.097 3.65293C8.0974 3.56737 8.0642 3.48505 8.00453 3.42371C7.94493 3.36237 7.86353 3.3269 7.778 3.32493C7.691 3.32493 7.6076 3.35949 7.54607 3.421C7.48453 3.48251 7.45 3.56594 7.45 3.65293C7.45 3.73993 7.48453 3.82335 7.54607 3.88487C7.6076 3.94637 7.691 3.98093 7.778 3.98093C7.953 3.98093 8.097 3.83093 8.097 3.65293ZM11.0595 5.53143C10.5875 5.53143 10.2 5.90943 10.2 6.39093V10.0099C10.2 10.4909 10.5875 10.8754 11.0595 10.8754C11.541 10.8754 12 10.4879 12 10.0099V6.39093C12 5.90993 11.5375 5.53143 11.0595 5.53143Z' fill='#39CE66'/>
    </svg>
)

const IosIcon = () => (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M14.4565 11.4892C14.0885 12.304 13.9125 12.6683 13.4398 13.3883C12.7795 14.3938 11.8472 15.6486 10.6946 15.6572C9.6694 15.6658 9.40473 14.9883 8.0134 14.9994C6.622 15.0062 6.33214 15.6696 5.30568 15.6591C4.15307 15.6486 3.2706 14.5182 2.60968 13.5145C0.761679 10.6991 0.566599 7.39936 1.70875 5.64369C2.51675 4.39877 3.79553 3.66769 4.99614 3.66769C6.21891 3.66769 6.98753 4.33969 7.9986 4.33969C8.97953 4.33969 9.57707 3.66585 10.9912 3.66585C12.0607 3.66585 13.1918 4.24861 13.9998 5.25415C11.3561 6.70276 11.7857 10.4788 14.4565 11.4892ZM9.918 2.54215C10.4325 1.88185 10.8226 0.950154 10.6811 0C9.84167 0.0572313 8.86013 0.593234 8.2866 1.28739C7.7672 1.91939 7.33647 2.85846 7.50447 3.76677C8.42013 3.79631 9.3678 3.25046 9.918 2.54215Z' fill='#39CE66'/>
    </svg>
)

const LinuxIcon = () => (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <mask id='mask0_500_358' maskUnits='userSpaceOnUse' x='0' y='0' width='16' height='16'>
            <path d='M16 0H0V16H16V0Z' fill='white'/>
        </mask>
        <g mask='url(#mask0_500_358)'>
            <path d='M14.1266 12.62C14.0073 12.4345 13.93 12.2252 13.9 12.0067C13.8666 11.7529 13.752 11.5167 13.5733 11.3333C13.5344 11.2979 13.492 11.2667 13.4466 11.24C13.4072 11.2147 13.3646 11.1945 13.32 11.18C13.5824 10.3549 13.5398 9.463 13.2 8.66667C12.8522 7.81373 12.3606 7.02673 11.7466 6.34C11.1358 5.74427 10.7656 4.94454 10.7066 4.09333C10.72 2.66667 10.8666 0 8.33329 0H7.99996C5.17331 0.226667 5.92665 3.21333 5.88665 4.21333C5.85689 4.93576 5.61069 5.63257 5.17998 6.21333C4.40251 7.10547 3.78865 8.1278 3.36665 9.23333C3.17257 9.76607 3.10635 10.337 3.17331 10.9C3.14563 10.921 3.12096 10.9457 3.09998 10.9733C2.92665 11.1533 2.79998 11.38 2.65331 11.5333C2.49865 11.6557 2.31878 11.7422 2.12665 11.7867C1.88142 11.856 1.67318 12.0188 1.54665 12.24C1.48495 12.3593 1.4551 12.4925 1.45998 12.6267C1.4534 12.7488 1.4534 12.8712 1.45998 12.9933C1.50719 13.2131 1.50719 13.4403 1.45998 13.66C1.38941 13.8186 1.35349 13.9905 1.35464 14.1641C1.35579 14.3377 1.39398 14.509 1.46665 14.6667C1.53488 14.7745 1.62677 14.8653 1.73535 14.9323C1.84393 14.9993 1.96635 15.0407 2.09331 15.0533C2.72667 15.0955 3.35075 15.228 3.94665 15.4467L3.99998 15.3333L3.95331 15.4267C4.48188 15.7297 5.0983 15.8427 5.69998 15.7467C5.87511 15.7131 6.03993 15.6389 6.18119 15.5301C6.32245 15.4213 6.43621 15.2808 6.51331 15.12C6.89996 15.12 7.33329 14.9467 8.01996 14.9133C8.48663 14.8733 9.07329 15.08 9.73996 15.04C9.75969 15.1114 9.78649 15.1806 9.81996 15.2467C9.92376 15.4876 10.1006 15.6899 10.3254 15.8251C10.5502 15.9602 10.8118 16.0214 11.0733 16C11.37 15.9624 11.6562 15.8657 11.915 15.7157C12.1738 15.5657 12.3999 15.3655 12.58 15.1267C13.0488 14.703 13.588 14.3646 14.1733 14.1267C14.2872 14.0743 14.3864 13.9945 14.462 13.8945C14.5376 13.7944 14.5873 13.6772 14.6066 13.5533C14.5737 13.1917 14.4016 12.8571 14.1266 12.62ZM7.88663 3.24C7.88589 3.06474 7.92463 2.89157 7.99996 2.73333C8.05909 2.58291 8.15823 2.45151 8.28663 2.35333C8.40123 2.2644 8.54163 2.21525 8.68663 2.21333C8.82709 2.21168 8.96376 2.25881 9.07329 2.34667C9.20569 2.44123 9.30943 2.57039 9.37329 2.72C9.44616 2.87411 9.48269 3.04289 9.47996 3.21333C9.48203 3.39015 9.44563 3.56531 9.37329 3.72667C9.33769 3.81261 9.29056 3.89333 9.23329 3.96667H9.17329L8.97996 3.88667L8.83329 3.84C8.88243 3.79754 8.92516 3.74813 8.95996 3.69333C8.99556 3.60429 9.01369 3.50923 9.01329 3.41333C9.02063 3.32255 9.00696 3.23131 8.97329 3.14667C8.95269 3.06627 8.91136 2.99269 8.85329 2.93333C8.80616 2.88409 8.74149 2.85536 8.67329 2.85333C8.60903 2.85213 8.54689 2.87605 8.49996 2.92C8.43729 2.97389 8.38916 3.04266 8.35996 3.12C8.32356 3.20905 8.30329 3.30385 8.29996 3.4C8.29309 3.45311 8.29309 3.50689 8.29996 3.56C8.16983 3.49885 8.03349 3.45191 7.89329 3.42C7.89003 3.37117 7.89003 3.32217 7.89329 3.27333L7.88663 3.24ZM6.16665 3.28667C6.15643 3.13575 6.17452 2.98426 6.21998 2.84C6.25356 2.71364 6.32031 2.59856 6.41331 2.50667C6.48512 2.42566 6.58543 2.37551 6.69329 2.36667C6.79429 2.36821 6.89129 2.40607 6.96663 2.47333C7.06623 2.55542 7.14403 2.66073 7.19329 2.78C7.25389 2.91913 7.28776 3.06837 7.29329 3.22C7.30003 3.28427 7.30003 3.34906 7.29329 3.41333H7.23329C7.14123 3.44332 7.05369 3.48595 6.97329 3.54C6.97996 3.48241 6.97996 3.42425 6.97329 3.36667C6.97069 3.29047 6.95256 3.21561 6.91996 3.14667C6.89736 3.08383 6.86089 3.02688 6.81329 2.98C6.77776 2.95023 6.73303 2.93374 6.68663 2.93333C6.66147 2.93558 6.63707 2.94331 6.61519 2.95597C6.59331 2.96864 6.57447 2.98595 6.55998 3.00667C6.52164 3.06077 6.49445 3.12195 6.47998 3.18667C6.46962 3.2641 6.46962 3.34257 6.47998 3.42C6.48593 3.49571 6.50394 3.56997 6.53331 3.64C6.55831 3.70325 6.59701 3.76017 6.64665 3.80667L6.53331 3.9L6.43998 3.96667C6.36053 3.88737 6.29913 3.79187 6.25998 3.68667C6.19959 3.54949 6.16349 3.40287 6.15331 3.25333L6.16665 3.28667ZM6.29331 4.26667L6.61331 4.02667L6.73329 3.94C6.88869 3.76923 7.07996 3.63491 7.29329 3.54667C7.39396 3.51111 7.49989 3.49307 7.60663 3.49333C7.89889 3.50715 8.18116 3.60431 8.41996 3.77333C8.64743 3.88958 8.88376 3.98767 9.12663 4.06667C9.25909 4.11211 9.37203 4.2015 9.44663 4.32C9.46809 4.36944 9.47923 4.42277 9.47923 4.47667C9.47923 4.53057 9.46809 4.58389 9.44663 4.63333C9.37689 4.77261 9.27749 4.89493 9.15543 4.99167C9.03329 5.08842 8.89149 5.15725 8.73996 5.19333C8.56003 5.27471 8.38816 5.37293 8.22663 5.48667C8.02776 5.61221 7.79483 5.67279 7.55996 5.66C7.45656 5.65755 7.35469 5.63489 7.25996 5.59333C7.18283 5.55933 7.11103 5.51443 7.04663 5.46C6.92103 5.33728 6.78496 5.22574 6.63998 5.12667C6.42978 5.03297 6.26465 4.86066 6.17998 4.64667C6.1534 4.57981 6.15013 4.50594 6.17069 4.43699C6.19125 4.36805 6.23445 4.30805 6.29331 4.26667ZM6.39998 14.7C6.3963 14.9099 6.31877 15.1119 6.18101 15.2704C6.04325 15.4289 5.85405 15.5338 5.64665 15.5667C5.09392 15.6513 4.5289 15.543 4.04665 15.26C3.43399 15.0255 2.7884 14.8882 2.13331 14.8533C2.03842 14.8447 1.94647 14.8159 1.86367 14.7687C1.78087 14.7216 1.70914 14.6572 1.65331 14.58C1.57235 14.3045 1.60102 14.0083 1.73331 13.7533C1.78988 13.5054 1.78988 13.2479 1.73331 13C1.66755 12.7963 1.66755 12.5771 1.73331 12.3733C1.78224 12.2865 1.84821 12.2105 1.92725 12.1497C2.0063 12.089 2.09679 12.0449 2.19331 12.02C2.4205 11.9715 2.63159 11.866 2.80665 11.7133C2.97998 11.5333 3.10665 11.3067 3.25331 11.1467C3.30605 11.08 3.3728 11.0257 3.44883 10.9877C3.52487 10.9497 3.60833 10.9289 3.69331 10.9267H3.80665C4.08522 11.0007 4.3242 11.18 4.47331 11.4267L5.07998 12.54C5.31432 12.927 5.582 13.2929 5.87998 13.6333C6.15286 13.9245 6.32367 14.2966 6.36665 14.6933L6.39998 14.7ZM6.34665 13.8867C6.26665 13.76 6.17331 13.64 6.07998 13.5133L5.89998 13.28C6.00536 13.2827 6.11005 13.2622 6.20665 13.22C6.30373 13.1773 6.38028 13.0983 6.41998 13C6.44567 12.8608 6.43791 12.7175 6.39733 12.5819C6.35677 12.4463 6.28455 12.3222 6.18665 12.22C5.85659 11.8097 5.45164 11.4659 4.99331 11.2067C4.63083 10.9997 4.35597 10.668 4.21998 10.2733C4.1232 9.91307 4.1232 9.5336 4.21998 9.17333C4.40134 8.5184 4.68724 7.89713 5.06665 7.33333C5.13331 7.28 5.06665 7.43333 4.79331 8C4.51998 8.56667 4.02665 9.66667 4.70665 10.5733C4.73209 9.9122 4.87899 9.26133 5.13998 8.65333C5.51998 7.8 6.30665 6.31333 6.37331 5.13333C6.43521 5.17932 6.49977 5.22162 6.56665 5.26C6.70416 5.35855 6.83549 5.46541 6.95996 5.58C7.12223 5.7188 7.32663 5.79868 7.53996 5.80667H7.61996C7.85536 5.80221 8.08536 5.73551 8.28663 5.61333C8.44203 5.50486 8.60716 5.41112 8.77996 5.33333C9.04489 5.24652 9.27736 5.0815 9.44663 4.86C9.75209 5.88968 10.1608 6.88587 10.6666 7.83333C11.0115 8.4588 11.2588 9.1332 11.4 9.83333C11.5168 9.8314 11.6334 9.84487 11.7466 9.87333C11.874 9.40387 11.8732 8.90887 11.7442 8.43987C11.6152 7.9708 11.3628 7.545 11.0133 7.20667C10.8666 7.06 10.86 7 10.9333 7C11.4614 7.51433 11.8316 8.16893 12 8.88667C12.0901 9.25233 12.0901 9.63433 12 10L12.14 10.06C12.8066 10.3933 13.0866 10.6867 12.96 11.0867H12.8333C12.9333 10.7733 12.7066 10.54 12.12 10.2733C11.5333 10.0067 11.02 10.0267 10.9333 10.5733C10.9333 10.6067 10.9333 10.6333 10.9333 10.66L10.7933 10.7267C10.6526 10.8127 10.5321 10.9282 10.44 11.0651C10.348 11.202 10.2866 11.3572 10.26 11.52C10.1754 11.9303 10.1308 12.3478 10.1266 12.7667C10.082 13.0745 10.0106 13.3779 9.91329 13.6733C9.41389 14.0735 8.80269 14.3088 8.16389 14.3471C7.52509 14.3853 6.89023 14.2244 6.34665 13.8867ZM14.06 13.9333C13.4513 14.1769 12.8947 14.5344 12.42 14.9867C12.0934 15.4131 11.6166 15.6991 11.0866 15.7867C10.8641 15.8185 10.6372 15.7763 10.4409 15.6667C10.2446 15.5571 10.0897 15.3861 9.99996 15.18C9.88429 14.8087 9.89836 14.4089 10.04 14.0467C10.181 13.6348 10.2836 13.2107 10.3466 12.78C10.3556 12.3725 10.4002 11.9665 10.48 11.5667C10.4996 11.4316 10.5478 11.3023 10.6214 11.1873C10.695 11.0723 10.7922 10.9744 10.9066 10.9H10.94C10.9319 11.0949 10.9838 11.2877 11.0887 11.4522C11.1936 11.6167 11.3465 11.7451 11.5266 11.82C11.7522 11.8342 11.978 11.7958 12.1863 11.7079C12.3945 11.62 12.5795 11.4849 12.7266 11.3133H12.8666C12.9675 11.2995 13.0702 11.3071 13.1678 11.3359C13.2656 11.3646 13.356 11.4137 13.4333 11.48C13.5793 11.6435 13.6702 11.8487 13.6933 12.0667C13.7397 12.3207 13.8447 12.5603 14 12.7667C14.3266 13.1267 14.4333 13.3733 14.42 13.5333C14.4066 13.6933 14.2733 13.8067 14.06 13.9333ZM6.41331 4.66667C6.30665 4.58 6.31998 4.46 6.35998 4.46C6.39998 4.46 6.45331 4.57333 6.49998 4.61333C6.57573 4.69117 6.65586 4.76463 6.73996 4.83333C6.95803 5.01962 7.23329 5.12551 7.51996 5.13333C7.85209 5.10231 8.17203 4.99261 8.45329 4.81333C8.60383 4.72245 8.74856 4.62225 8.88663 4.51333C8.99329 4.43333 8.98663 4.34 9.07329 4.35333C9.15996 4.36667 9.07329 4.45333 8.97329 4.56C8.83209 4.68313 8.67789 4.79044 8.51329 4.88C8.21389 5.07066 7.87343 5.18721 7.51996 5.22C7.20249 5.20765 6.89989 5.08235 6.66663 4.86667C6.57902 4.80413 6.49448 4.73739 6.41331 4.66667Z' fill='#39CE66'/>
        </g>
    </svg>
)

const MacosIcon = () => (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <mask id='mask0_500_347' maskUnits='userSpaceOnUse' x='0' y='0' width='16' height='16'>
            <path d='M16 0H0V16H16V0Z' fill='white'/>
        </mask>
        <g mask='url(#mask0_500_347)'>
            <path d='M8.79644 5.34032V5.21004L8.39144 5.23785C8.27677 5.24509 8.19071 5.26947 8.13277 5.31061C8.07491 5.35214 8.04597 5.40966 8.04597 5.48318C8.04597 5.5548 8.07451 5.61194 8.13204 5.65423C8.18917 5.6969 8.26611 5.71785 8.36211 5.71785C8.42344 5.71785 8.48097 5.70832 8.53397 5.68966C8.58691 5.67099 8.63337 5.64471 8.67224 5.61118C8.71111 5.57804 8.74157 5.53842 8.76331 5.49232C8.78537 5.44623 8.79644 5.39556 8.79644 5.34032ZM7.99984 0.0953751C3.58881 0.0953751 0.0950928 3.58909 0.0950928 8.00013C0.0950928 12.4116 3.58881 15.9049 7.99984 15.9049C12.4109 15.9049 15.9046 12.4116 15.9046 8.00013C15.9046 3.58909 12.4113 0.0953751 7.99984 0.0953751ZM9.53431 4.78071C9.57164 4.67594 9.62424 4.58604 9.69244 4.51138C9.76064 4.43671 9.84251 4.37918 9.93851 4.3388C10.0345 4.29842 10.1416 4.27823 10.2593 4.27823C10.3656 4.27823 10.4616 4.29423 10.5469 4.32585C10.6326 4.35747 10.7058 4.40014 10.7671 4.45385C10.8284 4.50756 10.8772 4.57004 10.913 4.64166C10.9488 4.71328 10.9701 4.78909 10.9774 4.86871H10.66C10.652 4.8249 10.6376 4.78376 10.617 4.74604C10.5964 4.70832 10.5694 4.67556 10.5358 4.64776C10.502 4.61994 10.4623 4.59823 10.417 4.58261C10.3713 4.56661 10.3202 4.55899 10.2627 4.55899C10.1953 4.55899 10.134 4.57271 10.0794 4.59976C10.0246 4.6268 9.97777 4.66528 9.93891 4.7148C9.90004 4.76432 9.86997 4.8249 9.84864 4.89576C9.82691 4.96699 9.81624 5.04585 9.81624 5.13271C9.81624 5.22261 9.82691 5.30338 9.84864 5.37423C9.86997 5.44547 9.90044 5.50528 9.94004 5.55442C9.97931 5.60356 10.0269 5.64128 10.0821 5.66718C10.1374 5.69309 10.1983 5.70642 10.2646 5.70642C10.3732 5.70642 10.4616 5.6809 10.5301 5.62985C10.5987 5.5788 10.6429 5.50414 10.6634 5.40585H10.9812C10.972 5.49271 10.948 5.57194 10.9092 5.64356C10.8703 5.71518 10.82 5.77614 10.7583 5.8268C10.6962 5.87747 10.6234 5.91671 10.5396 5.94414C10.4558 5.97156 10.3636 5.98566 10.2634 5.98566C10.1446 5.98566 10.0376 5.96585 9.94117 5.92661C9.84517 5.88738 9.76251 5.83061 9.69397 5.75709C9.62537 5.68356 9.57244 5.59404 9.53511 5.48852C9.49777 5.38299 9.47911 5.26452 9.47911 5.13232C9.47831 5.00318 9.49697 4.88585 9.53431 4.78071ZM5.0189 4.29994H5.33661V4.58223H5.34271C5.36214 4.53538 5.38767 4.49309 5.4189 4.45652C5.45014 4.41956 5.48595 4.38832 5.52709 4.36204C5.56785 4.33576 5.61319 4.31594 5.66195 4.30223C5.71109 4.28852 5.7629 4.28166 5.817 4.28166C5.93357 4.28166 6.03223 4.30947 6.11223 4.36509C6.19261 4.42071 6.24976 4.50071 6.28328 4.60509H6.29128C6.31261 4.5548 6.34081 4.50985 6.37547 4.47023C6.41014 4.43061 6.45014 4.39632 6.49509 4.36814C6.54005 4.33994 6.58957 4.31861 6.64328 4.30376C6.69697 4.2889 6.75337 4.28166 6.81277 4.28166C6.89471 4.28166 6.96897 4.29461 7.03604 4.3209C7.10311 4.34718 7.16024 4.38376 7.20784 4.43138C7.25544 4.47899 7.29204 4.5369 7.31757 4.60471C7.34311 4.67252 7.35604 4.74794 7.35604 4.83099V5.96661H7.02464V4.91061C7.02464 4.80128 6.99644 4.71632 6.94004 4.65652C6.88404 4.59671 6.80364 4.56661 6.69931 4.56661C6.64823 4.56661 6.60138 4.57576 6.55871 4.59366C6.51643 4.61156 6.47947 4.63671 6.449 4.66909C6.41814 4.70109 6.39414 4.73994 6.37699 4.7849C6.35947 4.82985 6.35071 4.87899 6.35071 4.93232V5.96661H6.02385V4.88318C6.02385 4.83518 6.01623 4.79176 6.00138 4.7529C5.98652 4.71404 5.96557 4.6809 5.93776 4.65309C5.91033 4.62528 5.87643 4.60432 5.83719 4.58947C5.79757 4.57461 5.75338 4.56699 5.70423 4.56699C5.65319 4.56699 5.60595 4.57652 5.56214 4.59556C5.51871 4.61461 5.48138 4.6409 5.45014 4.67442C5.4189 4.70832 5.39452 4.74794 5.37738 4.79404C5.36061 4.83976 5.33319 4.89004 5.33319 4.94414V5.96623H5.0189V4.29994ZM5.74005 12.2767C4.2829 12.2767 3.36899 11.2641 3.36899 9.64813C3.36899 8.03213 4.2829 7.01613 5.74005 7.01613C7.19717 7.01613 8.10764 8.03213 8.10764 9.64813C8.10764 11.2637 7.19717 12.2767 5.74005 12.2767ZM8.43797 5.96242C8.38424 5.97614 8.32937 5.98299 8.27297 5.98299C8.18997 5.98299 8.11411 5.97118 8.04517 5.94756C7.97584 5.92394 7.91677 5.8908 7.86731 5.84776C7.81777 5.80471 7.77891 5.7529 7.75144 5.69194C7.72364 5.63099 7.70997 5.56318 7.70997 5.48852C7.70997 5.34223 7.76444 5.22794 7.87337 5.14566C7.98231 5.06338 8.14004 5.01538 8.34691 5.00204L8.79644 4.97614V4.84738C8.79644 4.75138 8.76597 4.67785 8.70497 4.62794C8.64404 4.57804 8.55797 4.5529 8.44631 4.5529C8.40137 4.5529 8.35911 4.55861 8.32024 4.56966C8.28137 4.58109 8.24711 4.59709 8.21737 4.61804C8.18764 4.63899 8.16291 4.66414 8.14384 4.69347C8.12444 4.72242 8.11111 4.75518 8.10384 4.79099H7.79224C7.79411 4.71747 7.81244 4.64928 7.84671 4.5868C7.88097 4.52432 7.92744 4.47023 7.98651 4.42414C8.04557 4.37804 8.11451 4.34223 8.19451 4.31671C8.27451 4.29118 8.36137 4.27823 8.45544 4.27823C8.55677 4.27823 8.64864 4.2908 8.73091 4.31671C8.81317 4.34261 8.88364 4.3788 8.94197 4.42642C9.00024 4.47404 9.04517 4.53118 9.07677 4.59823C9.10844 4.66528 9.12444 4.74032 9.12444 4.82299V5.96623H8.80711V5.68852H8.79911C8.77544 5.73347 8.74577 5.77423 8.70957 5.81042C8.67297 5.84661 8.63224 5.87785 8.58691 5.90338C8.54117 5.9289 8.49164 5.94871 8.43797 5.96242ZM10.5343 12.2767C9.42311 12.2767 8.66764 11.6946 8.61511 10.7807H9.33851C9.39491 11.303 9.89964 11.6489 10.5911 11.6489C11.2543 11.6489 11.7309 11.303 11.7309 10.8303C11.7309 10.4211 11.4414 10.1739 10.7713 10.0047L10.1183 9.8424C9.17964 9.60966 8.75297 9.1826 8.75297 8.48053C8.75297 7.61613 9.50804 7.01613 10.5842 7.01613C11.6356 7.01613 12.3694 7.6196 12.3976 8.4874H11.6814C11.6318 7.96506 11.2052 7.64393 10.5698 7.64393C9.93811 7.64393 9.50077 7.96853 9.50077 8.43786C9.50077 8.80813 9.77584 9.0272 10.4463 9.19633L10.9968 9.33386C12.0448 9.58793 12.4753 10.0009 12.4753 10.7419C12.4749 11.6874 11.7271 12.2767 10.5343 12.2767ZM5.74005 7.66493C4.74157 7.66493 4.11719 8.4306 4.11719 9.64773C4.11719 10.8615 4.74157 11.6272 5.74005 11.6272C6.73511 11.6272 7.36291 10.8615 7.36291 9.64773C7.36331 8.4306 6.73511 7.66493 5.74005 7.66493Z' fill='#39CE66'/>
        </g>
    </svg>
)

const WindowsIcon = () => (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g clipPath='url(#clip0_500_335)'>
            <mask id='mask0_500_335' maskUnits='userSpaceOnUse' x='0' y='0' width='16' height='16'>
                <path d='M16 0H0V16H16V0Z' fill='white'/>
            </mask>
            <g mask='url(#mask0_500_335)'>
                <path d='M6.555 1.375L0 2.237V7.687H6.555V1.375ZM0 13.795L6.555 14.728V8.313H0V13.795ZM7.278 8.395L7.304 14.773L16 16V8.395H7.278ZM16 0L7.33 1.244V7.658H16V0Z' fill='#39CE66'/>
            </g>
        </g>
        <defs>
            <clipPath id='clip0_500_335'>
                <rect width='16' height='16' fill='white'/>
            </clipPath>
        </defs>
    </svg>
)

const ICONS = {
    android: AndroidIcon,
    ios: IosIcon,
    linux: LinuxIcon,
    macos: MacosIcon,
    windows: WindowsIcon,
}

export const Header: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const BackMessage = intl.formatMessage( { id: 'pages.condo.tls.back' })

    const { push } = useRouter()
    const { isAuthenticated } = useAuth()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            push('/')
        } else {
            push('/auth')
        }
    }, [isAuthenticated, push])

    return (
        <Row style={LOGO_HEADER_STYLES}>
            <Col style={HEADER_LOGO_STYLE}>
                <Logo onClick={handleLogoClick}/>
            </Col>
            <Col>
                <Typography.Text>
                    <Link href='/auth/signin'>
                        <Typography.Link>{BackMessage}</Typography.Link>
                    </Link>
                </Typography.Text>
            </Col>
        </Row>
    )
}

/**
 * Does not adds extra elements around anchor component
 */
const BlankAnchor = styled(Anchor)`
    .ant-anchor-link {
        padding: 0;
    }
    /* This is a redundant element, that adds visual artefacts to the button */
    .ant-anchor-ink {
      display: none;
    }
`

type PosterFooterCardProps = {
    logoSrc: string
    description: string
    // If value is an anchor, like "#guide", then Button on click should scroll to appropriate anchor
    href: string
    buttonLabel: string
}

const PosterFooterCard: React.FC<PosterFooterCardProps> = ({ logoSrc, description, href, buttonLabel }): JSX.Element => (
    <Card>
        <Space size={24} direction='horizontal'>
            <Image src={logoSrc} preview={false}/>
            <Space size={16} direction='vertical'>
                <Typography.Paragraph>
                    {description}
                </Typography.Paragraph>
                {href[0] === '#' ? (
                    <BlankAnchor affix={false}>
                        <Anchor.Link
                            href={href}
                            title={<Button type='secondary' href={href}>{buttonLabel}</Button>}
                        />
                    </BlankAnchor>
                ) : (
                    <Button type='secondary' href={href}>{buttonLabel}</Button>
                )}
            </Space>
        </Space>
    </Card>
)

const MoreLinkStyle = {
    color: colors.gray[7],
    textDecoration: 'none',
}

const PosterHeader: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const MoreLinkMessage = intl.formatMessage( { id: 'pages.condo.tls.poster.more' })
    return (
        <Space direction='vertical' size={8} align='end'>
            <BlankAnchor affix={false}>
                <Anchor.Link
                    href='#guide'
                    title={
                        <Typography.Text type='secondary' size='medium'>
                            <Space direction='horizontal' size={4}>
                                <Typography.Link style={MoreLinkStyle}>{MoreLinkMessage}</Typography.Link>
                                <QuestionCircle size='small'/>
                            </Space>
                        </Typography.Text>
                    }
                />
            </BlankAnchor>
        </Space>
    )
}

// NOTE(antonal): non-standard gap is a requirement from design team. `Space` cannot be used, because it requires `size` property to be set
const PosterFooterSpace = styled.div`
  display: flex;
  flex-direction: column;
  gap: 100px;
  align-items: center;
`

const PosterFooter: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage( { id: 'pages.condo.tls.title' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.tls.description' })
    const AlreadyHaveCertMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.alreadyHaveCert' })
    const Card1DescriptionMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card1.description' })
    const Card1CtaMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card1.cta' })
    const Card2DescriptionMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card2.description' })
    const Card2CtaMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card2.cta' })

    const { breakpoints } = useLayoutContext()

    return (
        <PosterFooterSpace>
            <Space direction='vertical' align='center' size={24} width={480}>
                <div style={TEXT_CENTER_STYLE}>
                    <Space direction='vertical' align='center' size={16}>
                        <Typography.Title level={2}>
                            {TitleMessage}
                        </Typography.Title>
                        <Typography.Paragraph type='secondary'>
                            {DescriptionMessage}
                        </Typography.Paragraph>
                    </Space>
                </div>
                <LoginWithSBBOLButton block checkTlsCert={false} label={AlreadyHaveCertMessage}/>
            </Space>
            <Space size={20} direction={breakpoints.DESKTOP_SMALL ? 'horizontal' : 'vertical'}>
                <PosterFooterCard
                    logoSrc='/yandex-browser.png'
                    description={Card1DescriptionMessage}
                    buttonLabel={Card1CtaMessage}
                    href='https://browser.yandex.ru/download'
                />
                <PosterFooterCard
                    logoSrc='/mintsyfry.png'
                    description={Card2DescriptionMessage}
                    buttonLabel={Card2CtaMessage}
                    href='#guide'
                />
            </Space>
        </PosterFooterSpace>
    )
}


const IMAGE_STYLE: CSSProperties = { maxWidth: '300px', maxHeight: '300px', height: '100%', width: 'auto' }
const IMAGE_WRAPPER_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '50%' }
const POSTER_CONTENT_STYLE: CSSProperties = { padding: '24px', height: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'space-between' }

const TlsPagePoster: React.FC = (): JSX.Element => (
    <PosterWrapper>
        <Poster
            src='/dino/searching@2x.png'
            placeholderSrc='/404PosterPlaceholder.jpg'
            imageStyle={IMAGE_STYLE}
            imageWrapperStyle={IMAGE_WRAPPER_STYLE}
            posterContentStyle={POSTER_CONTENT_STYLE}
            Header={<PosterHeader/>}
            Footer={<PosterFooter/>}
        />
    </PosterWrapper>
)

const TextWrapper = styled.div`
  h3 {
    color: ${colors.gray[7]};
  }
`

/**
 * NOTE(antonal): since it is not possible to render raw HTML with current implementation of Markdown (plugin "rehype-raw" seems not to work), a button is represented as a bold link, like `**[label](url)**` and styled as a button
 * NOTE(antonal): with out of the box styles of Typography, markers of `<ol>` elements are positioned as block-level elements, pushing list item content below. That's why custom styles are implemented
 */
const MarkdownWrapper = styled(TextWrapper)`
    img {
        display: block;
        max-width: 627px;
    }
  
    ol {
        padding-left: 0;
        list-style: none;
        position: relative;
        counter-reset: olCounter;
        
        li {
          padding-left: 2ex;
          
          &:before {
            counter-increment: olCounter;
            content: counter(olCounter)".";
            display: inline-block;
            position: absolute;
            left: 0;
          }
          
          &::marker {
            display: none;
          }
        }
    }
  
    strong a {
        display: inline-block;
        border-radius: 8px;
        border: thin solid ${colors.black};
        box-sizing: border-box;
        height: 48px;
        line-height: 24px;
        padding: 11px 19px !important;
        text-decoration: none;
        margin-bottom: 24px;
    }
`

// Due to specifics of Ant implementation, only `Collapse.Panel` can be the children of `Collapse`.
function renderGuideSectionCollapse ( { name, guidesContent, intl }): JSX.Element {
    const TitleMessage = intl.formatMessage( { id: `pages.condo.tls.guide.section.${name}.title` })

    return (
        <Collapse.Panel
            key={name}
            header={
                <Space size={12} direction='horizontal'>
                    <Icon component={ICONS[name]}/>
                    <Typography.Title level={3}>{TitleMessage}</Typography.Title>
                </Space>
            }
        >
            <MarkdownWrapper>
                <Markdown>
                    {guidesContent[name]}
                </Markdown>
            </MarkdownWrapper>
        </Collapse.Panel>
    )
}

const StyledCollapse = styled(Collapse)`
    background: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: none;
  
    .ant-collapse-item {
      border: 1px solid #d9d9d9;
      border-radius: 12px !important;
      overflow: hidden;
      
      &.ant-collapse-item-active {
        .ant-collapse-content {
          border-top: none;
        }
      }
      
      .ant-collapse-header {
        padding: 24px !important;

        .ant-collapse-expand-icon {
          order: 2;

          > .ant-collapse-arrow {
            margin-right: 0 !important;
          }
        }
      }
    }
`

type GuidesContent = { [key: string]: string }

type TlsPageGuideProps = {
    guidesContent: GuidesContent
}

const TlsPageGuide: React.FC<TlsPageGuideProps> = ({ guidesContent }): JSX.Element => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage( { id: 'pages.condo.tls.guide.title' })
    const DescriptionMessage = intl.formatMessage( { id: 'pages.condo.tls.guide.description' })

    return (
        <div id='guide'>
            <Space direction='vertical' size={20}>
                <Typography.Title level={2}>
                    {TitleMessage}
                </Typography.Title>
                <Typography.Text type='secondary'>
                    {DescriptionMessage}
                </Typography.Text>
                <StyledCollapse style={{ width: '100%' }}>
                    {renderGuideSectionCollapse({ name: 'windows', guidesContent, intl })}
                    {renderGuideSectionCollapse({ name: 'macos', guidesContent, intl })}
                    {renderGuideSectionCollapse({ name: 'linux', guidesContent, intl })}
                    {renderGuideSectionCollapse({ name: 'android', guidesContent, intl })}
                    {renderGuideSectionCollapse({ name: 'ios', guidesContent, intl })}
                </StyledCollapse>
            </Space>
        </div>
    )
}

const TlsPageEpilog: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const EpilogTitle = intl.formatMessage({ id: 'pages.condo.tls.epilog.title' })
    const EpilogDescription = intl.formatMessage({ id: 'pages.condo.tls.epilog.description' })

    return (
        <TextWrapper>
            <Space direction='vertical' size={16}>
                <Typography.Title level={3}>
                    {EpilogTitle}
                </Typography.Title>
                <Typography.Paragraph type='secondary'>
                    {EpilogDescription}
                </Typography.Paragraph>
            </Space>
        </TextWrapper>
    )
}

type TlsPageProps = {
    guidesContent: GuidesContent
}

const TlsPage: PageComponentType<TlsPageProps> = ({ guidesContent }) => {
    return (
        <Space direction='vertical' size={20}>
            <Header/>
            <Space direction='vertical' size={60}>
                <TlsPagePoster/>
                <TlsPageGuide guidesContent={guidesContent} />
                <TlsPageEpilog/>
            </Space>
        </Space>
    )
}

TlsPage.container = (props) => (
    <EmptyLayout
        {...props}
        style={{ height: 'auto', padding: '60px', background: 'white' }}
    />
)
TlsPage.skipUserPrefetch = true

type Result = {
    guidesContent: GuidesContent
}

export const getServerSideProps: GetServerSideProps<Result> = async ({ req }) => {
    const extractedLocale = extractReqLocale(req)
    // Ensures that locale is finally taken only from constants to prevent using kind of "user input" in file traversing
    const localeIndex = Object.keys(LOCALES).indexOf(extractedLocale)
    const locale = localeIndex !== -1 ? Object.keys(LOCALES)[localeIndex] : defaultLocale
    let guidesFolderPath = path.resolve(conf.PROJECT_ROOT, 'apps/condo', 'lang', locale, 'pages/tls')
    if (!fs.existsSync(guidesFolderPath)) {
        guidesFolderPath = path.resolve(conf.PROJECT_ROOT, 'apps/condo', 'lang',  defaultLocale, 'pages/tls')
    }
    const fileNames = fs.readdirSync(guidesFolderPath)

    // Parse list of files like ['android.md', 'ios.md', 'linux.md', 'macos.md', 'windows.md']
    const guidesContent: GuidesContent = {}
    for (const fileName of fileNames) {
        const key = fileName.match(/^(\w+)\.md$/)[1]
        const fileBuffer = fs.readFileSync(path.resolve(guidesFolderPath, fileName))
        const { result: fileContent } = new ConvertToUTF8(fileBuffer).convert()
        guidesContent[key] = fileContent
    }
    return { props: { guidesContent } }
}

export default TlsPage
