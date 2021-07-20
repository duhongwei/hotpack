/**
 * 
 * not enabled
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
      
      if (/^(node|other|runtime)\//.test(key)) continue
   
      if (!fileSet.has(key)) {
     
        this.version.delKeyAndDeps(key)
        debug(`del key ${key} `)
        continue
      }
    }
  })

}