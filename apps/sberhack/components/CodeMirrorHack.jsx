import React from 'react'
import {UnControlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'

export default (props) => (
    <CodeMirror
        {...props}
        options={{ theme: 'material', mode: props.mode }}
    />
)
