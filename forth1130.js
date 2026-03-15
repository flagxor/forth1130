'use strict';

// Machine State
var m = new Int16Array(32768);
for (var i = 0; i < 32768; ++i) { m[i] = Math.floor(Math.random() * 65536); }
var iar = 0;
var sar = 0;
var sbr = 0;
var afr = 0;
var acc = 0;
var ext = 0;
var op = 0;
var format = 0;
var mod = 0;
var tag = 0;
var ccc = 0;
var carry = 0;
var overflow = 0;
var time = 0;
var last_time = 0;
// Control State
var power = 0;
var running = 0;
var waiting = 0;
var interrupt = 0;
var signal = 0;
// Key State
var keyState = {};
// Constants
const ADDR_MASK = 0x7fff;

// Options
const PRINTER_WIDTH = 74;

// IBM Card Code
// 12 - EOF
// 13 - Backspace
// 14 - Erase Field
const CARD_CODE = {
  ' ': [],
  '0': [0], '1': [1], '2': [2], '3': [3], '4': [4],
  '5': [5], '6': [6], '7': [7], '8': [8], '9': [9],
  '¢': [12,8,1], '.': [12,8,2], '<': [12,8,4], '(': [12,8,5], '+': [12,8,6], '|': [12,8,7],
  '&': [12], '-': [11], '/': [0,1],
  '!': [11,8,2], '$': [11,8,3], '*': [11,8,4], ')': [11,8,5], ';': [11,8,6], '¬': [11,8,7],
  ',': [0,8,3], '%': [0,8,4], '_': [0,8,5], '>': [0,8,6], '?': [0,8,7],
  ':': [8,2], '#': [8,3], '@': [8,4], "'": [8,5], '=': [8,6], '"': [8,7],
  'A': [12,1], 'B': [12,2], 'C': [12,3], 'D': [12,4],
  'E': [12,5], 'F': [12,6], 'G': [12,7], 'H': [12,8], 'I': [12,9],
  'J': [11,1], 'K': [11,2], 'L': [11,3], 'M': [11,4],
  'N': [11,5], 'O': [11,6], 'P': [11,7], 'Q': [11,8], 'R': [11,9],
  'S': [0,2], 'T': [0,3], 'U': [0,4],
  'V': [0,5], 'W': [0,6], 'X': [0,7], 'Y': [0,8], 'Z': [0,9],
  'a': [12,0,1], 'b': [12,0,2], 'c': [12,0,3], 'd': [12,0,4],
  'e': [12,0,5], 'f': [12,0,6], 'g': [12,0,7], 'h': [12,0,8], 'i': [12,0,9],
  'j': [12,11,1], 'k': [12,11,2], 'l': [12,11,3], 'm': [12,11,4],
  'n': [12,11,5], 'o': [12,11,6], 'p': [12,11,7], 'q': [12,11,8], 'r': [12,11,9],
  's': [11,0,2], 't': [11,0,3], 'u': [11,0,4],
  'v': [11,0,5], 'w': [11,0,6], 'x': [11,0,7], 'y': [11,0,8], 'z': [11,0,9],
};
var CHAR_TO_CODE = {};
var CODE_TO_CHAR = {};
for (var i in CARD_CODE) {
  var punches = CARD_CODE[i];
  var code = 0;
  for (var j = 0; j < punches.length; ++j) {
    code |= (1 << (15 - punches[j]));
  }
  CHAR_TO_CODE[i] = code;
  CODE_TO_CHAR[code] = i;
}

// Element Cache
var elements = {};
function getElement(name) {
  if (elements[name] === undefined) {
    elements[name] = document.getElementById(name);
  }
  return elements[name];
}

function Reset() {
  iar = 0;
  sar = 0;
  sbr = 0;
  afr = 0;
  acc = 0;
  ext = 0;
  op = 0;
  format = 0;
  mod = 0;
  tag = 0;
  ccc = 0;
  carry = 0;
  overflow = 0;
  running = 0;
  waiting = 0;
}

