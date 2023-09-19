class ProgressEventArgs {
    constructor(p, st) {
        this.progressPercentage = p;
        this.userState = st;
    }
}
module.exports = ProgressEventArgs;