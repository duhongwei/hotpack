import { isCss, isJs, format } from './util'

export default class {
  constructor(spack, debug) {
    this.spack = spack
    this.debug = debug
  }
  toCssString(file) {
    return this.spack.dep.get(file).filter(item => isCss(item))
  }
  toJsString(file) {
    return this.spack.dep.get(file).filter(item => isJs(item))
  }
  render(item) {
    const css = this.toCssString(item.path)
    const js = this.toJsString(item.path)
    const main = this.spack.config.server.render(item.path)
    const data = {
      css,
      js,
      main
    }
    item.content = format(item.content, data)
  }
}
