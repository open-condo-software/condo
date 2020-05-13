/** @jsx jsx */
import { css, Global, jsx } from '@emotion/core'
import { useRef, useState, useEffect } from 'react'
import { Input } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import QueueAnim from 'rc-queue-anim'
import { useImmer } from 'use-immer'
import io from 'socket.io-client'

const useSocket = (...args) => {
    const { current: socket } = useRef(io(...args))
    useEffect(() => {
        return () => {
            socket && socket.removeAllListeners()
            socket && socket.close()
        }
    }, [socket])
    return [socket]
}

const CHAT_SERVER_URL = 'http://localhost:3000/'

function MessageList ({ messages, user }) {
    const messagesEndRef = useRef(null)
    const scrollToBottom = () => {
        // we need to wait before an animation
        const x = setTimeout(() => {
            if (messagesEndRef) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }, 320)
        return () => clearTimeout(x)
    }
    useEffect(scrollToBottom, [messages])

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
                   onEnd={scrollToBottom}>
            {items}
            <div ref={messagesEndRef}/>
        </QueueAnim>
    )
}

function MessageInput ({ onSendMessage }) {
    const [message, setMessage] = useState('')

    function handleEnter (e) {
        e.preventDefault()
        if (!message) return
        setMessage('')
        onSendMessage(message)
    }

    return <div className="chat-input-bar">
        <div className={'chat-input-wrapper' + ((message) ? ' chat-input-not-empty' : '')}>
            <Input className={'chat-input'}
                   onPressEnter={handleEnter}
                   onChange={(e) => {setMessage(e.target.value)}}
                   value={message}
                   placeholder="Type something ..."/>
            <button className="chat-send" onClick={handleEnter}>
                <SendOutlined/>
            </button>
        </div>
    </div>
}

function Chat (props) {
    console.log(props)
    const $messagesContainer = useRef(null)
    const [messages, setMessages] = useImmer([])
    const [socket] = useSocket(CHAT_SERVER_URL)
    socket.connect()
    const user = socket.id
    debugger

    useEffect(() => {
        return socket.on('chat message', (msg) => {
            setMessages(messages => {messages.push(msg)})
        })
    }, [])

    function handleSendMessage (message) {
        socket.emit('chat message', { user, message, id: `${Date.now()}-${Math.random()}` })
    }

    function handleEndAnimation () {
        // TODO(pahaz): smooth the scroll
        // $messagesContainer.current.scrollTop = 99999
    }

    return (<>
        <div className="chat-window">
            <div className="chat-messages" ref={$messagesContainer}>
                <MessageList messages={messages} user={user}/>
            </div>
            <MessageInput onSendMessage={handleSendMessage}/>
        </div>
        {/* TODO(pahaz): remove useless styles */}
        <Global styles={css`
.chat-window {
    width: 310px;
    margin: 0 auto;
    overflow: hidden;
    border: 0px solid #36383a;
    border-width: 50px 15px;
    color: #474c57;
    border-radius: 20px;
}

@media screen and (max-width:380px) {
    .chat-window {
        border: none;
        border-radius: 0px;
    }
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

.chat-message-self {
    text-align: right;
}

.chat-input-bar {
    position: relative;
    background: #32A8E6;
}

.chat-input-wrapper {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
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
    color: #FFF;
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

.chat-input-not-empty .chat-send {
    color: #FFF;
}

                    `}/>
    </>)
}

export default Chat