

export default async function ({ debug }) {
    return async (files) => {
        for (let file of files) {
            if (/\.min\.(js|css)$/.test(file.key)) continue
            if (file.meta && file.meta.isMin) continue

            if (this.util.isJs(file.key)) {
                //只匹配 单行注释，并且，注释的前面除了空格 没有任何字符
                file.content = file.content.replace(/^\s*\/\/(.*)/mg, (match, content) => content.startsWith('eslint-') ? match : '')
                //多行注释，只能是写在开始的能匹配到
                file.content = file.content.replace(/^\s*\/\*(.*?)\*\//msg, (match, content) => content.trimStart().startsWith('eslint-') ? match : '')
            }
            if (this.util.isCss(file.key)) {
                file.content = file.content.replace(/\/\*.*?\*\//sg, '')
            }
            if (this.util.isHtml(file.key)) {
                file.content = file.content.replace(/\<!--.*?--\>/sg, '')
            }
        }
    }
}