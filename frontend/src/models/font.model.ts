import FiraSans from "../assets/FiraSansMedium.ttf";
import { Glyph } from "./glyph.model";
import { Font as OpenTypeFont, Glyph as OpenTypeGlyph, Path as OpenTypePath, parse } from "@/extern/opentype-js/opentype.mjs";
import { NgtkMeta } from "./ngtk-meta";

const firaSansBuffer = fetch(FiraSans).then(res => res.arrayBuffer());
const firaSans = parse(await firaSansBuffer);

type OpenTypeGlyphI = InstanceType<typeof OpenTypeGlyph>;
type OpenTypeFontI = InstanceType<typeof OpenTypeFont>;

export class Font {
    private static PrivateUseCharCode = 0xE000;
    private font: OpenTypeFontI;

    constructor(private glyphs: Glyph[], name: string) {
        let gs: OpenTypeGlyphI[] = Object.values<OpenTypeGlyphI>(firaSans.glyphs.glyphs)
        glyphs.forEach((g, i) => {
            const paths = Array.from(g.svg?.querySelectorAll("path") ?? []);
            const path = paths.reduce((d, path) => d + " " + path.getAttribute("d"), "");
            const unicode = Font.PrivateUseCharCode + i;
            const glyph = new OpenTypeGlyph({
                name: "g" + i,
                unicode: unicode,
                path: OpenTypePath.fromSVG(path, { scale: 4 }),
                advanceWidth: 600,
            }); 
            const glyphIdx = gs.findIndex((g) => g.unicode === unicode);
            if (glyphIdx != -1) {
                gs[glyphIdx] = glyph;
            } else {
                gs.push(glyph);
            }
        });

        this.font = new OpenTypeFont({
            familyName: name,
            styleName: "Medium",
            unitsPerEm: 1000,
            ascender: 1050,
            descender: -500,
            glyphs: gs,
        });
    }

    public encode(): ArrayBuffer {
        const ngtkMeta = new NgtkMeta(this.glyphs).encode().reduce((s, d) => s + String.fromCodePoint(d), "");
        // @ts-ignore
        if (this.font.metas) {
            // @ts-ignore
            this.font.metas["Ngtk"] = ngtkMeta;
        } else {
            // @ts-ignore
            this.font.metas = { "Ngtk": ngtkMeta }
        }
        return this.font.toArrayBuffer();
    }
}