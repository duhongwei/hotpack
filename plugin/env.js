export default async function ({ debug }) {
  const { util: { isJs } } = this
  //The afterslim event is not appropriate. If the content of the file has not changed, the changes in process.env will not be applied to the file
  this.on('afterUseImage', function (files) {
    for (let file of files) {
      if (!isJs(file.key)) continue
      debug(`env ${file.key}`)
      file.content = file.content.replace(/process.env.NODE_ENV/g, `"${process.env.NODE_ENV}"`)
      file.content = file.content.replace(/process.env.DATA_ENV/g, `"${process.env.DATA_ENV}"`)
    }
  })
}