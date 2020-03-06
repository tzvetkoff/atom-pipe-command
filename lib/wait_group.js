'use babel';

export default class WaitGroup {
  constructor(callback) {
    this.callback = callback;
    this.jobs = 0;
  }

  add() {
    ++this.jobs;
  }

  done() {
    if (--this.jobs <= 0) {
      this.callback();
    }
  }
}
