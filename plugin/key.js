
export default async function () {
  
  return function (files) {

    for (let file of files) {

      file.key = this.resolvePath(file.path, this.config.src)
     


    }
  }
  
}