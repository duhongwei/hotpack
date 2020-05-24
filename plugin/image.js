export default function () { 
  return async function (spack) { 
    const { util: { isText, isImage } } = spack
    spack.on('afterRead', function () { 
      let imageList = files.filter(({ file, content }) => {
        if (isImage(file) && version.diff(item)) {   
          return true
        }
        else {
          return false
        }
      }).map(item =>cdn.upload(item))
      //upload 给item 加 hash返回
      Promise.all(imageList).then(list => {
        list.forEach(item => {
          version.set(item)
        })
        let textList = files.filter(file => isText(file))
        for (let item of textList) {
          let changed=false
          item.content = item.content.replace(/aa/g,function(){
            changed=true
          })
          if (changed) {
            version.set(item)
          }
        }
      })
    })
    
  }
}