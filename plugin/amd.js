import Amd from '../lib/Amd.js'

export default async function ({ debug }) {

  return async function (files) {
    for (let file of files) {
      debug(`amd ${file.key}`)
      file.content = new Amd(file).toString()
    }
  }
}