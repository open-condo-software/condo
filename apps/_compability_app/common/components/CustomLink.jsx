import Router from 'next/router'
import * as React from 'react'

function CustomLink({ path, children }) {
    const clickHandler = React.useCallback(
        () => Router.push(path),
        [path],
    );

    return (
        <a onClick={clickHandler}>
            {children}
        </a>
    )
}

export default CustomLink
