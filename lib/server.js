import Koa from 'koa'
import { join } from 'path'
import fs from 'fs-extra'
import send from 'koa-send'
//https://github.com/edorivai/koa-proxy
import proxy from 'koa-proxy';

export default function ({ app }) {
  const root = app.config.webRoot

  let webApp = new Koa()
  if (app.config.proxy) {
    webApp.use(proxy(app.config.proxy));
  }

  webApp.use(async (ctx, next) => {

    //忽略 map文件
    if (/\.map$/.test(ctx.path)) {
      ctx.response.type = 'text';
      ctx.response.body = 'no map';
    }
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
          
          await fs.stat(path)
          ctx.path = newUrl
        }

        await next()

      }
      catch (e) {
        const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']

        if (notfound.includes(e.code)) {

          if (app.config.path404) {
            ctx.path = app.config.path404
            await next()
          }
          else {
            ctx.type = 'text';
            ctx.body = `
              在路径 ${ctx.path} 没有找到相关内容
              为了避免出现这个错误提示，请在 .hotpack/base.js中加上 配置  path404:'/404.html'
              如果这个路径是单页路径，请指定单页的html地址 比如  path404:'/index.html'
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