function LightsOut() {
  var lights = document.getElementsByClassName('console-light');
  for (var i = 0; i < lights.length; ++i) {
    setLight(lights[i].id, 0);
  }
  lights = document.getElementsByClassName('display-light');
  for (var i = 0; i < lights.length; ++i) {
    setLight(lights[i].id, 0);
  }
}

function setLight(name, val) {
  if (name == '') {
    return;
  }
  var light = getElement(name);
  if (!light) {
    return;
  }
  if (val) {
    light.classList.add('lit');
  } else {
    light.classList.remove('lit');
  }
}

function setBits(name, val, n) {
  n = n === undefined ? 16 : n;
  for (var i = 0; i < n; ++i) {
    setLight(name + i, val & (1 << (n - 1 - i)));
  }
}

function getBits(name, val, n) {
  n = n === undefined ? 16 : n;
  var result = 0;
  for (var i = 0; i < n; ++i) {
    var element = getElement(name + i);
    if (element && element.checked) {
      result |= (1 << (n - 1 - i));
    }
  }
  return result;
}

function BitCount(v) {
  var n = 0;
  for (var i = 0; i < 16; ++i) {
    n += (v & (1 << i)) ? 1 : 0;
  }
  return n;
}

function Parity(v) {
  return (BitCount(v) & 1) == 0;
}

function SignExtend(v) {
  return (v << 16) >> 16;
}

function EffectiveAddress() {
  if (format) {
    sar = iar++;
    sbr = m[sar];
    sar = sbr;
  } else {
    sar = ((sbr & 0xff) << 8) >> 8;
  }
  if (tag) {
    sar += m[tag];
  } else {
    if (!format) {
      sar += iar;
    }
  }
  if (mod & 2) {  // M8
    sbr = m[sar];
    sar = sbr;
  }
}

function DoInterrupts() {
  var highest_signal = signal ^ (signal & (signal - 1));
  var highest_int = interrupt ^ (interrupt & (interrupt - 1));
  if (highest_signal <= highest_int) {
    return;
  }
  interrupt |= highest_signal;
  var level = 6;
  while (highest_signal) {
    --level;
    highest_signal /= 2;
  }
  sbr = m[level + 8];
  m[sbr] = iar;
  iar = (sbr + 1) & ADDR_MASK;
}

function SetSignal(level, value) {
  if (value) {
    signal |= (1 << (5 - level));
  } else {
    signal &= ~(1 << (5 - level));
  }
}

function Timing(s00, s11, d00, d11) {
  time += format ? (tag ? d11 : d00) : (tag ? s11 : s00);
}

function Xio(addr, addr2) {
  var device = (addr2 >> 11) & 0x1f;
  var fun = (addr2 >> 8) & 0x7;
  var modifier = addr2 & 0xff;
  // TODO
}

function Op00010() {
  ccc = (tag ? m[tag] : sbr) & 0x3f;
  // Wildly off
  time += 3.6 + ccc * 0.45;
  switch (mod) {
    case 0:  // 00 SLA
      acc <<= ccc;
      carry = (acc >> 16) & 1;
      ccc = 0;
      break;
    case 1:  // 01 SLCA
      while (ccc--) {
        acc <<= 1;
        carry = (acc >> 16) & 1;
        if (tag && carry) {
          break;
        }
      }
      break;
    case 2:  // 10 SLT
      ext = (acc << 16) | ext;
      ext <<= ccc;
      acc = ext >> 16;
      carry = (ext >> 16) & 1;
      ccc = 0;
      break;
    case 3:  // 11 SLC
      ext = (acc << 16) | ext;
      while (ccc--) {
        ext *= 2;
        carry = (acc & 0x100000000) ? 1 : 0;
        if (tag && carry) {
          break;
        }
      }
      acc = ext >> 16;
      ext = ext & 0xffff;
      break;
  }
}

