class TestClass {
    name = 'name'

    constructor () {
        this.func = this.func.bind(this)
    }

    childFunc () {
        console.log(this.name)
    }

    func () {
        this.childFunc()
    }

    boo () {
        console.log()
    }
}

const a = new TestClass()
const aFunc = a.func

a.name = 'chigibora'

a.func()
aFunc()