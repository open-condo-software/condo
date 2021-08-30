import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import styled from '@emotion/styled'

const FocusContainerWithoutMargin = styled(FocusContainer)`
  margin: 0;
`

export const MetersGroup = ({ Icon, meterResource }) => {
    return (
        <FocusContainerWithoutMargin>
            <Icon />
        </FocusContainerWithoutMargin>
    )
}