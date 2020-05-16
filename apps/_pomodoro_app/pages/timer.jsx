import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:3001";

export default function Timer() {
    const [response, setResponse] = useState("");

    useEffect(() => {
        const socket = socketIOClient(ENDPOINT);
        socket.on("chat message", data => {
            setResponse(data);
        });
    }, []);

    return (
        <p>
            Message {response}
        </p>
    );
}
