export interface ColorScheme {
    bg: number;
    fg: number;
};

export function colorSchemeFromHsl(bg: string, fg: string) {
    return { bg: hsl2rgb(bg), fg: hsl2rgb(fg) };
}


function hsl2rgb(hsl: string) {
    const [hstr, sstr, lstr] = hsl.split(" ")
    const h = Number(hstr.split("hsl(")[1]);
    const s = Number(sstr.split("%")[0]) / 100;
    const l = Number(lstr.split("%")[0]) / 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0,
        a = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    a = 255;
    return (
        (r << 24) +
        (g << 16) +
        (b << 8) +
        (a << 0)
    );
}