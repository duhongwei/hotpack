import buble from 'buble'
export default async function ({ debug, opt: { transforms = {} } }) {

  let { util: {isJs, },config: { logger } } = this
  this.on('afterSlim', (files) => {
    const opts = {
      transforms: Object.assign({ modules: false }, transforms)
    }
    for (let file of files) {
     
      if (!isJs(file.key)) continue
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