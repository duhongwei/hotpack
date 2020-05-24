export default function (config) {
  return async function (spack, debug) {
    let { Fs, resolvePath, config: { logger } } = spack
    logger.log('run plugin node')
    spack.on('afterParse', () => {
      const path = resolvePath('package.json')
      if (!Fs.existsSync(path)) {
        logger.error('package.json not exist')
        process.exit(1)
      }
      let json = Fs.readFileSync(path)
      try {
        json = JSON.parse(json)
      }
      catch (e) {
        logger.error(`parse package.json failed. ${e.message}`)
        process.exit(1)
      }
      let dependencies = json.dependencies || {}
      const keys = Object.key(dependencies)
      for (let key of keys) {
        let files = []
        if (key in config) {
          let { path, publicKey = key, deps = [] } = config[key]
          let path = resolvePath(path)
          if (Fs.existsSync(path)) {
            let code = Fs.readFileSync(path)
            let importInfo = []
            if (deps.length > 0) {
              importInfo = deps.map(item => {
                return {
                  type: 'js',
                  file: item,
                  token: [{ 'from': 'default', 'to': item }]
                }
              })
            }

            let exportInfo = [
              {
                from: `window['${publicKey}']`,
                to: 'default'
              }
            ]

          }
          else {
            logger.error(`node dependencie ${key} not exist\nmaybe you should run "npm install ${nodeKey} --save"`)
            process.exit(1)
          }
        }
        else {
          debug('omit node dependencie ${key}')
        }
        files.push({
          key,
          content
        })
      }
    })
  }
}