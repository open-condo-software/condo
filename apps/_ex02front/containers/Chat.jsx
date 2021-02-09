/** @jsx jsx */
import { css, Global, jsx } from '@emotion/core'
import { useEffect, useRef, useState } from 'react'
import { Input } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import QueueAnim from 'rc-queue-anim'
import { useImmer } from 'use-immer'
import socketIOClient from 'socket.io-client'

const CHAT_SERVER_URL = 'http://localhost:3000/'
const CHAT_DEBUG = false

function MessageList ({ messages, user }) {
    const $messagesContainer = useRef(null)
    const $endOfMessages = useRef(null)

    useEffect(() => {
        // we need to wait before an animation
        setTimeout(() => {
            if ($endOfMessages.current) $endOfMessages.current.scrollIntoView({ behavior: 'smooth' })
        }, 320)
    }, [messages])

    function handleEndAnimation () {
        $messagesContainer.current.scrollTop = 99999
    }

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
        <div className="chat-messages" ref={$messagesContainer}>
            <QueueAnim delay={300} className="chat-messages-list" component="ul" type={['right', 'left']} leaveReverse
                       onEnd={handleEndAnimation}>
                {items}
            </QueueAnim>
            <div key='last' ref={$endOfMessages}/>
        </div>
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

    return (
        <div className="chat-input-bar">
            <div className={`chat-input-wrapper ${(message) ? 'chat-input-not-empty' : ''}`}>
                <Input className="chat-input" onPressEnter={handleEnter}
                       onChange={(e) => {setMessage(e.target.value)}} value={message}
                       placeholder="Type something ..."/>
                <button className="chat-send" onClick={handleEnter}>
                    <SendOutlined/>
                </button>
            </div>
        </div>
    )
}

function Chat () {
    const [messages, setMessages] = useImmer([])
    const [user, setUser] = useState('unknown')
    const [socket, setSocket] = useState(null)

    useEffect(() => {
        if (CHAT_DEBUG) console.log('chat', 'init')
        const socket = socketIOClient(CHAT_SERVER_URL)
        socket.on('connect', () => {
            if (CHAT_DEBUG) console.log('chat', socket.id, 'connected')
            setUser(socket.id)
            setSocket(socket)
        })
        socket.on('chat message', (msg) => {
            if (CHAT_DEBUG) console.log('chat', socket.id, 'receive', msg)
            setMessages(messages => {messages.push(msg)})
        })
        return () => {
            if (CHAT_DEBUG) console.log('chat', socket.id, 'destroyed')
            socket.removeAllListeners()
            socket.close()
            setSocket(null)
        }
    }, [])

    function handleSendMessage (message) {
        const msg = { user, message, id: `${Date.now()}-${Math.random()}` }
        socket && socket.emit('chat message', msg)
        if (CHAT_DEBUG) console.log('chat', (socket) ? socket.id : null, 'send', msg)
    }

    return (<>
        <div className="chat-window">
            <MessageList messages={messages} user={user}/>
            <MessageInput onSendMessage={handleSendMessage}/>
        </div>
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

.chat-message-bubble {
    display: inline-block;
    font-size: 14px;
    max-width: 350px;
    background: #fff;
    padding: 8px 14px;
    border-radius: 18px;
    min-width: 0;
}

.chat-message-self .chat-message-merge-start .chat-message-bubble {
    border-bottom-right-radius: 0;
}

.chat-message-self .chat-message-merge-middle .chat-message-bubble {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.chat-message-self .chat-message-merge-end .chat-message-bubble {
    border-top-right-radius: 0;
}

.chat-message-self {
    text-align: right;
}

.chat-message-self .chat-message-bubble { 
    background: #32a8e6;
    color: #fff;
    text-align: left;
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
    color: #2B8EC2;
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