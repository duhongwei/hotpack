export default async function ({ debug }) {
  let { version } = this
  return async function (files) {
    //debug(files.map(file => file.key))
    for (let file of files) {
      file.content = file.content.replace(/\bimport\s+['"](.+.html)['"]/g, (match, path) => {

        let key = this.resolvePath({ path, file: file.key })
        let url = `/${key}`
        debug(`${path}  =>  ${url}`)
        version.set({
          key,
          dep: file.key
        })
        return ''
      })
    }
  }
}