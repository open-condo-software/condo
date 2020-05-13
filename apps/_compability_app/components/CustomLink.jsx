import Router from 'next/router'

function CustomLink({ path, children }) {
    return (
        <div onClick={() => Router.push(path)}>
            {children}
        </div>
    )
}

export default CustomLink
