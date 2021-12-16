import Koa from 'koa'
import { join, basename } from 'path'
import fs from 'fs-extra'
import send from 'koa-send'

export default function ({ app }) {
  const root = app.config.webRoot
  let webApp = new Koa()
  app.emit('beforeServer', webApp)

  webApp.use(async (ctx, next) => {

    //omit map file,hotpack don't need map,because,dev enviroment is as the same as source code
    if (/\.map$/.test(ctx.path)) {
      ctx.response.type = 'text';
      ctx.response.body = 'no map';
    }
    //avoid network error
    else if (/favicon\.ico$/.test(ctx.path)) {

      if (!fs.existsSync(ctx.path)) {
        ctx.response.type = 'text';
        ctx.response.body = 'no ico';
      }
      else await next()
    }
    //prevent attack
    else if (ctx.path.indexOf('..') > -1) {
      ctx.response.type = 'text';
      ctx.response.body = 'invalid path';

      app.config.logger.error('has .. in path!')
    }
    else {
      let path = join(root, ctx.path.substring(1))

      try {
        ctx.fileStats = await fs.stat(path)

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

          //multi page
          if (basename(ctx.path).includes('.')) {
            if (page[404]) {
              ctx.path = page[404]
              resolved = true
            }
          }
          //single page
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
              ${ctx.path} ,file not exist!
              to avoid error,please add  page:{404'/404.html'} in   .hotpack/base.js
              if you are using single page add page:{single:'/index.html'}
              more detail   https://github.com/duhongwei/hotpack/blob/master/doc/config.md
              `
          }
        }
        else {
          //app.setError()
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
  /*  webApp.on('error', err => {
 
     app.setError()
   }); */
  webApp.listen(app.config.port)
  app.config.logger.log(`server run at ${app.config.port}`)
}