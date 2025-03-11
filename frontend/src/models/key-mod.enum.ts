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

export function getModsFromKeyEvent(e: React.KeyboardEvent): number {
    var mods = KeyMod.None;
    if (e.shiftKey) mods |= KeyMod.Shift;
    if (e.ctrlKey) mods |= KeyMod.Ctrl;
    if (e.altKey) mods |= KeyMod.Alt;
    return mods;
}