export default async function ({ debug }) {
  return async function (files) {
    for (let file of files) {
      if (this.isPro()) {
        if (/\.(css|js)$/.test(file.key)) {
          debug(`clear ${file.key}`)
          file.del = true
        }
      }
    }
    this.del()
  }
}