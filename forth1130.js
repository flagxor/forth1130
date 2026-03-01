'use strict';

var lights = {};
function getLight(name) {
  if (lights[name] === undefined) {
    lights[name] = document.getElementById(name);
  }
  if (!lights[name]) {
    console.log(name);
  }
  return lights[name];
}

function setLight(name, val) {
  if (name == '') {
    return;
  }
  var light = getLight(name);
  if (!light) {
    return;
  }
  if (val) {
    getLight(name).classList.add('lit');
  } else {
    getLight(name).classList.remove('lit');
  }
}

function setWord(name, val) {
  for (var i = 0; i < 16; ++i) {
    setLight(name + i, val & (1 << (15 - i)));
  }
}

var iar = 0;
var sar = 128;
var sb = 1000;
var af = 2000;
var acc = 3000;
var ext = 4000;
setInterval(function() {
  var lights = document.getElementsByClassName('display-light');
  for (var i = 0; i < lights.length; ++i) {
    setLight(lights[i].id, Math.floor(Math.random() * 2));
  }
  lights = document.getElementsByClassName('console-light');
  for (var i = 0; i < lights.length; ++i) {
    setLight(lights[i].id, Math.floor(Math.random() * 2));
  }
  setWord('iar', iar++);
  setWord('sar', sar++);
  setWord('sb', sb++);
  setWord('af', af++);
  setWord('acc', acc++);
  setWord('ext', ext++);
}, 200);

function KeyMatch(key, e) {
  return !e.ctrlKey && !e.altKey &&
    key.id == 'key_' + e.code.replace('Key', '').toLowerCase();
}

window.onkeydown = function(e) {
  var keys = document.getElementsByClassName('key');
  for (var i = 0; i < keys.length; ++i) {
    if (KeyMatch(keys[i], e)) {
      keys[i].classList.add('active');
      e.preventDefault();
    }
  }
}

window.onkeyup = function(e) {
  var keys = document.getElementsByClassName('key');
  for (var i = 0; i < keys.length; ++i) {
    if (KeyMatch(keys[i], e)) {
      keys[i].classList.remove('active');
      e.preventDefault();
    }
  }
}

