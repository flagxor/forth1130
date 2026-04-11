'use strict';

// Machine State
var m = new Uint16Array(32768);
var iar = 0;
var sar = 0;
var sbr = 0;
var afr = 0;
var acc = 0;
var ext = 0;
var op = 0;
var format = 0;
var m8m9 = 0;
var modifiers = 0;
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
var turbo = 0;
var breakpoints = {};
var trace = 0;
var debug = 0;
// Debug State
var oldMemory = new Uint16Array(32768);
// I/O State
var disk_reading = 0;
var printer_printing = 0;
var console_status = 0;
var red_ribbon = 0;
var kb_select = 0;
var kb_codes = [];
// Key State
var numeric = 0;
var keyState = {};
// Constants
const ADDR_MASK = 0x7fff;
const WORD_MASK = 0xffff;

// Options
const PRINTER_WIDTH = 74;

// IBM Card Code
// 12 - EOF
// 13 - Backspace
// 14 - Erase Field
// 15 - ?
const CARD_CODE = {
  ' ': [],
  '0': [0], '1': [1], '2': [2], '3': [3], '4': [4],
  '5': [5], '6': [6], '7': [7], '8': [8], '9': [9],
  '¢': [12,8,2], '.': [12,8,3], '<': [12,8,4], '(': [12,8,5], '+': [12,8,6], '|': [12,8,7],
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
const CARD_PUNCH_POSITION = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 2, 1, 0];
const CHAR_TO_CODE = {};
const CODE_TO_CHAR = {};
for (var i in CARD_CODE) {
  var punches = CARD_CODE[i];
  var code = 0;
  for (var j = 0; j < punches.length; ++j) {
    code |= (1 << (15 - CARD_PUNCH_POSITION[punches[j]]));
  }
  CHAR_TO_CODE[i] = code;
  CODE_TO_CHAR[code] = i;
}
CHAR_TO_CODE['eof'] = 0x0008;
CHAR_TO_CODE['backspace'] = 0x0004;
CHAR_TO_CODE['erase'] = 0x0002;
CHAR_TO_CODE['intreq'] = 0x0001;

// EBCDIC
const EBCDIC_TABLE = [
  '          ¢.<(+|',
  '&         !$*);¬',
  '-/        ¦,%_>?',
  '         `:#@\'="',
  ' abcdefghi     ±',
  ' jklmnopqr      ',
  ' ~stuvwxyz      ',
  '^         []    ',
  '{ABCDEFGHI      ',
  '}JKLMNOPQR      ',
  '\\ STUVWXYZ      ',
  '0123456789      ',
];
const CHAR_TO_EBCDIC = {};
const EBCDIC_TO_CHAR = {};
var pos = 0x40;
for (var j = 0; j < EBCDIC_TABLE.length; ++j) {
  var row = EBCDIC_TABLE[j];
  for (var i = 0; i < row.length; ++i) {
    var ch = row.substr(i, 1);
    if (CHAR_TO_EBCDIC[ch] === undefined) {
      CHAR_TO_EBCDIC[ch] = pos;
      EBCDIC_TO_CHAR[pos] = ch;
    }
    ++pos;
  }
}

const CONSOLE_PRINTER_CODE =
    '.@  FGBCIH  DE A$&  OPKLRQ  MN J,-  WXSTZY  UV /#0  672398  45 1' +
    '¢%  FGBCIH  DE A!>  OPKLRQ  MN J:?  WXSTZY  UV _=|  ;*+<"\'  ¬) (';

// Decode current opcode.
const OPCODES = [
  '?00 ', 'XIO ', 'SLA ', 'SRA ', 'LDS ', 'STS ', 'WAIT', '?07 ',
  'BSI ', 'BSC ', '?0A ', '?0B ', 'LDX ', 'STX ', 'MDX ', '?0F ',
  'A   ', 'AD  ', 'S   ', 'SD  ', 'M   ', 'D   ', '?16 ', '?17 ',
  'LD  ', 'LDD ', 'STO ', 'STD ', 'AND ', 'OR  ', 'EOR ', 'FAKE',
];
const OPTAGS = [' ' , '1', '2', '3'];
function Disassemble() {
  var mode = format ? ((m8m9 & 2) ? 'I' : 'L') : ' ';
  var ret = ToBase(sar, 16, 4) + ': ' + OPCODES[op] + ' ' + mode + OPTAGS[tag];
  if (format) {
    ret += ' ' + ToBase(m[iar], 16, 4);
  } else {
    ret += ' ' + SignExtend(sbr, 8);
  }
  if (op == 0x0e && format) {
    ret += ', ' + SignExtend(sbr, 8);
  }
  return ret;
}

