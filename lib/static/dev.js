import Base from './base'
export default class extends Base {
  constructor(spack, debug) {
   super(spack,debug)
  }
  toCssString(key) {
    let depList = super.toCssString(key)
    let result = ''
    for (let dep of depList) {
      result+=`<link rel="stylesheet" href="/${dep}">`
    }
    return result
  }
  toJsString(key) {
    let depList = super.toJsString(key)
    let result=''
    for (let dep of depList) {
      result+=`<script src="/${dep}"></script>`
    }
    return result
  }
}
