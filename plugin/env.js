export default async function ({ debug }) {
  const { util: { isJs } } = this
  this.on('afterSlim', function (files) {
    for (let file of files) {
      if (!isJs(file.key)) continue
      debug(`env ${file.key}`)
      file.content = file.content.replace(/process.env.NODE_ENV/g, `"${process.env.NODE_ENV}"`)
      file.content = file.content.replace(/process.env.DATA_ENV/g, `"${process.env.DATA_ENV}"`)
    }
  })
}