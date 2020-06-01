export default async function ({ debug }) {
  let { version, util: { isHtml } } = this
  return function (files) {

    for (let file of files) {
      debug(`dep ${file.key}`)
      let dep = version.getDep(file.key)
      debug(dep)
      file.dep = dep
    }
  }
}