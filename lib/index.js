require('ipc').on('coverUrl', function(url) {
  document.getElementById('background').src = url;
  document.getElementById('cover').src = url;
});
document.onkeydown = function(e) {
  e = e || window.event;
  if (e.keyCode == 27) {
    require('remote').getCurrentWindow().close();
  }
};
