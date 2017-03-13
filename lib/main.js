'use strict';

const electronLocalshortcut = require('electron-localshortcut');
const electron = require('electron');
// Module to control application life.
const app = electron.app;

let screen;
let displays;
let currentDisplay = 0;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1366, height: 790});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  screen = electron.screen;
  displays = screen.getAllDisplays();
  console.log('enumerated', displays.length, 'displays.');
  mainWindow.setFullScreen(true);
  mainWindow.setMenu(null);

  // register two local shortcuts
  electronLocalshortcut.register('CommandOrControl+Shift+Left', function() {
    currentDisplay--;
    if (currentDisplay < 0) {
      currentDisplay = displays.length - 1;
    }
    currentDisplay%=(displays.length);
    console.log('switching to display', currentDisplay + 1, 'out of', displays.length);
    mainWindow.setFullScreen(false);
    setTimeout(function() {
      mainWindow.setBounds(displays[currentDisplay].bounds);
      mainWindow.setFullScreen(true);
    }, 100);
  });

  electronLocalshortcut.register('CommandOrControl+Shift+Right', function() {
    currentDisplay++;
    currentDisplay%=(displays.length);
    console.log('switching to display', currentDisplay + 1, 'out of', displays.length);
    mainWindow.setFullScreen(false);
    setTimeout(function() {
      mainWindow.setBounds(displays[currentDisplay].bounds);
      mainWindow.setFullScreen(true);
    }, 100);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.on('uncaughtException', function (error) {
  console.log(error);
  if (error.code == 'ECONNRESET') {
    spotifyPortOffset++;
    console.log('connection failed; trying new port...');
  }
});

const https = require('https');

const SERVER_PORT = 5000;
const UPDATE_INTERVAL = 1000;
const DEFAULT_RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'];
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';
let spotifyPortOffset = 0;
const DEFAULT_HTTPS_CONFIG = {
  host: '',
  port: 4370,
  path: '',
  headers: {'Origin': 'https://open.spotify.com'}
};

let config;
let version;
version = {};
version.running = false;
let csrf;
let oauth;
let currentTitle;
let coverUrl;

function copyConfig() {
  let configCopy = JSON.parse(JSON.stringify(DEFAULT_HTTPS_CONFIG));
  configCopy.port += (spotifyPortOffset % 10);
  return configCopy;
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
  config.headers = config.headers || {};
  config.headers['User-Agent'] = USER_AGENT;
  var port = config.port;
  https.get(config, function(res) {
    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {
      callback(JSON.parse(body), port);
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
      if (data.track.track_resource.name !== currentTitle) {
        console.log('found new song title.');
        currentTitle = data.track.track_resource.name;
        console.log('song title:', currentTitle);
        getAlbumCover(data.track.album_resource.uri.split(':')[2]);
        if (mainWindow !== null) {
          mainWindow.webContents.send('title', data.track.track_resource.name);
          mainWindow.webContents.send('album', data.track.album_resource.name);
          mainWindow.webContents.send('artist', data.track.artist_resource.name);
        }
      }
    }
    catch(ex) {
      console.log(ex);
      console.log(data);
    }
  });
}

function getAlbumCover(id) {
  config = copyConfig();
  config.host = 'api.spotify.com';
  config.path = '/v1/albums/' + id;
  config.port = 443;
  getJson(config, function(data) {
    console.log('cover url:', data.images[0].url);
    coverUrl = data.images[0].url;
    if (mainWindow !== null) {
      mainWindow.webContents.send('coverUrl', coverUrl);
    }
  });
}

function grabTokens() {
  if (mainWindow !== null) {
    mainWindow.webContents.send('loadingText', 'Connecting to Spotify...');
  }
  config.host = generateLocalHostname();
  config.path = '/simplecsrf/token.json';
  getJson(config, function(data) { csrf = data.token; });
  config.host = 'open.spotify.com';
  config.path = '/token';
  config.port = 443;
  getJson(config, function(data) { oauth = data.t; });
  let updateTrackCover;
  let waitForRequest = setInterval(function() {
    if (typeof version !== 'undefined' && typeof csrf !== 'undefined' && typeof oauth !== 'undefined') {
      clearInterval(waitForRequest);
      console.log('ready to grab album art.');
      updateTrackCover = setInterval(getCurrentAlbumId, UPDATE_INTERVAL);
    }
    else {
      console.log('waiting for authentication...');
    }
  }, 500);
}

let waitForSpotify = setInterval(function() {
  if (typeof version !== 'undefined' && version.running) {
    clearInterval(waitForSpotify);
    grabTokens();
  }
  else {
    config = copyConfig();
    config.host = generateLocalHostname();
    config.path = '/service/version.json?service=remote';
    getJson(config, function(data, port) {
      if (!('running' in data)) {
        data.running = true;
      }
      version = data;
      console.log(version);
      console.log(port);
      config.port = port;
    });
    console.log('waiting for spotify...');
    console.log(config.port);
    config.port++;
  }
}, 500);
