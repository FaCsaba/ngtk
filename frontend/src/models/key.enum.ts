export enum Key {
    Null = 0,        // Key: NULL, used for no key pressed
    Quote = 39,       // Key: '
    Comma = 44,       // Key: ,
    Minus = 45,       // Key: -
    Period = 46,       // Key: .
    Slash = 47,       // Key: /
    Digit0 = 48,       // Key: 0
    Digit1 = 49,       // Key: 1
    Digit2 = 50,       // Key: 2
    Digit3 = 51,       // Key: 3
    Digit4 = 52,       // Key: 4
    Digit5 = 53,       // Key: 5
    Digit6 = 54,       // Key: 6
    Digit7 = 55,       // Key: 7
    Digit8 = 56,       // Key: 8
    Digit9 = 57,       // Key: 9
    Semicolon = 59,       // Key: ;
    Equal = 61,       // Key: =
    KeyA = 65,       // Key: A | a
    KeyB = 66,       // Key: B | b
    KeyC = 67,       // Key: C | c
    KeyD = 68,       // Key: D | d
    KeyE = 69,       // Key: E | e
    KeyF = 70,       // Key: F | f
    KeyG = 71,       // Key: G | g
    KeyH = 72,       // Key: H | h
    KeyI = 73,       // Key: I | i
    KeyJ = 74,       // Key: J | j
    KeyK = 75,       // Key: K | k
    KeyL = 76,       // Key: L | l
    KeyM = 77,       // Key: M | m
    KeyN = 78,       // Key: N | n
    KeyO = 79,       // Key: O | o
    KeyP = 80,       // Key: P | p
    KeyQ = 81,       // Key: Q | q
    KeyR = 82,       // Key: R | r
    KeyS = 83,       // Key: S | s
    KeyT = 84,       // Key: T | t
    KeyU = 85,       // Key: U | u
    KeyV = 86,       // Key: V | v
    KeyW = 87,       // Key: W | w
    KeyX = 88,       // Key: X | x
    KeyY = 89,       // Key: Y | y
    KeyZ = 90,       // Key: Z | z
    BracketLeft = 91,       // Key: [
    Backslash = 92,       // Key: '\'
    BracketRight = 93,       // Key: ]
    Backquote = 96,       // Key: `
    F1 = 290,      // Key: F1
    F2 = 291,      // Key: F2
    F3 = 292,      // Key: F3
    F4 = 293,      // Key: F4
    F5 = 294,      // Key: F5
    F6 = 295,      // Key: F6
    F7 = 296,      // Key: F7
    F8 = 297,      // Key: F8
    F9 = 298,      // Key: F9
    F10 = 299,      // Key: F10
    F11 = 300,      // Key: F11
    F12 = 301,      // Key: F12
}

export function getKeyFromCode(code: string): Key | undefined {
    // @ts-ignore
    return Key[code];
}

export function getHumanReadableFromKey(key: Key): string | undefined {
    switch (key) {
        case Key.Null: return undefined;
        case Key.Quote: return "\'";
        case Key.Comma: return ",";
        case Key.Minus: return "-";
        case Key.Period: return ".";
        case Key.Slash: return "/";
        case Key.Digit0: return "0";
        case Key.Digit1: return "1";
        case Key.Digit2: return "2";
        case Key.Digit3: return "3";
        case Key.Digit4: return "4"; 
        case Key.Digit5: return "5";
        case Key.Digit6: return "6";
        case Key.Digit7: return "7";
        case Key.Digit8: return "8";
        case Key.Digit9: return "9";
        case Key.Semicolon: return ";";
        case Key.Equal: return "=";
        case Key.KeyA: return "A";
        case Key.KeyB: return "B";
        case Key.KeyC: return "C";
        case Key.KeyD: return "D";
        case Key.KeyE: return "E";
        case Key.KeyF: return "F";
        case Key.KeyG: return "G";
        case Key.KeyH: return "H";
        case Key.KeyI: return "I";
        case Key.KeyJ: return "J";
        case Key.KeyK: return "K";
        case Key.KeyL: return "L";
        case Key.KeyM: return "M";
        case Key.KeyN: return "N";
        case Key.KeyO: return "O";
        case Key.KeyP: return "P";
        case Key.KeyQ: return "Q";
        case Key.KeyR: return "R";
        case Key.KeyS: return "S";
        case Key.KeyT: return "T";
        case Key.KeyU: return "U";
        case Key.KeyV: return "V";
        case Key.KeyW: return "W";
        case Key.KeyX: return "X";
        case Key.KeyY: return "Y";
        case Key.KeyZ: return "Z";
        case Key.BracketLeft: return "[";
        case Key.Backslash: return "\\";
        case Key.BracketRight: return "]";
        case Key.Backquote: return "`";
        case Key.F1: return "F1";
        case Key.F2: return "F2";
        case Key.F3: return "F3";
        case Key.F4: return "F4";
        case Key.F5: return "F5";
        case Key.F6: return "F6";
        case Key.F7: return "F7";
        case Key.F8: return "F8";
        case Key.F9: return "F9";
        case Key.F10: return "F10";
        case Key.F11: return "F11";
        case Key.F12: return "F12";
    }
    return undefined;
}