
(function () {
  var mod = require('lego').inspect();
  var hotloadKeys = require('lego').hotloadKeys
  var waitingMod = mod.waitingMod,
    readyMod = mod.readyMod;

  if (hotloadKeys && hotloadKeys.length > 0) {
    console.warn("hotload ", hotloadKeys.join(","))
  }

  for (var i = 0; i < waitingMod.length; i++) {
    var item = waitingMod[i];
    var message = item.type + ' ' + (item.key ? item.key : '') + ' deps ' + item.deps.join(',');
    var missedMod = [];
    var color = 'red'
    for (var j = 0; j < item.deps.length; j++) {
      if (!(item.deps[j] in readyMod)) {
        missedMod.push(item.deps[j]);
      }
    }
    message += ' missed: ' + missedMod.join(',');
    window.console && window.console.log('%c' + message, 'color:' + color);
  }
})()

