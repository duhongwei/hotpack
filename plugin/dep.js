export default async function ({ debug }) {
  let { version, util: { isHtml } } = this
  return function (files) {
    /*   let keys = Object.keys(version.get()).filter(item => isHtml(item))
      let map = new Map()
      for (let file of files) { 
        map.set(file.key,file)
      } */
    for (let file of files) {
      debug(`dep ${file.key}`)
      file.dep = version.getDep(file.key)
    }
  }
}