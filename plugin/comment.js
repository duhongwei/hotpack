

export default async function () {
  return async (files) => {
    for (let file of files) {
      //comment 在 key 插件 之前，可能还没有 key，这时需要取 path
      if (/\.min\.(js|css)$/.test(file.key || file.path)) continue
      if (file.meta && file.meta.isMin) continue

      //因为很难把Js的注释用正则低成本的正确匹配到，如果正确处理需要语法分析，耗时会比较长，所以先不处理
      //if (this.util.isJs(file.key)) {
      //只匹配 单行注释，并且，注释的前面除了空格 没有任何字符
      //  file.content = file.content.replace(/^\s*\/\/(.*)/mg, (match, content) => content.startsWith('eslint-') ? match : '')
      //多行注释，只能是写在开始的能匹配到
      //file.content = file.content.replace(/^\s*\/\*(.*?)\*\//msg, (match, content) => content.trimStart().startsWith('eslint-') ? match : '')
      //}
      
      if (this.util.isCss(file.key || file.path)) {
        file.content = file.content.replace(/\/\*.*?\*\//sg, '')
      }
      if (this.util.isHtml(file.key || file.path)) {
        file.content = file.content.replace(/<!--.*?-->/sg, '')
      }
    }
  }
}