function Op00011() {
  ccc = (tag ? m[tag] : sbr) & 0x3f;
  // Wildly off
  time += 3.6 + ccc * 0.45;
  switch (mod) {
    case 0:  // 00 SRA
    case 1:  // 01 SRA
      acc >>= ccc;
      ccc = 0;
      break;
    case 2:  // 10 SRT
      ext = (acc << 16) | ext;
      ext >>= ccc;
      acc = ext >> 16;
      ext = ext & 0xffff;
      ccc = 0;
      break;
    case 3:  // 11 RTE
      ext = (acc << 16) | ext;
      while (ccc--) {
        ext = (ext >> 1) | ((ext & 1) << 31);
      }
      acc = ext >> 16;
      ext = ext & 0xffff;
      break;
  }
}

function Conditions() {
  var ret = (!overflow) | ((!carry) << 1) | ((!(acc & 1)) << 2) |
            ((acc > 0) << 3) | ((acc < 0) << 4) | ((acc == 0) << 5);
  overflow = 0;
  return ret;
}

function MaybeClearInterrupt() {
  if ((modifier >> 9) & 1) {
    // Drop lowest order 1 bit from interrupt mask.
    interrupt &= interrupt - 1;
  }
}

function BSC() {
  var branch = 0;
  if (format) {
    if (!(modifier & Conditions())) {
      EffectiveAddress();
      iar = sar & ADDR_MASK;
      branch = 1;
    }
  } else {
    if (modifier & Conditions()) {
      ++iar;
      branch = 1;
    }
  }
  if (branch) {
    ClearInterrupt();
  }
  Timing(3.6, 3.6, branch ? 7.2 : 3.6, branch ? 11.2 : 3.6);
}

function BSI() {
  EffectiveAddress();
  if (!format || !(modifier & Conditions())) {
    m[sar] = iar;
    iar = (sar + 1) & ADDR_MASK;
    Timing(7.6, 11.2, 10.8, 14.8);
  } else {
    Timing(7.6, 11.2, 3.6, 3.6);
  }
}

