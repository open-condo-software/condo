import { Comment as AntComment } from 'antd'
import { Comment as TComment } from './index'
import styled from '@emotion/styled'
import { green } from '@ant-design/colors'
import { useIntl } from '@core/next/intl'
import { formatDate } from '../../../ticket/utils/helpers'

interface ICommentProps {
    comment: TComment,
    onDeleteClicked: () => void,
    onUpdateClicked: () => void,
}

const StyledComment = styled.div`
    background: white;
    margin-top: 1em;
    border-radius: 8px;
    padding: 12px;
    box-shadow: rgba(0,0,0,0.15) 0px 1px 3px;
    font-size: 14px;
    line-height: 22px;
    
    footer {
      margin-top: 0.6em;
      > span {
        color: ${green[6]};
      }
    }
`


export const Comment: React.FC<ICommentProps> = ({ comment }) => {
    const intl = useIntl()
    return (
        <StyledComment>
            <div>
                {comment.content}
            </div>
            <footer>
                <span>{comment.user.name}</span>, <time>{formatDate(intl, comment.createdAt)}</time>
            </footer>
        </StyledComment>
    )
}