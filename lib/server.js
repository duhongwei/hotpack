import Koa from 'koa'
import { join, basename } from 'path'
import fs from 'fs-extra'
import send from 'koa-send'

export default function ({ app }) {
  const root = app.config.webRoot
  let webApp = new Koa()
  app.emit('beforeServer', webApp)
  webApp.use(async (ctx, next) => {

    //忽略 map文件，因为 hotpack 不需要 map，基本上都是原码，原文件
    if (/\.map$/.test(ctx.path)) {
      ctx.response.type = 'text';
      ctx.response.body = 'no map';
    }
    //开发的时候没有 ico 也没关系，避免出现网络错误
    else if (/favicon\.ico$/.test(ctx.path)) {

      if (!fs.existsSync(ctx.path)) {
        ctx.response.type = 'text';
        ctx.response.body = 'no ico';
      }
      else await next()
    }
    //防止路径攻击
    else if (ctx.path.indexOf('..') > -1) {
      ctx.response.type = 'text';
      ctx.response.body = 'invalid path';

      app.config.log('has .. in path!')
    }
    else {
      let path = join(root, ctx.path.substr(1))

      try {
        ctx.fileStats = await fs.stat(path)
        //如果是目录，跳到默认页面
        if (ctx.fileStats.isDirectory()) {
          let newUrl = ctx.path
          if (newUrl.endsWith('/')) {
            newUrl = `${ctx.path}index.html`
          }
          else {
            newUrl = `${ctx.path}/index.html`
          }
          path = join(path, 'index.html')

          ctx.fileStats = await fs.stat(path)
          ctx.path = newUrl
        }

        await next()

      }
      catch (e) {
        const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']

        if (notfound.includes(e.code)) {
          let resolved = false
          let page = app.config.server.page
          //粗略判断路径是不是有后缀 比如 index.html一般来说，这种不是单页面路径
          if (basename(ctx.path).includes('.')) {
            if (page[404]) {
              ctx.path = page[404]
              resolved = true
            }
          }
          else {
            if (page.single) {
              ctx.path = page.single
              resolved = true
            }
          }
          if (resolved) {
            await next()
          }
          else {
            ctx.type = 'text';
            ctx.body = `
              在路径 ${ctx.path} 没有找到相关内容
              为了避免出现这个错误提示，请在 .hotpack/base.js 中加上 配置 page:{404'/404.html'}
              如果这个路径是单页路径，请指定单页的 地址 比如  page:{single:'/index.html'}
              详情请见 https://github.com/duhongwei/hotpack/blob/master/doc/config.md
              `
          }
        }
        else {
          ctx.response.type = 'text';
          ctx.response.body = e.message;
          console.error(e)
        }

      }
    }
  })

  webApp.use(async (ctx, next) => {
    if (/\.html$/.test(ctx.path) && app.isDev()) {
      app.config.logger.log('----------- rebuild -------------')
      await app.build()
    }

    await next()
  })

  webApp.use(async (ctx) => {

    await send(ctx, ctx.path, {
      root
    })

  })

  webApp.listen(app.config.port)
  app.config.logger.log(`server run at ${app.config.port}`)
}