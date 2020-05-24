import { isHtml } from '../util'
import Static from '../lib/static'
//package:[/\/user\//,[['a.js','b.js']]]
export default function () {
  return async function (spack, debug) {
    const static = new Static(spack,debug)
    spack.logger.log(`run plugin html`)
    for (let file of files) {
      if (!isHtml(file)) continue
      debug(`render ${file}`)
      file.content = static.render(file)
    }
  }
}