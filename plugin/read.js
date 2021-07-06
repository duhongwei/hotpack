
export default async function () {
  return async () => {
    //为 this.files 的每个 file 补充 content
    await this.fs.read(this.files)
  }
}