// Element Cache
var elements = {};
function getElement(name) {
  if (elements[name] === undefined) {
    elements[name] = document.getElementById(name);
  }
  return elements[name];
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

function Negative(n) {
  return (n & 0x8000) != 0;
}

function Positive(n) {
  return n && !Negative(n);
}

function SignExtend(v, bits) {
  return (v << (32-bits)) >> (32-bits);
}

function IncIAR() {
  var ret = iar;
  iar = (iar + 1) & ADDR_MASK;
  return ret;
}

function ChucksCode(n) {
  const code = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ¢#<(+|&!$*);¬-/,%_>?:.@\'=" ';
  return code.substr(n, 1);
}

function EffectiveAddress() {
  if (format) {
    sar = IncIAR();
    sbr = m[sar & ADDR_MASK];
    sar = sbr;
  } else {
    sar = SignExtend(sbr, 8);
  }
  if (tag) {
    sar += m[tag];
  } else {
    if (!format) {
      sar += iar;
    }
  }
  if (format && (m8m9 & 2)) {  // Indirect (M8)
    sbr = m[sar & ADDR_MASK];
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
  while (highest_signal && level > 0) {
    --level;
    highest_signal >>>= 1;
  }
  sbr = m[level + 8];
  m[sbr & ADDR_MASK] = iar;
  iar = (sbr + 1) & ADDR_MASK;
  if (trace) {
    console.log('Interrupt level: ' + level + '  to: ' + ToBase(iar, 16, 4));
  }
  waiting = 0;
  if (breakpoints[iar]) {
    waiting = 1;
  }
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

function CarriageReturn() {
  NewLine();
}

function LineFeed() {
  // TODO: Implement properly
}

function Tabulate() {
  // TODO: Implement properly
  for (var i = 0; i < 5; ++i) { EmitSpace(); }
}

function TypeRaw(n) {
  var control = (n >> 8) & 1;
  if (control) {
    var cd = (n >> 9) & 0x7f;
    if (trace) {
      console.log('CODE: ' + cd.toString(2));
    }
    switch (cd) {
      case 0b1000000: CarriageReturn(); break;
      case 0b0100000: Tabulate(); break;
      case 0b0010000: EmitSpace(); break;
      case 0b0001000: Backspace(); break;
      case 0b0000100: red_ribbon = 1; break;
      case 0b0000010: red_ribbon = 0; break;
      case 0b0000001: LineFeed(); break;
      case 0b1011110: EmitChar('_', red_ribbon); break;  // WEIRD?
      default: console.log('BAD CODE: ' + n.toString(2)); break;
    }
  } else {
    var ch1 = (n >> 10) & 0x3f;
    var ch2 = (n >> 9) & 1;
    var ch = CONSOLE_PRINTER_CODE[ch1 + ch2 * 64] || '?';
    if (trace) {
      console.log('CHAR: ' + ch + ' ' + ToBase(ch1, 2, 6) + ' ' + ch2);
    }
    EmitChar(ch, red_ribbon);
  }
}

// Meaning of console_status bits
// 0 - printer response triggered
// 1 - console response triggered
// 2 - int request key
// 3 - 0 = keyboard / 1 = console
// 4 - printer busy
// 5 - printer not ready
// 6 - keyboard busy

function Xio(addr, addr2) {
  var device = (addr2 >> 11) & 0x1f;
  var fun = (addr2 >> 8) & 0x7;
  var modifier = addr2 & 0xff;
  if (device == 0b10001) {  // 2310 Disk Storage, Drive 1
    // TODO: Shouldn't this be 0 to skip?
    acc = 0xffff;
  } else if (device == 0b00010) {  // 1442 Card Read-Punch
    acc = 0xffff;
  } else if (device == 0b00001) {  // Console Keyboard/Printer
    if (fun == 0b001) {  // Write
      TypeRaw(m[addr & ADDR_MASK]);
      console_status |= 0x0800;  // printer busy
      setTimeout(function() {
        console_status &= ~0x0800;  // not printer busy
        console_status |= 0x8000;  // printer response trigger
        SetSignal(4, 1);
      }, 1000 / 15);
      acc = 0xffff;
    } else if (fun == 0b010) {  // Read
      if (kb_codes.length) {
        kb_select = 0;
        m[addr & ADDR_MASK] = kb_codes.pop();
      } else {
        m[addr & ADDR_MASK] = 0;
      }
    } else if (fun == 0b100) {
      kb_select = 1;
    } else if (fun == 0b111) {
      acc = console_status;
      console_status &= ~0xE000;  // Clear trigger reasons
      SetSignal(4, 0);
    } else {
      console.log('XIO', ToBase(addr, 16, 4), ToBase(device, 2, 5), ToBase(fun, 2, 3), ToBase(modifier, 2, 8));
    }
  } else {
    console.log('XIO', ToBase(addr, 16, 4), ToBase(device, 2, 5), ToBase(fun, 2, 3), ToBase(modifier, 2, 8));
  }
}

function Op00010() {
  ccc = (tag ? m[tag] : sbr) & 0x3f;
  // Wildly off
  time += 3.6 + ccc * 0.45;
  switch (m8m9) {
    case 0b00:  // SLA
      acc <<= ccc;
      carry = (acc >> 16) & 1;
      ccc = 0;
      break;
    case 0b01:  // SLCA
      while (ccc--) {
        acc <<= 1;
        carry = (acc >> 16) & 1;
        if (tag && carry) {
          break;
        }
      }
      break;
    case 0b10:  // SLT
      ext = ((acc << 16) | ext) >>> 0;
      ext <<= ccc;
      acc = ext >>> 16;
      ext = ext & WORD_MASK;
      carry = (ext >> 16) & 1;
      ccc = 0;
      break;
    case 0b11:  // SLC
      ext = ((acc << 16) | ext) >>> 0;
      while (ccc--) {
        ext *= 2;
        carry = (acc & 0x100000000) ? 1 : 0;
        if (tag && carry) {
          break;
        }
      }
      acc = ext >>> 16;
      ext = ext & WORD_MASK;
      break;
  }
}

function Op00011() {
  ccc = (tag ? m[tag] : sbr) & 0x3f;
  // Wildly off
  time += 3.6 + ccc * 0.45;
  switch (m8m9) {
    case 0b00:  // SRA
    case 0b01:  // SRA
      acc >>= ccc;
      ccc = 0;
      break;
    case 0b10:  // SRT
      ext = ((acc << 16) | ext) >>> 0;
      ext >>>= ccc;
      acc = (ext >> 16) & WORD_MASK;
      ext = ext & WORD_MASK;
      ccc = 0;
      break;
    case 0b11:  // RTE
      ext = ((acc << 16) | ext) >>> 0;
      while (ccc--) {
        ext = (ext >>> 1) | ((ext & 1) << 31);
      }
      acc = (ext >> 16) & WORD_MASK;
      ext = ext & WORD_MASK;
      break;
  }
}

function Conditions() {
  var ret = (!overflow) | ((!carry) << 1) | ((!(acc & 1)) << 2) |
            (Positive(acc) << 3) | (Negative(acc) << 4) | ((acc == 0) << 5);
  overflow = 0;
  return ret;
}

function MaybeClearInterrupt() {
  if (m8m9 & 1) {
    // Drop lowest order 1 bit from interrupt mask.
    interrupt &= interrupt - 1;
  }
}

function BSC() {
  EffectiveAddress();
  var branch = 0;
  if (format) {
    if (!(modifiers & Conditions())) {
      iar = sar & ADDR_MASK;
      branch = 1;
    }
  } else {
    if (modifiers & Conditions()) {
      ++iar;
      branch = 1;
    }
  }
  if (branch) {
    MaybeClearInterrupt();
  }
  Timing(3.6, 3.6, branch ? 7.2 : 3.6, branch ? 11.2 : 3.6);
}

function BSI() {
  EffectiveAddress();
  if (!format || !(modifiers & Conditions())) {
    m[sar & ADDR_MASK] = iar;
    iar = (sar + 1) & ADDR_MASK;
    Timing(7.6, 11.2, 10.8, 14.8);
  } else {
    Timing(7.6, 11.2, 3.6, 3.6);
  }
}

function ToBase(n, base, digits) {
  var ret = '';
  for (var i = 0; i < digits; ++i) {
    ret += '0';
  }
  ret += n.toString(base).toUpperCase();
  return ret.substr(ret.length - digits);
}

function DISK1() {
  var control = m[IncIAR()];
  var buffer = m[IncIAR()];
  if (control == 0x1000) {  // READ
    var err = m[IncIAR()];
    disk_reading = 1;
    var size = m[buffer & ADDR_MASK];
    var sector = m[(buffer + 1) & ADDR_MASK];
    if (trace) {
      console.log('DISK1 reading, size: ' + size.toString(16) +
                  ' sector: ' + sector.toString(16));
    }
    setTimeout(function() {
      var data = DISK_SECTORS[sector - FORTH_BASE_SECTOR + FORTH_DISK_START];
      if (data === undefined) {
        data = new Uint16Array(DISK_SECTOR_SIZE);
      }
      for (var i = 0; i < size; ++i) {
        m[(buffer + 2 + i) & ADDR_MASK] = data[i];
      }
      disk_reading = 0;
    }, 30);
  } else if (control == 0x0000) {  // TEST
    if (!disk_reading) {
      IncIAR();
    }
  }
}

function PRNT1() {
  var control = m[IncIAR()];
  if (control == 0x2000) {  // PRINT
    var buffer = m[IncIAR()];
    var err = m[IncIAR()];
console.log('PRNT1', buffer.toString(16), err.toString(16));
    printer_printing = 1;
    var n = m[buffer & ADDR_MASK];
    var i = 0;
    function DoIt() {
      if (i < n * 2) {
        var addr = (buffer + Math.floor(i / 2) + 1) & ADDR_MASK;
console.log(addr.toString(16), m[addr].toString(16));
        var pair = m[addr];
        if (i % 2 == 0) {
          EmitChar(EBCDIC_TO_CHAR[pair >>> 8], false);
        } else {
          EmitChar(EBCDIC_TO_CHAR[pair & 0xff], false);
        }
        ++i;
        setTimeout(DoIt, 50);
      } else {
        CarriageReturn();
        printer_printing = 0;
      }
    }
    CarriageReturn();
    DoIt();
  } else if (control == 0x0000) {  // TEST
    if (!printer_printing) {
      IncIAR();
    }
  }
}

function MDX() {
  var oldval = 0;
  var newval = 0;
  if (tag) {
    EffectiveAddress();
    oldval = m[tag];
    m[tag] = sar;
    newval = m[tag];
  } else {
    if (format) {
      var disp = SignExtend(sbr, 8);
      sar = IncIAR();
      sbr = m[sar & ADDR_MASK];
      sar = sbr;
      oldval = m[sar & ADDR_MASK];
      m[sar & ADDR_MASK] += disp;
      newval = m[sar & ADDR_MASK];
    } else {
      EffectiveAddress();
      iar = sar;
    }
  }
  if (format || tag) {
    if ((newval & WORD_MASK) == 0 || ((newval & 0x8000) != (oldval & 0x8000))) {
      IncIAR();
    }
  }
}

function Step() {
  DoInterrupts();
  if (waiting) {
    return;
  }
  // Decode
  sar = IncIAR();
  sbr = m[sar & ADDR_MASK];
  op = (sbr >> 11) & 0x1f;
  format = (sbr >> 10) & 0x1;
  tag = (sbr >> 8) & 0x3;
  m8m9 = (sbr >> 6) & 0x3;
  modifiers = sbr & 0x7f;
  if (trace) {
    console.log('ACC=' + acc.toString(16) + ' XR1=' + m[1].toString(16) +
                ' XR2=' + m[2].toString(16) + ' XR3=' + m[3].toString(16));
    console.log(Disassemble());
  }
  switch (op) {
    case 0b00001:  // XIO
      EffectiveAddress();
      Xio(m[sar & ADDR_MASK], m[(sar|1) & ADDR_MASK]);
      Timing(11.2, 14.8, 14.4, 18.4);
      break;
    case 0b00010:
      Op00010();
      break;
    case 0b00011:
      Op00011();
      break;
    case 0b00100:  // LDS
      // Format bit ignored, treated same.
      carry = (sbr >> 1) & 1;
      overflow = sbr & 1;
      Timing(3.6, 3.6, 3.6, 3.6);
      break;
    case 0b00101:  // STS
      EffectiveAddress();
      m[sar & ADDR_MASK] = (m[sar & ADDR_MASK] & 0xff00) | (carry << 1) | overflow;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 0b00110:  // WAIT
      Timing(3.6, 3.6, 3.6, 3.6);
      waiting = 1;
      break;
    case 0b01000:  // BSI
      BSI();
      break;
    case 0b01001:  // BSC
      BSC();
      break;
    case 0b01100:  // LDX
      if (format) {
        sar = IncIAR();
        sbr = m[sar & ADDR_MASK];
        sar = sbr;
        if (m8m9 & 2) {
          sbr = m[sar & ADDR_MASK];
          sar = sbr;
        }
      } else {
        sar = SignExtend(sbr, 8);
      }
      if (tag) {
        m[tag & ADDR_MASK] = sar;
      } else {
        iar = sar & ADDR_MASK;
      }
      Timing(4.5, 7.2, 7.2, 11.8);
      break;
    case 0b01101:  // STX
      if (format) {
        sar = IncIAR();
        sbr = m[sar & ADDR_MASK];
        sar = sbr;
        if (m8m9 & 2) {
          sbr = m[sar & ADDR_MASK];
          sar = sbr;
        }
      } else {
        sar = (iar + SignExtend(sbr, 8)) & ADDR_MASK;
      }
      m[sar & ADDR_MASK] = tag ? m[tag] : iar;
      Timing(7.6, 11.2, 11.8, 15.4);
      break;
    case 0b01110:  // MDX
      MDX();
      Timing(4.5, 11.2, 18.5, 18.5);
      break;
    case 0b10000:  // A
      EffectiveAddress();
      afr = m[sar & ADDR_MASK];
      var old = acc;
      acc = (acc + afr) & WORD_MASK;
      carry = acc < afr;
      if (!overflow) {
        overflow = Negative(((afr ^ WORD_MASK) ^ old) & (afr ^ acc));
      }
      Timing(8.0, 11.7, 11.2, 15.3);
      break;
    case 0b10001:  // AD
      EffectiveAddress();
      arf = ext;
      var old = ((acc << 16) | ext) >>> 0;
      var afr2 = ((m[(sar | 1) & ADDR_MASK] << 16) | m[sar & ADDR_MASK]) >>> 0;
      var sum = (old + afr2) >>> 0;
      acc = (sum >> 16) & WORD_MASK;
      ext = sum & WORD_MASK;
      carry = acc < afr;
      if (!overflow) {
        overflow = Negative((~afr2 ^ old) & (afr2 ^ sum));
      }
      Timing(12.2, 15.8, 15.3, 19.3);
      break;
    case 0b10010:  // S
      EffectiveAddress();
      afr = m[sar & ADDR_MASK];
      var old = acc;
      acc = (acc - afr) & WORD_MASK;
      carry = acc < afr;
      if (!overflow) {
        overflow = Negative(((afr ^ WORD_MASK) ^ old) & (afr ^ acc));
      }
      Timing(8.0, 11.7, 11.2, 15.3);
      break;
    case 0b10011:  // SD
      EffectiveAddress();
      arf = ext;
      var old = ((acc << 16) | ext) >>> 0;
      var afr2 = ((m[(sar | 1) & ADDR_MASK] << 16) | m[sar & ADDR_MASK]) >>> 0;
      var sum = (old - afr2) >>> 0;
      acc = (sum >> 16) & WORD_MASK;
      ext = sum & WORD_MASK;
      carry = acc < afr;
      if (!overflow) {
        overflow = Negative((~afr2 ^ old) & (afr2 ^ sum));
      }
      Timing(12.2, 15.8, 15.3, 19.3);
      break;
    case 0b10100:  // M
      EffectiveAddress();
      afr = m[sar & ADDR_MASK];
      acc *= afr;
      ext = acc & WORD_MASK;
      acc = (acc >> 16) & WORD_MASK;
      Timing(25.7, 29.3, 29.3, 32.9);
      break;
    case 0b10101:  // D
      EffectiveAddress();
      afr = m[sar & ADDR_MASK];
      if (afr == 0) {
        overflow = 1;
      } else {
        acc = (acc << 16) | ext;
        ext = acc % afr;
        acc = acc / afr;
        overflow = SignExtend(acc, 16) != acc;
      }
      Timing(76.0, 79.6, 79.6, 83.2);
      break;
    case 0b11000:  // LD
      EffectiveAddress();
      acc = m[sar & ADDR_MASK];
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 0b11001:  // LDD
      EffectiveAddress();
      ext = m[(sar | 1) & ADDR_MASK];
      acc = m[sar & ADDR_MASK];
      Timing(11.2, 14.9, 14.4, 18.0);
      break;
    case 0b11010:  // STO
      EffectiveAddress();
      m[sar & ADDR_MASK] = acc;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 0b11011:  // STD
      EffectiveAddress();
      m[(sar | 1) & ADDR_MASK] = ext;
      m[sar & ADDR_MASK] = acc;
      Timing(11.2, 14.9, 14.4, 18.0);
      break;
    case 0b11100:  // AND
      EffectiveAddress();
      afr = m[sar & ADDR_MASK];
      acc &= afr;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 0b11101:  // OR
      EffectiveAddress();
      afr = m[sar & ADDR_MASK];
      acc |= afr;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 0b11110:  // EOR
      EffectiveAddress();
      afr = m[sar & ADDR_MASK];
      acc ^= afr;
      Timing(7.6, 11.2, 10.8, 14.8);
      break;
    case 0b11111:  // Coopted for pseudo-instructions.
      if (modifiers == 1) {
        DISK1();
      } else if (modifiers == 2) {
        PRNT1();
      }
      break;
    default:
      // Interpreted as equivalent to WAIT.
      Timing(3.6, 3.6, 3.6, 3.6);
      waiting = 1;
      break;
  }
  if (breakpoints[iar]) {
    waiting = 1;
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
  setBits('m8m9', m8m9, 2);
  setBits('ccc', ccc, 6);
  setLight('carry', carry);
  setLight('overflow', overflow);
  setBits('int', interrupt, 6);
  setLight('xr1', tag == 1);
  setLight('xr2', tag == 2);
  setLight('xr3', tag == 3);
  setLight('running', running);
  setLight('wait', waiting);
  setLight('kb_select', kb_select);
  setLight('numeric', numeric);
  setLight('alpha', !numeric);
}

function ConsoleMode() {
  const names = ['SS', 'SMC', 'INT_RUN', 'RUN', 'SI', 'DISP', 'LOAD'];
  var i = parseInt(document.querySelector('input[name="console_mode"]:checked').value);
  var knob = document.getElementById('knob');
  knob.style.transform = 'rotate(' + ((i - 3) * 40) + 'deg)';
  return names[i];
}

var powerSwitch = document.getElementById('power');
function PowerSwitch() {
  power = powerSwitch.checked | 0;
  if (!power) {
    running = 0;
    LightsOut();
  } else {
    UpdateLights();
  }
}
powerSwitch.onchange = PowerSwitch;

var turboSwitch = document.getElementById('turbo');
function TurboSwitch() {
  turbo = turboSwitch.checked | 0;
}
turboSwitch.onchange = TurboSwitch;

var consoleSwitch = document.getElementById('keycon');
function ConsoleSwitch() {
  if (consoleSwitch.checked) {
    console_status |= 0x1000;  // console
  } else {
    console_status &= ~0x1000;  // keyboard
  }
}
consoleSwitch.onchange = ConsoleSwitch;

function ProgramStart() {
  if (!power) {
    return;
  }
  waiting = 0;
  var console_mode = ConsoleMode();
  if (console_mode == 'RUN') {
    running = 1;
  } else if (console_mode == 'DISP') {
    IncIAR();
  } else if (console_mode == 'LOAD') {
    m[IncIAR()] = getBits('switch');
  } else {
    Step();
  }
  UpdateLights();
}
document.getElementById('program_start').onclick = ProgramStart;

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
  if (!power) {
    return;
  }
  running = 0;
  waiting = 0;
  UpdateLights();
};

function ProgramStop() {
  if (!power) {
    return;
  }
  running = 0;
  waiting = 0;
  UpdateLights();
}
document.getElementById('program_stop').onclick = ProgramStop;

function DecodeAsmName(n) {
  var base = ['A', 'J', 'R'];
  var result = '';
  for (var i = 0; i < 5; ++i) {
    var num = n & 0xf;
    var marks = (n >> 4) & 0x3;
    var ch = ' ';
    if (marks < 3) {
      ch = String.fromCharCode(base[marks].charCodeAt(0) - 1 + num);
      ch = ch.replace('@', ' ');
    } else {
      ch = String.fromCharCode('0'.charCodeAt(0) + num);
    }
    result = ch + result;
    n >>>= 6;
  }
  return result;
}

function LoadForthAsm() {
  var lines = forth_asm.split('\n');
  for (var i = 1; i < lines.length; ++i) {
    var line = lines[i];
    var addr = parseInt(line.substr(0, 4), 16);
    var kind = line.substr(5, 2);
    var data1 = parseInt(line.substr(8, 4), 16);
    if (kind == '0 ') {  // One word
      m[addr] = data1;
    } else if (kind == '00') {  // Two word
      var data2 = parseInt(line.substr(12, 4), 16);
      if (line.substr(32, 4) == 'LINK') {
        var name = DecodeAsmName((data1 << 16) | parseInt(line.substr(12, 4), 16));
        m[addr] = 0x4400;
        if (name == 'BALO ') {
          m[addr + 1] = 0x0039;
        } else {
          console.log('Got LINK "' + name + '" at ' + addr.toString(16));
        }
        m[addr + 2] = data1;
        m[addr + 3] = data2;
        continue;
      }
      m[addr] = data1;
      m[addr + 1] = data2;
    } else if (kind == '20') {
      var name = DecodeAsmName((data1 << 16) | parseInt(line.substr(12, 4), 16));
      if (name == 'DISK1') {
        m[addr] = 0xFF01;
      } else if (name == 'PRNT1') {
        m[addr] = 0xFF02;
      } else {
        console.log('Got LIBF "' + name + '" at ' + addr.toString(16));
      }
    } else if (kind == '  ') {
      // BSS (blanks) or Entrypoint (last one)
      iar = data1;
    }
  }
  // Init XR3 to something other than zero (as if we come in from DMS).
  m[3] = 0x3F80;  // observed in emulator
}

const FORTH_DISK_START = 238;
const FORTH_BASE_SECTOR = 0x10EE;
const DISK_SECTOR_SIZE = 320;
const DISK_SECTORS = {};

function LoadForthCards() {
  var sector = FORTH_DISK_START;
  var pos = DISK_SECTOR_SIZE;
  var lines = forth_cards.split('\n');
  var data = new Uint16Array(DISK_SECTOR_SIZE);
  DISK_SECTORS[sector++] = data;
  function AddWord(w) {
    --pos;
    data[pos] = w;
    if (pos == 0) {
      DISK_SECTORS[sector++] = data;
      data = new Uint16Array(DISK_SECTOR_SIZE);
      pos = DISK_SECTOR_SIZE;
    }
  }
  for (var j = 1; j < lines.length; ++j) {
    var line = lines[j];
    while (line.length < 80) {
      line += ' ';
    }
    for (var i = 0; i < line.length; i+=2) {
      AddWord((CHAR_TO_EBCDIC[line[i]] << 8) | CHAR_TO_EBCDIC[line[i + 1]]);
    }
  }
}
LoadForthCards();

function ProgramLoad() {
  if (!power) {
    return;
  }
  LoadForthAsm();
  UpdateLights();
}
document.getElementById('program_load').onclick = ProgramLoad;

function Reset() {
  iar = 0;
  sar = 0;
  sbr = 0;
  afr = 0;
  acc = 0;
  ext = 0;
  op = 0;
  format = 0;
  m8m9 = 0;
  modifiers = 0;
  tag = 0;
  ccc = 0;
  carry = 0;
  overflow = 0;
  interrupt = 0;
  signal = 0;
  running = 0;
  waiting = 0;
  UpdateLights();
}
document.getElementById('reset').onclick = Reset;

function Run() {
  if (power) {
    var console_mode = ConsoleMode();
    if (console_mode == 'RUN' && running) {
      var tm = Math.min(1000, Math.max(1, new Date().getTime() - last_time)) * 1000;
      if (turbo) {
        tm *= 100;
      }
      while (time < tm) {
        Step();
        if (waiting) {
          break;
        }
      }
      time -= tm;
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
  if (debug) {
    UpdateMemoryView();
  }
  last_time = new Date().getTime();
  requestAnimationFrame(Run);
}
Run();

// Start automatically
setTimeout(function() {
  turboSwitch.checked = true;
  TurboSwitch();
  setTimeout(function() {
    powerSwitch.checked = true;
    PowerSwitch();
    setTimeout(function() {
      document.getElementById('program_load').classList.add('active');
      ProgramLoad();
      setTimeout(function() {
        document.getElementById('program_load').classList.remove('active');
        document.getElementById('program_start').classList.add('active');
        ProgramStart();
        setTimeout(function() {
          document.getElementById('program_start').classList.remove('active');
        }, 500);
      }, 500);
    }, 500);
  }, 500);
}, 500);

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
  if (ch == ' ') {
    EmitSpace();
    return;
  }
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

function RawType(code) {
  if (code == 0x0001) {
    kb_codes.push(getBits('switch'));
    console_status |= 0x2000;  // int req key
    SetSignal(4, 1);
  } else if (!(console_status & 0x1000)) {  // keyboard mode
    kb_codes.push(code);
    console_status |= 0x4000;  // console trigger
    SetSignal(4, 1);
  }
}

function Type(ch) {
  if (!power || ch == '') {
    return;
  }
  if (ch == 'numeric') {
    numeric = 1;
    return;
  }
  if (ch == 'alpha') {
    numeric = 0;
    return;
  }
  var code = CHAR_TO_CODE[ch];
  if (code !== undefined) {
    RawType(code);
  }
}

function KeyNumeric(ch) {
  const table_numeric = '  @%*<  -/';
  const table_numeric_shifted = '  #,$.  -0';
  var ch;
  if (numeric) {
    ch = table_numeric_shifted[ch.charCodeAt(0) - '0'.charCodeAt(0)];
  } else {
    ch = table_numeric[ch.charCodeAt(0) - '0'.charCodeAt(0)];
  }
  return ch == ' ' ? '' : ch;
}

function KeyAlpha(ch) {
  const table_alpha_shifted = ' !":);¬\'24567(3&+¢> 1=_?| ';
  ch = ch.toUpperCase();
  if (numeric) {
    var ch = table_alpha_shifted[ch.charCodeAt(0) - 'A'.charCodeAt(0)];
    return ch == ' ' ? '' : ch;
  } else {
    return ch;
  }
}

function KeyOther(name) {
  name = name.toLowerCase();
  const others = {
    'space': [' ', ' '],
    'comma': [',', '8'],
    'period': ['.', '9'],
    'equal': ['intreq', 'intreq'],
    'backspace': ['backspace', 'backspace'],
    'enter': ['erase', 'erase'],
    'backslash': ['eof', 'eof'],
    'shiftleft': ['numeric', 'numeric'],
    'shiftright': ['alpha', 'alpha'],
  }
  var chs = others[name];
  if (chs) {
    return chs[numeric ? 1 : 0];
  } else {
    return undefined;
  }
}

function KeyPick(key, e) {
  if (e.ctrlKey || e.altKey) {
    return undefined;
  }
  if (key.id == 'key_' + e.code.toLowerCase()) {
    var chs = KeyOther(key.id.substr(4));
    if (chs !== undefined) {
      return chs;
    }
  }
  var ch = key.id.substr(4).toUpperCase();
  if (key.id == 'key_' + ch.toLowerCase() && e.code == 'Key' + ch) {
    return KeyAlpha(ch);
  }
  if (key.id == 'key_' + ch && e.code == 'Digit' + ch) {
    return KeyNumeric(ch);
  }
  if (key.id == 'key_' + e.code.toLowerCase()) {
    return '';
  }
  return undefined;
}

function HandleKey(e) {
  var ch = e.target.id.substr(4).toUpperCase();
  if (ch.length == 1) {
    if ('0123456789'.includes(ch)) {
      ch = KeyNumeric(ch);
    } else {
      ch = KeyAlpha(ch);
    }
  } else {
    ch = KeyOther(ch);
  }
  if (ch !== undefined) {
    Type(ch);
  }
}

function SetupKeys() {
  var keys = document.getElementsByClassName('key');
  for (var i = 0; i < keys.length; ++i) {
    if (keys[i].id.startsWith('key_')) {
      keys[i].onmousedown = HandleKey;
      keys[i].tabIndex = -1;
    }
  }
  var keys = document.getElementsByClassName('console-light');
  for (var i = 0; i < keys.length; ++i) {
    keys[i].tabIndex = "-1";
  }
  var keys = document.getElementsByClassName('console-switch');
  for (var i = 0; i < keys.length; ++i) {
    keys[i].tabIndex = "-1";
  }
  var keys = document.getElementsByClassName('console-key');
  for (var i = 0; i < keys.length; ++i) {
    keys[i].tabIndex = "-1";
  }
}
SetupKeys();

window.onkeydown = function(e) {
  if (e.altKey) {
    if (e.code == 'KeyT') {
      trace = 1 - trace;
      e.preventDefault();
      return;
    } else if (e.code == 'KeyS') {
      if (waiting || !running) {
        ProgramStart();
      } else {
        ProgramStop();
      }
      e.preventDefault();
      return;
    } else if (e.code == 'KeyD') {
      ToggleMemoryView();
      e.preventDefault();
      return;
    } else if (e.code == 'KeyP') {
      powerSwitch.checked = !powerSwitch.checked;
      PowerSwitch();
      e.preventDefault();
      return;
    } else if (e.code == 'KeyL') {
      ProgramLoad();
      e.preventDefault();
      return;
    } else if (e.code == 'KeyR') {
      Reset();
      e.preventDefault();
      return;
    }
  }
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

// Optional memory view for debugging.
const MEM_WIDTH = 32;
const MEM_HEIGHT = 512;
var memtable = [];
var memrows = [];

function BreakToggle(e) {
  var addr = e.target.getAttribute('address');
  if (breakpoints[addr]) {
    delete breakpoints[addr];
    e.target.classList.remove('breakpoint');
  } else {
    breakpoints[addr] = 1;
    e.target.classList.add('breakpoint');
  }
}

function InitMemoryView() {
  var memory = document.getElementById('memory');
  var row = document.createElement('tr');
  var e = document.createElement('td');
  row.appendChild(e);
  for (var i = 0; i < MEM_WIDTH; ++i) {
    var e = document.createElement('th');
    e.innerText = 'xx' + ToBase(i, 16, 2);
    row.appendChild(e);
  }
  memory.appendChild(row);
  for (var j = 0; j < MEM_HEIGHT; ++j) {
    var row = document.createElement('tr');
    row.style.display = 'none';
    var e = document.createElement('th');
    e.innerText = ToBase(j * MEM_WIDTH, 16, 4).substr(0, 3) + 'x';
    row.appendChild(e);
    for (var i = 0; i < MEM_WIDTH; ++i) {
      var e = document.createElement('td');
      e.setAttribute('address', i + j * MEM_WIDTH);
      e.onmousedown = BreakToggle;
      if (j % 2 == 0) {
        e.classList.add('evencol');
      }
      if (i % 2 == 0) {
        e.classList.add('evenrow');
      }
      e.innerText = '0000';
      memtable.push(e);
      row.appendChild(e);
    }
    memory.appendChild(row);
    memrows.push(row);
  }
}

function ToggleMemoryView() {
  debug = 1 - debug;
  var memory = document.getElementById('memory');
  memory.style.display = debug ? '': 'none';
}

function UpdateMemoryView() {
  if (!memtable) {
    return;
  }
  if (memtable.length == 0) {
    InitMemoryView();
  }
  var pos = 0;
  for (var j = 0; j < MEM_HEIGHT; ++j) {
    var all_zero = true;
    for (var i = 0; i < MEM_WIDTH; ++i) {
      var val = m[pos];
      if (val === oldMemory[pos]) {
        ++pos;
        continue;
      }
      oldMemory[pos] = val;
      var e = memtable[pos];
      var valstr = ToBase(val, 16, 4);
      var a = (val >> 8) & 0xff;
      var b = val & 0xff;
      if (a < 64 && b < 64) {
        valstr += ' ' + ChucksCode(a) + ChucksCode(b);
      }
      if (e.innerText != valstr) {
        e.innerText = valstr;
      }
      all_zero = all_zero && val == 0;
      if (iar == pos) {
        e.classList.add('running');
      } else {
        e.classList.remove('running');
      }
      ++pos;
    }
    if (memrows[j].style.display == 'none' && !all_zero) {
      memrows[j].style.display = '';
    }
  }
}
