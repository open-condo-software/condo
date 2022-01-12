import React from 'react'
import Icon from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'

export const AppealIconSVG = ({ width = 20, height = 20, bgColor = colors.white }) => {
    return (
        <svg width={width} height={height} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M18.667 2H5.333A3.337 3.337 0 002 5.333V16a3.337 3.337 0 003.333 3.333h3.724l2.472 2.472a.667.667 0 00.942 0l2.472-2.472h3.724c.883 0 1.73-.352 2.356-.977 0 0 .976-1.472.977-2.356V5.333A3.337 3.337 0 0018.667 2z"
                fill="currentColor"
            />
            <path
                d="M15.896 12H8.104c-.172 0-.337.096-.46.266a1.12 1.12 0 00-.19.643c0 .241.069.472.19.643.123.17.288.266.46.266h7.792c.172 0 .337-.096.46-.266.121-.17.19-.402.19-.643s-.069-.472-.19-.643c-.123-.17-.288-.266-.46-.266zM15.896 7.454H8.104c-.172 0-.337.096-.46.266a1.12 1.12 0 00-.19.643c0 .241.069.473.19.643.123.17.288.266.46.266h7.792c.172 0 .337-.095.46-.266.121-.17.19-.402.19-.643 0-.24-.069-.472-.19-.643-.123-.17-.288-.266-.46-.266z"
                fill={bgColor}
            />
        </svg>
    )
}

export const AppealIcon: React.FC = (props) => {
    return <Icon component={AppealIconSVG} {...props} />
}
