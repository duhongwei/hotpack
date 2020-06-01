/**
 * 内部调用。因为devDebug和runtime是一套
 */
import path from 'path'

export default async function ({ debug }) {

  const { util: { isHtml }, root, fs } = this

  const content = await fs.readFile(path.join(root, 'browser/debug.js'))

  return async function (files) {
    if (this.isPro()) {
      this.config.logger.log(`skip devDebug plugin`)
      return
    }
    for (let file of files) {
      if (!isHtml(file.key)) continue
      debug(`devDebug ${file.key}`)
      file.content = file.content.replace('</body>',
        `<script>
           ${content}
          </script>
          </body>`
      )
    }
  }
}