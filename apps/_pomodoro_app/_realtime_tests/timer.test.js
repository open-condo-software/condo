const Timer = require('../realtime/application/Timer');

//todo(toplenboren) move to utils.js maybe
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test('Timer start is working', () => {
    const x = new Timer()
    x.start()
    sleep(1000).then(() => {
        expect(x.getTime()).toBe(1);
    })
});

test('Timer pause is working', () => {
    const x = new Timer()
    x.start()
    sleep(1000).then(() => {
        x.pause()
        sleep(1000).then(() => {
            expect(x.getTime()).toBe(1);
        })
    })
});

test('Timer reset is working', () => {
    const x = new Timer()
    x.start()
    sleep(1000).then(() => {
        expect(x.getTime()).toBe(1)
        x.reset()
        expect(x.getTime()).toBe(0)
    })
});

test('Timers are async', async () => {
    const x = new Timer()
    const y = x
    const z = x
    // first client pushes start:
    x.start()
    await sleep(1000)
    // second client pushes start
    y.start()
    // third client pushes start
    z.start()
    await sleep(1000)
    // somebody pauses the timers
    y.pause()
    await sleep(1000)
    expect(x.getTime()).toBe(2)
});
