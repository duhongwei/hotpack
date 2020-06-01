
export default async function ({ debug, opt: { name } }) {
  const { config: { src } } = this
  return function (files) {
    for (let file of files) {

      let key = file.path.replace(src, '').split(/[/\\]/).join('/').substr(1)
      debug(`${file.path} => ${key}`)
      file.key = key
    }
  }
}