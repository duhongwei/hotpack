/** 
 * 参数参见 https://github.com/postcss/postcss/blob/master/README-cn.md 
 * https://github.com/postcss/autoprefixer,https://github.com/browserslist/browserslist-example
 * https://github.com/browserslist/browserslist
 * npx browserlist来查看设置有没有生效
*/

import postcss from 'postcss'
import autoprefixer from 'autoprefixer'

export default async function ({ debug }) {
  this.on('afterSlim', function (files) {
    for (let file of files) {
      if (this.isPro()) {
        debug(`postcss ${file.key}`)
        await postcss([autoprefixer])
          .process(file.content, { from: undefined })
          .then(result => {
            file.content = result.css
          })
      }
    }
  })
}
