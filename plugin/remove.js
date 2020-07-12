/**
 * remove的意义，清洁是次要的，主要是为了不需要全新编译也可以发现import的文件已经丢失
 * 
 */
export default async function ({ debug }) {

  this.on('afterKey', function (files) {

    debug('on event afterKey')
    let fileSet = new Set()
    for (let file of files) {
      fileSet.add(file.key)
    }
    let versionData = this.version.get()
    let keys = Object.keys(versionData)

    for (let key of keys) {
      if (/^(other|runtime)\//.test(key)) continue
   
      if (!fileSet.has(key)) {
        delete versionData[key]
        debug(`del key ${key} `)
        continue
      }
    }
  })

}