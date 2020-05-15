import * as React from "react"
import { useIntl } from '@core/next/intl';

function Translate(props) {
    const intl = useIntl()

    return (
        <React.Fragment>
            {intl.formatMessage(props)}
        </React.Fragment>
    )
}

export default Translate;
