var ipc = require('ipc');
ipc.on('coverUrl', function(url) {
  document.getElementById('background').src = url;
  document.getElementById('cover').src = url;
});
ipc.on('title', function(title) {
  document.getElementById('title').innerHTML = title;
});
ipc.on('album', function(album) {
  document.getElementById('album').innerHTML = album;
});
ipc.on('artist', function(artist) {
  document.getElementById('artist').innerHTML = artist;
});
ipc.on('loadingText', function(text) {
  document.getElementById('loading').innerHTML = text;
});
ipc.on('fadein', function() {
  fadeIn(document.getElementById('cover'));
  fadeIn(document.getElementById('background'));
  fadeIn(document.getElementById('track-info'));
});

document.onkeydown = function(e) {
  e = e || window.event;
  if (e.keyCode == 27) { //ESC
    require('remote').getCurrentWindow().close();
  }
  /*else if (e.keyCode == 84) { //T

  }*/
};

function fadeIn(el) {
  el.style.opacity = 0;

  var last = +new Date();
  var tick = function() {
    el.style.opacity = +el.style.opacity + (new Date() - last) / 800;
    last = +new Date();

    if (+el.style.opacity < 1) {
      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 10);
    }
  };

  tick();
}
