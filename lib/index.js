var ipc = require('ipc');
ipc.on('coverUrl', function(url) {
  document.getElementById('background').src = url;
  document.getElementById('cover').src = url;
});
ipc.on('title', function(title) {
  document.getElementById('title').innerHTML = title;
  document.getElementById('track-info').style.opacity = 1;
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
document.onkeydown = function(e) {
  e = e || window.event;
  if (e.keyCode == 27) { //ESC
    require('remote').getCurrentWindow().close();
  }
  /*else if (e.keyCode == 84) { //T

  }*/
};
