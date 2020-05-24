
import Spack from './Spack.js'
export default class { 
  constructor({ config }) { 
    this.config = config
    this.spack = new Spack({ config })
  }
  async build() { 
    await this.spack.build()
  }
}
/**
 *md5过滤
 */
/**
 * web端和服务端分开处理，服务端处理是可选的。
 * 所有图片放web端，服务端代码不会引用浏览器要展示的图片
 * 
 * 1.读配置文件，对各个生命周期进行干涉。
 * 2.根据配置文件的src读所有的前端文件列表信息。filter[] 负责过虑，插件可以注册 filter，serverSrc读所有的服务端文件信息
 * 3.读取include片段文件，生成系统变量，取代原来的include插件。并把include文件删除
 * 4.图片，没变化的图片直接删除，有变化的，更新版本信息，替换所有的文本文件。开发和生产环境一样处理。图片地址换成绝对地址。 除了html文件，其它未变化文件全部删除。
 * 5.处理import export 调用webResolve[]，处理每个路径。结果就是把本次所有需要的资源都读到内存中。生成dep.json。删除 import export语句，包装成amd。
 * 
 * 1.根据配置文件，读服务端所有文件，filter过滤
 * 2. 对每个c文件 根据dep.json找到依赖，根据serverResolve处理依赖。
 * 3. buble
 * 4. 写文件。
 * 
 * 启动server
 * 

 */