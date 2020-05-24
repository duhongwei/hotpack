import buble from 'buble'
export default function ({ transform = {} } = {}) {
  return async function (spack, debug) {
    let { isPro, util: { isJs }, config: { logger } } = spack

    logger.log('run plugin buble')
    const opts = {
      transforms: Object.assign({}, transform, {
        modules: false
      })
    }
    for (let file of spack) {
      if (!isJs(file.key)) {
        continue
      }
      debug(`buble ${file.key}`)
      try {
        file.content = buble.transform(file.content, opts).code
      }
      catch (error) {
        //错误到止为止
        logger.error(`error when compile ${file.key}\n ${error.message}`)
        if (isPro()) {
          process.exit(1)
        }
        else {
          return false
        }
      }
    }
  }
}