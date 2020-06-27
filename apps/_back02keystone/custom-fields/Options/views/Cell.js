/** @jsx jsx */
import { jsx } from '@emotion/core'

function OptionsCell ({ data, field }) {
    // This is the cell in the list table.
    // I will return a string of values like: "true, false, true"
    if (data === null) {
        data = field.getDefaultValue()
    }
    return Object.keys(data).map((label, i) => (
        <p key={`optionscell${label}-${i}`}>{`${label}: ${data[label]}`}</p>
    ))
}

export default OptionsCell
