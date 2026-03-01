'use strict';

setInterval(function() {
  var lights = document.getElementsByClassName('display-light');
  for (var i = 0; i < lights.length; ++i) {
    if (Math.random() > 0.5) {
      lights[i].classList.add('lit');
    } else {
      lights[i].classList.remove('lit');
    }
  } 
  lights = document.getElementsByClassName('console-light');
  for (var i = 0; i < lights.length; ++i) {
    if (Math.random() > 0.5) {
      lights[i].classList.add('lit');
    } else {
      lights[i].classList.remove('lit');
    }
  } 
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

