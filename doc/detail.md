## design concept
simple and fast
## system plug-ins
The system plug-ins are executed in order, the following are explained in order of execution

1. path
path will read all file directories under src
emit the `afterPath` event after completion

If a file is not in the src directory, you can listen to `afterPath` to add the corresponding absolute path

```js
this.on('afterPath',()=>{
  this.addFile({
    path:'/other/happy.js'，
    key:'other/happy.js'
  })
})
```
The role of key is explained below

2. read

Read file content according to path

emit the `afterRead` event after completion

```js
this.on('afterPath',()=>{
  this.addFile({
    content:'content'
    path:'/other/happy.js'，
    key:'other/happy.js'
  })
})
```
3. comment

delete comment in css and html file

emit the `afterComment` event after completion

4. key

Generate unique ID

emit the `afterKey` event after completion

The key is a shorthand for the path, or as the name of the resource.

5. slim media

Filter out images and fonts that have not changed.

emit the `afterSlimMedia` event after completion

6. upload media

Upload the image font and wait to the CDN server. By default,there is no cdn server, copy files to the cache path

emit the  `afterUploadMedia` event after completion

7. useImage

Replace the picture address in js, css, html

emit the `afterUseImage` event after completion

8. slim

Filter out files that have not changed
emit the  `afterSlim` event after completion

Unlike step 5, this step all files that have not changed except html files will be filtered out

9. parseSsr

Analyze the correspondence between the template and the execution function from the source file, and generate the file to be executed by the server

emit the `afterParseSsr` event after completion

10. parse

parse "import and export" , [detail](https://www.npmjs.com/package/@duhongwei/parser)

emit the `afterParse` event after parse

11. deal

Process module information
emit the  `afterDeal` event

When import xxx.html=>yy.html is analyzed, the corresponding relationship between template xx.html and web page yy.html will be established

12. amd


Shēngchéng amd mókuài
Generate amd module

emit  the  `afterAmd`  event

13. upload

Upload js, css to the cdn server, if there is no cdn server, copy to the cache directory

emit the `afterUpload` event

14. group

Group css, js

emit the  `afterGroup` event

If it is not grouped, all css will be grouped into one package, and all js will be grouped into one package. For multi-page applications, grouping can use browser cache to improve performance. Groups are grouped according to the group item in the configuration. If there is no group item, no grouping is performed.

15. dep

Handle css and js dependencies of html. Combine the grouped css and js to generate a url address

emit the `afterDep` event

16. html

output html content

emit the `afterHtml` event

17. clear

Clean up files to avoid outputting redundant files to the dist directory

emit the `afterClear` event

18. start server

after starting,emit the `beforerServer` event

Here you can add koa plug-ins. Koa's plugins are executed sequentially, and the ones added first are executed first

>Note： it is different from the recommended wording of koa

after service start completed, emit the `afterServer` event

These 18 steps are executed in sequence, and other functions are completed at the appropriate time by monitoring events.

## 内置插件

1. runtime

listen `afterPath`  event，load runtime files.

2. importImage 

listen `afterUploadMedia` event，Analyze the grammar of the imported image

```js
import loading from './image/loading.png'
```
3. include

listen `afterUpload`  content replace

4. env

listen `afterSlim` event. Replace the node environment variables process.env.NODE_ENV and process.env.DATA_ENV