function Step() {
  DoInterrupts();
  // Decode
  sar = iar++;
  sbr = m[sar];
  op = (sbr >> 10) & 0x3f;
  format = (sbr >> 9) & 0x1;
  tag = (sbr >> 7) & 0x3;
  mod = (sbr >> 5) & 0x3;
  switch (op) {
    case 1:   // 00001 XIO
      EffectiveAddress();
      Xio(m[sar], m[sar|1]);
      Timing(11.2, 14.8, 14.4, 18.4);
      break;
    case 2:   // 00010
      Op00010();
      break;
    case 3:   // 00011
      Op00011();
      break;
    case 4:   // 00100 LDS
      // Format bit ignored, treated same.
      carry = (sbr >> 1) & 1;
      overflow = sbr & 1;
      Timing(3.6, 3.6, 3.6, 3.6);
      break;
    case 5:   // 00101 STS
      EffectiveAddress();
      m[sar] = (m[sar] & 0xff00) | (carry << 1) | overflow;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 6:   // 00110 WAIT
      Timing(3.6, 3.6, 3.6, 3.6);
      waiting = 1;
      break;
    case 8:   // 01000 BSI
      BSI();
      break;
    case 9:   // 01001 BSC
      BSC();
      break;
    case 12:  // 01100 LDX
      if (format) {
        sar = iar++;
        sbr = m[sar];
        if (mod & 2) {
          sbr = m[sar];
          sar = sbr;
        }
      } else {
        sar = ((sbr & 0xff) << 8) >> 8;
      }
      if (tag) {
        m[tag] = sar;
      } else {
        iar = sar & ADDR_MASK;
      }
      Timing(4.5, 7.2, 7.2, 11.8);
      break;
    case 13:  // 01101 STX
      EffectiveAddress();
      m[sar] = tag ? m[tag] : iar;
      Timing(7.6, 11.2, 11.8, 15.4);
      break;
    case 14:  // 01110 MDX
      EffectiveAddress();
      if (tag) {
        iar += sar;
      } else {
        m[tag] += sar;
      }
      Timing(4.5, 11.2, 18.5, 18.5);
      break;
    case 16:  // 10000 A
      EffectiveAddress();
      afr = m[sar];
      acc += afr;
      overflow = SignExtend(acc) != acc;
      carry = (acc >> 16) & 1;
      acc &= 0xffff;
      Timing(8.0, 11.7, 11.2, 15.3);
      break;
    case 17:  // 10001 AD
      EffectiveAddress();
      afr = m[sar | 1];
      ext += afr;
      carry = (ext >> 16) & 1;
      ext &= 0xffff;
      afr = m[sar];
      acc += afr + carry;
      carry = (acc >> 16) & 1;
      overflow = SignExtend(acc) != acc;
      Timing(12.2, 15.8, 15.3, 19.3);
      break;
    case 18:  // 10010 S
      EffectiveAddress();
      afr = m[sar];
      acc -= afr;
      overflow = (acc & 0xffff) != acc;
      carry = (acc >> 16) & 1;
      Timing(8.0, 11.7, 11.2, 15.3);
      break;
    case 19:  // 10011 SD
      EffectiveAddress();
      afr = (m[sar | 1] ^ 0xffff) + 1;
      ext += afr;
      carry = (ext >> 16) & 1;
      ext &= 0xffff;
      afr = (m[sar] ^ 0xffff) + 1;
      acc += afr + carry;
      carry = (acc >> 16) & 1;
      overflow = SignExtend(acc) != acc;
      Timing(12.2, 15.8, 15.3, 19.3);
      break;
    case 20:  // 10100 M
      EffectiveAddress();
      afr = m[sar];
      acc *= afr;
      ext = acc & 0xffff;
      acc = (acc >> 16) & 0xffff;
      Timing(25.7, 29.3, 29.3, 32.9);
      break;
    case 21:  // 10101 D
      EffectiveAddress();
      afr = m[sar];
      if (afr == 0) {
        overflow = 1;
      } else {
        acc = (acc << 16) | ext;
        ext = acc % afr;
        acc = acc / afr;
        overflow = SignExtend(acc) != acc;
      }
      Timing(76.0, 79.6, 79.6, 83.2);
      break;
    case 24:  // 11000 LD
      EffectiveAddress();
      acc = m[sar];
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 25:  // 11001 LDD
      EffectiveAddress();
      ext = m[sar | 1];
      acc = m[sar];
      Timing(11.2, 14.9, 14.4, 18.0);
      break;
    case 26:  // 11010 STO
      EffectiveAddress();
      m[sar] = acc;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 27:  // 11011 STD
      EffectiveAddress();
      m[sar | 1] = ext;
      m[sar] = acc;
      Timing(11.2, 14.9, 14.4, 18.0);
      break;
    case 28:  // 11100 AND
      EffectiveAddress();
      afr = m[sar];
      acc &= afr;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 29:  // 11101 OR
      EffectiveAddress();
      afr = m[sar];
      acc |= afr;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 30:  // 11110 EOR
      EffectiveAddress();
      afr = m[sar];
      acc ^= afr;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    default:
      // Interpreted as equivalent to WAIT.
      Timing(3.6, 3.6, 3.6, 3.6);
      waiting = 1;
      break;
  }
}

function UpdateLights() {
  setBits('iar', iar);
  setBits('sar', sar);
  setBits('sbr', sbr);
  setBits('afr', afr);
  setBits('acc', acc);
  setBits('ext', ext);
  setBits('op', op, 5);
  setLight('F5', format);
  setBits('tag', tag, 2);
  setBits('mod', mod, 2);
  setBits('ccc', ccc, 6);
  setLight('carry', carry);
  setLight('overflow', overflow);
  setLight('P1', Parity(sbr & 0xff00));
  setLight('P2', Parity(sbr & 0x00ff));
  setLight('xr1', tag == 1);
  setLight('xr2', tag == 2);
  setLight('xr3', tag == 3);
  setLight('running', running);
  setLight('wait', waiting);
}

