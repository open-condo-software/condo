import React from 'react'
import Icon from '@ant-design/icons'

interface BarChartIconNewProps {
    viewBox?: string
}

const BarChartIconNewSVG: React.FC<BarChartIconNewProps> = ({ viewBox = '0 0 20 20' }) => {
    return (
        <svg width="20" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M.3093.3261C.5073.1173.776 0 1.0561 0c.28 0 .5487.1173.7467.3261.198.2089.3093.4921.3093.7874V17.073c0 .1857.07.3637.1945.495.1245.1313.2934.205.4695.205h16.1678c.2801 0 .5487.1174.7468.3262.198.2088.3093.492.3093.7874 0 .2953-.1113.5785-.3093.7874-.1981.2088-.4667.3261-.7468.3261H2.7761c-.7363 0-1.4424-.3084-1.963-.8573C.2925 18.5937 0 17.8492 0 17.0729V1.1135C0 .8182.1113.535.3093.3261ZM5 16c-.5523 0-1-.4477-1-1V8c0-.5523.4477-1 1-1s1 .4477 1 1v7c0 .5523-.4477 1-1 1Zm3-1c0 .5523.4477 1 1 1s1-.4477 1-1V6c0-.5523-.4477-1-1-1s-1 .4477-1 1v9Zm5 1c-.5523 0-1-.4477-1-1V8c0-.5523.4477-1 1-1s1 .4477 1 1v7c0 .5523-.4477 1-1 1Zm3-1c0 .5523.4477 1 1 1s1-.4477 1-1V4c0-.5523-.4477-1-1-1s-1 .4477-1 1v11Z" fill="currentColor"/>
        </svg>
    )
}

export const BarChartIconNew: React.FC = (props) => {
    return (
        <Icon component={BarChartIconNewSVG} {...props}/>
    )
}
