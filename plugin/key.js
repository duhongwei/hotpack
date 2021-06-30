
export default async function () {
  
  return function (files) {

    for (let file of files) {

      file.key = this.getKeyFromPhysicalPath(file.path, this.config.src)
     
    }
  }
  
}