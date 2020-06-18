
export default async function ({ debug, opt: { name } }) {
  
  return function (files) {
    for (let file of files) {
      file.key = this.resolvePath(file.path)
    }
  }
}