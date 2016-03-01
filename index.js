process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const https = require('https');
const randomstring = require('randomstring');
const express = require('express');

const SERVER_PORT = 5000;
const UPDATE_INTERVAL = 1000;
const DEFAULT_RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'];
const DEFAULT_HTTPS_CONFIG = {
  host: '',
  port: 4370,
  path: '',
  headers: {'Origin': 'https://open.spotify.com'}
};

var app = express();
app.set('views', './views');
app.set('view engine', 'jade');
app.use('/static', express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.render('index');
});
app.get('/coverurl', function(req, res) {
  res.end(coverUrl);
});
var server = app.listen(SERVER_PORT, function() {
  console.log('spotispy listening on ' + SERVER_PORT);
});

var version;
var csrf;
var oauth;
var albumId;
var coverUrl;

function copyConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_HTTPS_CONFIG));
}

function generateLocalHostname() {
  /*return randomstring.generate({
    length: 10,
    charset: 'abcdefghijklmnopqrstuvwxyz'
  }) + '.spotilocal.com';*/
  return '127.0.0.1';
}

function getUrl(path) {
  generateLocalHostname() + '/' + path;
}

function getJson(config, callback) {
  https.get(config, function(res) {
    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {
      callback(JSON.parse(body));
    });
  });
}

function getStatus() {
  config = copyConfig();
  config.host = generateLocalHostname();
  config.path = '/remote/status.json?oauth=' + oauth + '&csrf=' + csrf + '&returnafter=1&returnon=' + DEFAULT_RETURN_ON.join();
  getJson(config, function(data) { console.log(data); });
}

function getCurrentAlbumId() {
  config = copyConfig();
  config.host = generateLocalHostname();
  config.path = '/remote/status.json?oauth=' + oauth + '&csrf=' + csrf + '&returnafter=1&returnon=' + DEFAULT_RETURN_ON.join();
  getJson(config, function(data) {
    try {
      if (data.track.album_resource.uri.split(':')[2] !== albumId) {
        console.log('ALBUM UPDATED');
        albumId = data.track.album_resource.uri.split(':')[2];
        console.log(albumId);
        getAlbumCover(albumId);
      }
    }
    catch(ex) {
      console.log(ex);
    }
  });
}

function getAlbumCover(id) {
  config = copyConfig();
  config.host = 'api.spotify.com';
  config.path = '/v1/albums/' + id;
  config.port = 443;
  getJson(config, function(data) {
    console.log(data.images[0].url);
    coverUrl = data.images[0].url;
  });
}

config = copyConfig();
config.host = generateLocalHostname();
config.path = '/service/version.json?service=remote';
getJson(config, function(data) { version = data; });
config.host = generateLocalHostname();
config.path = '/simplecsrf/token.json';
getJson(config, function(data) { csrf = data.token; });
config.host = 'open.spotify.com';
config.path = '/token';
config.port = 443;
getJson(config, function(data) { oauth = data.t; });
var updateTrackCover;
var waitForRequest = setInterval(function() {
  if (typeof version !== 'undefined' && typeof csrf !== 'undefined' && typeof oauth !== 'undefined') {
    clearInterval(waitForRequest);
    console.log('done.');
    console.log(version);
    console.log(csrf);
    console.log(oauth);
    updateTrackCover = setInterval(getCurrentAlbumId, UPDATE_INTERVAL);
  }
  else {
    console.log('waiting...');
  }
}, 500);