function ConsoleMode() {
  return document.querySelector('input[name="console_mode"]:checked').value;
}

var powerSwitch = document.getElementById('power');
powerSwitch.onchange = function() {
  power = powerSwitch.checked | 0;
  if (!power) {
    LightsOut();
    running = 0;
  } else {
    UpdateLights();
  }
};

document.getElementById('program_start').onclick = function() {
  if (!power) {
    return;
  }
  waiting = 0;
  var console_mode = ConsoleMode();
  if (console_mode == 'RUN') {
    running = 1;
  } else if (console_mode == 'DISP') {
    iar = (iar + 1) & ADDR_MASK;
  } else if (console_mode == 'LOAD') {
    m[iar] = getBits('switch');
    iar = (iar + 1) & ADDR_MASK;
  } else {
    Step();
  }
  UpdateLights();
};

document.getElementById('load_iar').onclick = function() {
  if (!power) {
    return;
  }
  var console_mode = ConsoleMode();
  if (console_mode == 'LOAD') {
    iar = getBits('switch') & ADDR_MASK;
    UpdateLights();
  }
};

document.getElementById('imm_stop').onclick = function() {
  running = 0;
  waiting = 0;
  UpdateLights();
};

document.getElementById('program_stop').onclick = function() {
  running = 0;
  waiting = 0;
  UpdateLights();
};

document.getElementById('reset').onclick = function() {
  Reset();
  UpdateLights();
};

function Run() {
  if (power) {
    var console_mode = ConsoleMode();
    if (console_mode == 'RUN' && running && !waiting) {
      Step();
      UpdateLights();
    } else {
      running = 0;
      if (console_mode == 'DISP') {
        sar = iar;
        sbr = m[sar];
        UpdateLights();
      } else if (console_mode == 'LOAD') {
        sar = iar;
        sbr = getBits('switch');
        UpdateLights();
      }
    }
  }
  requestAnimationFrame(Run);
}
Run();

// Manage cursor.
var cursor = document.getElementById('cursor');
function AddCursor() {
  window.printer.appendChild(cursor);
}
function RemoveCursor() {
  window.printer.removeChild(cursor);
}

// Manage print head.
var printerColumn = 0;
function NewLine() {
  RemoveCursor();
  window.printer.appendChild(document.createElement('br'));
  AddCursor();
  window.scrollTo(0, document.body.scrollHeight);
  printerColumn = 0;
}
function EmitSpace() {
  RemoveCursor();
  var element = document.createElement('span');
  element.innerHTML = '&nbsp;';
  window.printer.appendChild(element);
  AddCursor();
  if (++printerColumn >= PRINTER_WIDTH) {
    NewLine();
  }
}
function EmitChar(ch, red) {
  RemoveCursor();
  var element = document.createElement('span');
  element.innerText = ch;
  if (red) {
    element.classList.add('red');
  }
  window.printer.appendChild(element);
  // Pop up ball
  cursor.classList.add('down');
  setTimeout(function() {
    cursor.classList.remove('down');
  }, 50);
  AddCursor();
  if (++printerColumn >= PRINTER_WIDTH) {
    NewLine();
  }
}

function Type(ch) {
  if (!power || ch == '') {
    return;
  }
  if (ch == '\n') {
    NewLine();
  } else if (ch == ' ') {
    EmitSpace();
  } else {
    EmitChar(ch, keyState['ShiftRight']);
  }
}

