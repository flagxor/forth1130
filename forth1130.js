'use strict';

var elements = {};
function getElement(name) {
  if (elements[name] === undefined) {
    elements[name] = document.getElementById(name);
  }
  return elements[name];
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

function Step() {
  // Decode
  sar = iar++;
  sbr = m[sar];
  op = (sbr >> 10) & 0x3f;
  format = (sbr >> 9) & 0x1;
  tag = (sbr >> 7) & 0x3;
  mod = (sbr >> 5) & 0x3;
  switch (op) {
    case 1:   // 00001 XIO
      // TODO
      break;
    case 2:   // 00010
      ccc = (tag ? m[tag] : sbr) & 0x3f;
      switch (mod) {
        case 0:  // 00 SLA
          acc <<= ccc;
          carry = (acc >> 16) & 1;
          ccc = 0;
          break;
        case 1:  // 01 SLCA
          while (!tag || ccc--) {
            acc <<= 1;
            carry = (acc >> 16) & 1;
            if (carry) {
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
          while (!tag || ccc--) {
            ext *= 2;
            carry = (acc & 0x100000000) ? 1 : 0;
            if (carry) {
              break;
            }
          }
          acc = ext >> 16;
          ext = ext & 0xffff;
          break;
       }
      break;
    case 3:   // 00011
      ccc = (tag ? m[tag] : sbr) & 0x3f;
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
    case 4:   // 00100 LDS
      carry = (sbr >> 1) & 1;
      overflow = sbr & 1;
      break;
    case 5:   // 00101 STS
      EffectiveAddress();
      m[sar] = (m[sar] & 0xff00) | (carry << 1) | overflow;
      break;
    case 6:   // 00110 WAIT
      // TODO: WAIT
      break;
    case 8:   // 01000 BSI
      EffectiveAddress();
      m[sar] = iar;
      iar = (sar + 1) & 0x7fff;
      // TODO: LONG FORM!!!
      break;
    case 9:   // 01001 BSC
      // TODO
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
        iar = sar & 0x7fff;
      }
      break;
    case 13:  // 01101 STX
      EffectiveAddress();
      m[sar] = tag ? m[tag] : iar;
      break;
    case 14:  // 01110 MDX
      // TODO
      break;
    case 16:  // 10000 A
      EffectiveAddress();
      afr = m[sar];
      acc += afr;
      overflow = SignExtend(acc) != acc;
      carry = (acc >> 16) & 1;
      acc &= 0xffff;
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
      break;
    case 18:  // 10010 S
      EffectiveAddress();
      afr = m[sar];
      acc -= afr;
      overflow = (acc & 0xffff) != acc;
      carry = (acc >> 16) & 1;
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
      break;
    case 20:  // 10100 M
      EffectiveAddress();
      afr = m[sar];
      acc *= afr;
      ext = acc & 0xffff;
      acc = (acc >> 16) & 0xffff;
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
      break;
    case 24:  // 11000 LD
      EffectiveAddress();
      acc = m[sar];
      break;
    case 25:  // 11001 LDD
      EffectiveAddress();
      ext = m[sar | 1];
      acc = m[sar];
      break;
    case 26:  // 11010 STO
      EffectiveAddress();
      m[sar] = acc;
      break;
    case 27:  // 11011 STD
      EffectiveAddress();
      m[sar | 1] = ext;
      m[sar] = acc;
      break;
    case 28:  // 11100 AND
      EffectiveAddress();
      afr = m[sar];
      acc &= afr;
      break;
    case 29:  // 11101 OR
      EffectiveAddress();
      afr = m[sar];
      acc |= afr;
      break;
    case 30:  // 11110 EOR
      EffectiveAddress();
      afr = m[sar];
      acc ^= afr;
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
}

setInterval(function() {
  Step();
  UpdateLights();
}, 20);

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

