
/**
 * delete comment from css and html
 * except js,because the cost of deleting comment from js very high ,eslint also use comment
 * 
 * waring:comment in js maybe affect RegExp match
*/
export default async function () {
  return async (files) => {
    for (let file of files) {
      if (/\.min\.(js|css)$/.test(file.key || file.path)) continue
      if (file.meta && file.meta.isMin) continue
      
      if (this.util.isCss(file.key || file.path)) {
        file.content = file.content.replace(/\/\*.*?\*\//sg, '')
      }
      if (this.util.isHtml(file.key || file.path)) {
        file.content = file.content.replace(/<!--.*?-->/sg, '')
      }
    }
  }
}