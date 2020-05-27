import buble from 'buble'
export default async function ({ spack, debug, debugPrefix, opt: { transforms = {} } }) {
  debug = debug(`${debugPrefix}buble`)
  debug('init plugin buble')

  let { util: { isJs }, config: { logger } } = spack
  spack.on('beforeParse', () => {
    logger.log('run plugin buble')
    const opts = {
      transforms: Object.assign({ modules: false }, transforms)
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
        logger.error(`error when compile ${file.key}\n ${error.message}`)
      }
    }
  })
}