# 配置文件
配置文件放在根目录下的 .hotpack文件夹里。有三个文件。
1. base.js 公共配置
2. dev.js 开发配置
3. pro.js 发布配置

dev.js,pro.js会覆盖 base.js的相同配置
## 所有配置
```js
export default {
  //服务端渲染
  render: {
    enable: false //启用或不启用,默认为false
    dist:'_render_' //发布服务端文件的路径，默认为 _render_
 },
  dist: './dev', //发布目录，开发环境和发布环境是分开的，开发环境一般叫 dev ,发布环境一般叫 dist
  proxy: {
    //host: 'http://wcc.anquanke.com',
    //host: 'http://m.aqk.qihoo.net',
    host: 'http://www.anquanke.com',
    match: /\/webapi\//,
    map: function (path) {
      return path.replace('/webapi', '');
    },
  },
  plugin: [
    {
      name: 'babel',
      use: babel
      
    },
    'node',
    {
      name: 'hot',
      use: hot
    },
    {
      name: 'docker',
      use: docker
    },
    {
      name: 'eslint',
      use: eslint,
      opt: {
        errorBreak: false,
      },
    },
    {
      name: 'postcss',
      use: postcss,
      isH5: (key) => {
          return /^h5/.test(key)
      }
    },
    {
      name: 'vue3',
      use: vue3,
    }
  ]
};

```