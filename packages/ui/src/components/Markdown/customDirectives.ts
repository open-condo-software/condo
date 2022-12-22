import { Node } from 'unist'
import { visit } from 'unist-util-visit'


export default function customDirectives () {
    return transform

    function transform (tree: Node) {
        return visit(tree, ['textDirective', 'leafDirective', 'containerDirective'], ondirective)
    }

    function ondirective (node: any) {
        const { name, attributes, children } = node
        const text = children[0]?.value ?? ''

        const data = node.data || (node.data = {})
        data.hName = 'section'
        data.hProperties = { ...attributes, text, type: name }
        return data
    }
}
