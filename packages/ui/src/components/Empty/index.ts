import './style.less'
import { Empty as EmptyComponent, DEFAULT_IMAGE } from './empty'
export type { EmptyProps } from './empty'

export type EmptyType = typeof EmptyComponent & {
    DEFAULT_IMAGE: string
}

const Empty = EmptyComponent as EmptyType
Empty.DEFAULT_IMAGE = DEFAULT_IMAGE

export { Empty }
