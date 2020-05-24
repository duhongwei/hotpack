import path from 'path'
export default function () {
  return async function (spack, debug) {
    const { util: { isHtml }, config: { logger }, __dirname, Fs } = spack
    logger.log('run plugin debug')
    const content = await Fs.readFile(path.join(__dirname, 'browser/debug.js'))
    const key = 'runtime/debug.js'
    spack.on('beforeWrite', function () {
      for (let file of spack) {
        if (!isHtml(file.key)) continue
        spack.add({
          key,
          content
        })
        file.content = file.content.replace('</body>',
          `<script>
            require('${key}').run();
          </script>
          </body>`
        )
      }
    })
  }
}