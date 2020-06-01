export default class {
  constructor() {
    this._eventList = {}
  }
  on(key, fun) {
    if (!(key in this._eventList)) {
      this._eventList[key] = []
    }
    this._eventList[key].push(fun)
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