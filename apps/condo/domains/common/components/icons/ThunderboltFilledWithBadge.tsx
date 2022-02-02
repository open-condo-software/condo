/** @jsx jsx */
import styled from '@emotion/styled'
import { ThunderboltFilled } from '@ant-design/icons'
import { jsx } from '@emotion/core'
import { useTicketsCounter } from '@condo/domains/ticket/components/UnreadTickets'
import { useLayoutContext } from '../LayoutContext'


const Badge = styled.div`
    position: absolute;
    width: 10px;
    height: 10px;
    background: #EB3468;
    border-radius: 8px;
    border: 2px solid #FFFFFF;
    right: 0;
`
const Wrapper = styled.div`
    position: relative;
`
export const ThunderboltFilledWithBadge = () => {
    const { isCollapsed } = useLayoutContext()
    const ticketsCounter = useTicketsCounter()

    if (ticketsCounter.numberOfUnreadTickets > 0) {
        if (isCollapsed){
            return <Wrapper>
                <Badge />
                <ThunderboltFilled />
            </Wrapper>
        }
        else {
            return null
        }
    }
    return  <ThunderboltFilled />
}