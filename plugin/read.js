
export default async function () {
  return async () => {
    //read content
    await this.fs.read(this.files)
  }
}