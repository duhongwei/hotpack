
export default async function ({ opt: { name } }) {
  return async function (files) {
    await this.emit(name, files)
  }
}