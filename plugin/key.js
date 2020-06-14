
export default async function ({ debug, opt: { name } }) {
  const { config: { src } } = this
  return function (files) {
    for (let file of files) {

      let key = file.path.replace(src, '').split(/[/\\]/).join('/').substr(1)
      if (/\/node_modules\//.test(file.path)) {
        const pathList = file.path.split('/')
        let nodeKey = pathList[pathList.indexOf('node_modules') + 1]

        key = `node/${nodeKey}.js`

      }
      file.key = key
      debug(`${file.path} =>  ${key}`)
    }

  }
}