
export default async function () {
  
  return function (files) {

    for (let file of files) {
      //有key了就不用再生成key了。在之前补充的path可能会自带key
      if('key' in file) continue
      file.key = this.getKeyFromPhysicalPath(file.path)
    
    }
  }
  
}