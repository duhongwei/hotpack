export default class {
  constructor() {
    this._eventList = {}
  }
  on(key, fun, freeze = false) {
    if (!(key in this._eventList)) {
      this._eventList[key] = []
    }
    if (!this._eventList[key].freeze) {
      this._eventList[key].push(fun)
    }
    else {
      throw new Error(`event ${key} has been freezed`)
    }
    if (freeze) {
      this._eventList[key].freeze = true
    }
  }
  async emit(key, data) {
    let eventList = this._eventList[key] || []
    for (let fun of eventList) {
     
      let isStop = await fun.call(this, data)
      if (isStop) {
        break
      }
    }
  }

}