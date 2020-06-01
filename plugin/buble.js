import buble from 'buble'
export default async function ({ debug, opt: { transforms = {} } }) {

  let { config: { logger } } = this
  this.on('buble', (files) => {
    const opts = {
      transforms: Object.assign({ modules: false }, transforms)
    }
    for (let file of files) {

      debug(`buble ${file.key}`)
      try {
        file.content = buble.transform(file.content, opts).code
      }
      catch (error) {
        console.log(file.content.substr(0,500))
        logger.error(`error when compile ${file.key}\n ${error.message}`)
      }
    }
  })
}