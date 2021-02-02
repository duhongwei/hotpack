/**
 * remove的意义，清洁是次要的，主要是为了不需要全新编译也可以发现import的文件已经丢失
 * 
 * 不光是要删除没有的文件，还要从version.json中删除相应的key，和相应的依赖
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
     
        //删除这个key和相关的依赖
        this.version.delKeyAndDeps(key)
        debug(`del key ${key} `)
        continue
      }
    }
  })

}