function KeyPick(key, e) {
  const table_alpha_shifted = ' !":);¬\'24567(3&+¢> 1=_?| ';
  const table_numeric = '  @%*<  -/';
  const table_numeric_shifted = '  #,$.  -0';
  const others = {
    'enter': ['\n', '\n'],
    'space': [' ', ' '],
    'comma': [',', '8'],
    'period': ['.', '9'],
  }
  if (e.ctrlKey || e.altKey) {
    return undefined;
  }
  if (key.id == 'key_' + e.code.toLowerCase()) {
    var chs = others[key.id.substr(4)];
    if (chs) {
      return chs[keyState['ShiftLeft'] ? 1 : 0];
    }
  }
  var ch = key.id.substr(4, 5).toUpperCase();
  if (key.id == 'key_' + ch.toLowerCase() && e.code == 'Key' + ch) {
    ch = ch.toUpperCase();
    if (keyState['ShiftLeft']) {
      var ch = table_alpha_shifted[ch.charCodeAt(0) - 'A'.charCodeAt(0)];
      return ch == ' ' ? '' : ch;
    } else {
      return ch;
    }
  }
  if (key.id == 'key_' + ch && e.code == 'Digit' + ch) {
    var ch = e.code.replace('Digit', '');
    if (keyState['ShiftLeft']) {
      ch = table_numeric_shifted[ch.charCodeAt(0) - '0'.charCodeAt(0)];
    } else {
      ch = table_numeric[ch.charCodeAt(0) - '0'.charCodeAt(0)];
    }
    return ch == ' ' ? '' : ch;
  }
  if (key.id == 'key_' + e.code.toLowerCase()) {
    return '';
  }
  return undefined;
}

window.onkeydown = function(e) {
  var keys = document.getElementsByClassName('key');
  for (var i = 0; i < keys.length; ++i) {
    var ch = KeyPick(keys[i], e);
    if (ch !== undefined) {
      keyState[e.code] = true;
      keys[i].classList.add('active');
      if (!e.repeat) {
        Type(ch);
      }
      e.preventDefault();
      break;
    }
  }
}

window.onkeyup = function(e) {
  var keys = document.getElementsByClassName('key');
  for (var i = 0; i < keys.length; ++i) {
    var ch = KeyPick(keys[i], e);
    if (ch !== undefined) {
      keyState[e.code] = false;
      keys[i].classList.remove('active');
      e.preventDefault();
      break;
    }
  }
}

function LabelRow(s) {
  var row = document.createElement('tr');
  for (var i = 0; i < 80; ++i) {
    var e = document.createElement('td');
    e.innerText = s.substr(i, 1);
    e.classList.add('label');
    row.appendChild(e);
  }
  return row;
}

function GapRow(numbered) {
  var row = document.createElement('tr');
  for (var i = 1; i <= 80; ++i) {
    var e = document.createElement('td');
    if (numbered) {
      e.innerText = i;
    }
    e.classList.add('gap');
    row.appendChild(e);
  }
  return row;
}

function PunchRow(n, msg) {
  var mark = n <= 9 ? n : '';
  var row = document.createElement('tr');
  for (var i = 0; i < 80; ++i) {
    var code = CARD_CODE[msg.substr(i, 1)];
    var punched = code !== undefined && code.includes(n);
    var e = document.createElement('td');
    e.classList.add('digit');
    e.innerText = mark;
    if (punched) {
      var p = document.createElement('div');
      p.classList.add('punch');
      e.appendChild(p);
    }
    row.appendChild(e);
  }
  return row;
}

function PunchCard() {
  var card = document.getElementById('card');
  var table = document.createElement('table');
  card.appendChild(table);
  var msg = 'HELLO 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ ,$.-@%*<_)¢|&>:;¬\'?"=!(';
  table.appendChild(LabelRow(msg));
  table.appendChild(PunchRow(12, msg));
  table.appendChild(GapRow(false));
  table.appendChild(PunchRow(11, msg));
  table.appendChild(GapRow(false));
  for (var i = 0; i < 10; ++i) {
    table.appendChild(PunchRow(i, msg));
    table.appendChild(GapRow(i == 0 || i == 9));
  }
}
PunchCard();

