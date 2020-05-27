import path from 'path'
export default async function ({ spack, debug, debugPrefix }) {

  debug = debug(`${debugPrefix}debug`)
  debug('init plugin debug')

  const { util: { isHtml }, config: { logger }, root,fs } = spack
  logger.log('run plugin debug')
  const content = await fs.readFile(path.join(root, 'browser/debug.js'))
  const key = 'runtime/debug.js'
  spack.on('beforeWrite', function () {
    for (let file of spack) {
      if (!isHtml(file.key)) continue
      spack.add({
        key,
        content,
        extname: '.js'
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