
export default async function ({ debug, opt: { name } }) {
  return async function (files) {
    await this.emit(name, files)
  }
}