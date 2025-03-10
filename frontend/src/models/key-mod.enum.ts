export enum KeyMod {
    None    = 0 << 0,
    Shift   = 1 << 0,
    Ctrl    = 1 << 1,
    Alt     = 1 << 2,
}

export function getHumanReadableFromMod(mod: KeyMod): string | undefined {
    switch (mod) {
        case KeyMod.None: return undefined;
        case KeyMod.Shift: return "Shift";
        case KeyMod.Ctrl: return "Ctrl";
        case KeyMod.Alt: return "Alt";
    }
    return undefined;
}