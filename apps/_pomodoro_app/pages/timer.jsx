import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
// TODO(toplenboren): remove hardcoded ENDPOINT value
const ENDPOINT = "http://127.0.0.1:3001";

export default function Timer() {
    const [response, setResponse] = useState("");
    const socket = socketIOClient(ENDPOINT);

    useEffect(() => {
        socket.on("timer", data => {
            setResponse(data);
        });
    }, []);

    return (
    <>
        <p>
            Timer {response}
        </p>

        <button onClick={() => {
           socket.emit('start')
        }}>
            Run Timer
        </button>

        <button onClick={() => {
            socket.emit('pause')
        }}>
            Pause Timer
        </button>

        <button onClick={() => {
            socket.emit('clear')
        }}>
            Clear Timer
        </button>
    </>
    );
}
