import { Comment as AntComment } from 'antd'
import { Comment as TComment } from './index'
import { useIntl } from '@core/next/intl'
import { formatDate } from '../../../ticket/utils/helpers'

interface ICommentProps {
    comment: TComment,
    onDeleteClicked: () => void,
    onUpdateClicked: () => void,
}

export const Comment: React.FC<ICommentProps> = ({ comment }) => {
    const intl = useIntl()
    return (
        <AntComment
            content={comment.content}
            author={comment.user.name}
            datetime={formatDate(intl, comment.createdAt)}
        />
    )
}