setInterval(function() {
  xhr = new XMLHttpRequest();
  xhr.open('GET', '/coverurl', false);
  xhr.send();
  document.getElementById('background').src = xhr.responseText;
  document.getElementById('cover').src = xhr.responseText;
}, 500);
