import Base from './base'
export default class extends Base {
  constructor(spack, debug) {
    super(spack,debug)
  }
  toCssString(key) {
    let depList=super.toCssString(key)
  }
  toJsString(key) {
    let depList=super.toJsString(key)
  }
}
