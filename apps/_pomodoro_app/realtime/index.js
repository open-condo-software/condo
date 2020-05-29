function init (io) {
    let timerValue = 0;
    let timerIsAlive = false;
    let timer;

    io.on('connection', (socket) => {
        console.log(socket.id, 'a user connected')

        socket.on('start', (msg) => {
            if (!timerIsAlive) {
                timer = setInterval(() => {
                    timerValue += 1
                    io.emit('timer', timerValue)
                } , 1000)
                timerIsAlive = true;
            }
            console.log('started timer', socket.id)
        })

        socket.on('pause', () => {
            if (timerIsAlive) {
                clearInterval(timer)
                timer = 0
                timerIsAlive = false;
            }
            console.log(socket.id, 'paused timer')
        })

        socket.on('clear', () => {
            io.emit('pause')
            timerValue = 0;
            io.emit('timer', timerValue)
            console.log('timer was cleared')
        })
    })
}

module.exports = {
    init,
}
