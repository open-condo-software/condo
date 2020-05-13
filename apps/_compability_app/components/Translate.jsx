import * as React from "react"
import { useIntl } from '../lib/intl';

function Translate(props) {
    const intl = useIntl()

    return (
        <React.Fragment>
            {intl.formatMessage(props)}
        </React.Fragment>
    )
}

export default Translate;
