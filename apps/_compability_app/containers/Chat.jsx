/** @jsx jsx */
import { css, Global, jsx } from '@emotion/core'
import { useRef, useState } from 'react'
import { Input } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import QueueAnim from 'rc-queue-anim'


function MessageList (props) {
    const messages = props.messages
    const user = props.user
    const onEnd = props.onEnd

    const items = messages.map((msg) => {
        return (
            <li key={msg.id}
                className={msg.user === user ? 'chat-message chat-message-self' : 'chat-message chat-message-friend'}>
                <div className="chat-message-bubble">
                    {msg.message}
                </div>
            </li>
        )
    })

    return (
        <QueueAnim delay={300} className="chat-messages-list" component="ul" type={['right', 'left']} leaveReverse
                   onEnd={onEnd}>
            {items}
        </QueueAnim>
    )
}

function Chat (props) {
    const $messagesContainer = useRef(null)
    const user = 'User2'
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([
        { user: 'User1', id: 'm1', message: 'Hey' },
        { user: 'User3', id: 'm21', message: 'this is a demonstration of the gooey effect on a chat window' },
        { user: 'User3', id: 'm22', message: 'this is a demonstration of the gooey effect on a chat window' },
        { user: 'User3', id: 'm23', message: 'this is a demonstration of the gooey effect on a chat window' },
        { user: 'User2', id: 'm31', message: 'please :)' },
        { user: 'User3', id: 'm24', message: 'this is a demonstration of the gooey effect on a chat window' },
        { user: 'User2', id: 'm32', message: 'please :)' },
        { user: 'User3', id: 'm25', message: 'this is a demonstration of the gooey effect on a chat window' },
        { user: 'User2', id: 'm4', message: 'HELP!' },
    ])

    function handleEnter (e) {
        e.preventDefault()
        if (!message) return
        messages.push({ user: user, id: String(Math.random()), message: message })
        setMessages(messages)
        setMessage('')
    }

    function handleEndAnimation () {
        // TODO(pahaz): smooth the scroll
        $messagesContainer.current.scrollTop = 99999
    }

    return (<>
        <div className="chat-window">
            <div className="chat-messages" ref={$messagesContainer}>
                <MessageList messages={messages} user={user} onEnd={handleEndAnimation}/>
            </div>
            <div className="chat-input-bar">
                <div className="chat-info-container"/>
                <div className="chat-effect-container">
                    <div className="chat-effect-bar"/>
                </div>
                <div className="chat-input-wrapper">
                    <Input className="chat-input" onPressEnter={handleEnter}
                           onChange={(e) => {setMessage(e.target.value)}} value={message}
                           placeholder="Type something ..."/>
                    <button className="chat-send" onClick={handleEnter}>
                        <SendOutlined/>
                    </button>
                </div>
            </div>
        </div>
        {/* TODO(pahaz): remove useless styles */}
        <Global styles={css`
.chat-window button:focus {
    -webkit-tap-highlight-color: rgba(255,255,255,0);
    -webkit-tap-highlight-color: transparent;
    outline: none;
}

.chat-window {
    width: 310px;
    margin: 0 auto;
    overflow: hidden;
    border: 0px solid #36383a;
    border-width: 50px 15px;
    color: #474c57;
    border-radius: 20px;
    font-family: 'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

@media screen and (max-width:380px) {
    .chat-window {
        border: none;
        border-radius: 0px;
    }
}

.chat-window a {
    color: #eab1c6;
}

.chat-window a:hover,
.chat-window a:focus {
    color: #C7668A;
}

.chat-messages {
    height: 460px;
    overflow-x: hidden;
    overflow-y: auto;
    width: 100%;
    position: relative;
    border-radius: 2px 2px 0 0;
    background: #BEE4F9;
}

.chat-messages-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
    width: 100%;
    padding: 15px 25px 0;
}

.chat-message {
    position: relative;
    font-size: 0;
    margin-bottom: 10px;
}

.chat-message-effect {
    position: absolute;
}

.chat-message-bubble {
    display: inline-block;
    font-size: 14px;
    max-width: 350px;
    background: #fff;
    padding: 8px 14px;
    border-radius: 18px;
    min-width: 0;
}

.chat-message-self.chat-message-merge-start .chat-message-bubble {
    border-bottom-right-radius: 0;
}

.chat-message-self.chat-message-merge-middle .chat-message-bubble {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.chat-message-self.chat-message-merge-end .chat-message-bubble {
    border-top-right-radius: 0;
}

.chat-message-self {
    text-align: right;
}

.chat-message-self .chat-message-bubble,
.chat-message-effect .chat-message-bubble { 
    background: #32a8e6;
    color: #fff;
    text-align: left;
}

.chat-input-bar {
    position: relative;
    background:#32A8E6;
}

.chat-input-wrapper {
    position: relative;
    z-index: 2;
    /*background: #32A8E6;*/
    padding: 0.5em 0;
    border-radius: 0 0 2px 2px;
    color: #fff;
}

.chat-input-wrapper,
.chat-send {
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    -webkit-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    -webkit-justify-content: center;
    justify-content: center;
    font-size: 16px;
}

.chat-input {
    outline: none;
    resize: none;
    overflow: hidden;
    min-height: 38px;
    flex: 1;
    font-size: 14px;
    padding: 10px 0 7px 10px;
    cursor: text;
    background: transparent;
    border: transparent;
    box-shadow: none !important;
}

.chat-input::placeholder {
  color: #2B8EC2;
}

.chat-send {
    background: transparent;
    border: none;
    position: relative;
    overflow: hidden;
    padding: 0 0.75em;
    color: inherit;
    -webkit-transition: color 0.6s;
    transition: color 0.6s;
}

.chat-input:empty + .chat-send {
    color: #2B8EC2;
}

.chat-send>i {
    position: relative;
}

.chat-effect-container {
    position: absolute;
    top: -100px;
    width: 100%;
}

.chat-effect-bar {
    background: #32a8e6;
    position: absolute;
    top: 100px;
    width: 100%;
    height: 40px;
    -webkit-transform: rotateY(0);
    transform: rotateY(0);
}

.chat-effect-dots {
    position: absolute;
}

.chat-effect-dot {
    background: #32a8e6;
    position: absolute;
    width: 15px;
    height: 15px;
    border-radius: 100%;
}

.chat-info-container {
    position: absolute;
    top: -20px;
    font-size: 12px;
    color: #2B8EC2;
}

.chat-info-typing {
    position: absolute;
    left: 80px;
    white-space: nowrap;
}
                    `}/>
    </>)
}

export default Chat