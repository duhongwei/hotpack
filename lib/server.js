import Koa from 'koa'
import { join } from 'path'
import fs from 'fs-extra'
import send from 'koa-send'
export default function ({ app }) {
  const root = app.config.webRoot

  let webApp = new Koa()
  webApp.use(async (ctx, next) => {
  
    //忽略 map文件
    if (/\.map$/.test(ctx.path)) {
      ctx.response.type = 'text';
      ctx.response.body = 'no map';
    }
    //防止路径攻击
    else if (ctx.path.indexOf('..') > -1) {
      ctx.response.type = 'text';
      ctx.response.body = 'invalid path';
      app.spack.log('has .. in path!')
    }
    else {
      const path = join(root, ctx.path.substr(1))
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

        ctx.redirect(newUrl);
      }
      else {
        await next()
      }
    }
  })
  //304
  webApp.use(async (ctx, next) => {
    const ifModifiedSince = ctx.request.headers['if-modified-since'];
    const lastModified = ctx.fileStats.mtime.toGMTString();
    if (ifModifiedSince === lastModified) {
      ctx.response.status = 304;
    } else {
      await next();
    }
  })
  webApp.use(async (ctx, next) => {
    if (/\.html$/.test(ctx.path) && app.isDev()) {
      app.config.logger.log(`----------- rebuild -------------`)
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