
export default async function () {
  
  return function (files) {

    for (let file of files) {
      if('key' in file) continue
      file.key = this.getKeyFromPhysicalPath(file.path)
    
    }
  }
  
}