/* eslint-disable */
define('runtime/import.js', function (system) {

  var doc = document
  function load(key) {
    var deps = window._dynamic_deps_[key]

    if (typeof deps !== 'object') {
      return Promise.resolve({ render: function () { } })
    }
    var list = []
    for (var i = 0; i < deps.length; i++) {
      if (/\.js$/.test(deps[i])) {
        list.push(loadScriptItem(deps[i]))
      }
      if (/\.css$/.test(deps[i])) {
        list.push(loadStyleItem(deps[i]))
      }
    }

    return Promise.all(list).then(function () {
      return new Promise((resolve, reject) => {
        let t = setTimeout(() => {
          reject()
        }, 200)
        //得加key，不然会取默认的lastScriptPath,会把readyMod给冲掉
        require('import.r1', [key], function (mod) {
          clearTimeout(t)
          if (mod.default) {
            resolve(mod.default)
          }
          else {
            resolve(mod)
          }
        });
      })
    })
  }

  /**
   * load style. only support modern browsers
   */
  function loadStyleItem(url) {
    return new Promise(function (resolve, reject) {
      var timeoutHandler = setTimeout(function () {
        reject(new Error('timeout'))
      }, 10000)

      var node = doc.createElement('link');
      node.rel = 'stylesheet';
      node.type = 'text/css';
      node.onload = function () {
        resolve()
        //clearTimeout should at the end
        clearTimeout(timeoutHandler)
      };
      node.onerror = function () {
        reject()
        clearTimeout(timeoutHandler)
      };
      node.href = url;
      doc.getElementsByTagName('head')[0].appendChild(node);
    })
  }

  function loadScriptItem(url) {
    return new Promise(function (resolve, reject) {
      var timeoutHandler = setTimeout(function () {
        reject(new Error('timeout'))
      }, 10000)
      var script = doc.createElement('script');
      script.onerror = function (e) {
        reject(e.message)

        clearTimeout(timeoutHandler)
      }
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          resolve()
          clearTimeout(timeoutHandler)
        }
      }
      script.onload = function () {
        resolve()
        clearTimeout(timeoutHandler)
      }
      script.src = url;
      doc.body.appendChild(script);
    })
  }
  return {
    load: load
  }
})