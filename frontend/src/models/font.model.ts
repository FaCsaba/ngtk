import FiraSans from "../assets/FiraSansMedium.woff";
import { Glyph } from "./glyph.model";
import { Font as OpenTypeFont, Glyph as OpenTypeGlyph, Path as OpenTypePath, parse } from "@/extern/opentype-js/opentype.mjs";
import { NgtkMeta } from "./ngtk-meta";

const firaSansBuffer = fetch(FiraSans).then(res => res.arrayBuffer());
const firaSans = parse(await firaSansBuffer);

type OpenTypeGlyphI = InstanceType<typeof OpenTypeGlyph>;
type OpenTypeFontI = InstanceType<typeof OpenTypeFont>;

export class Font {
    private font: OpenTypeFontI;

    constructor(private glyphs: Glyph[], name: string) {
        let gs: OpenTypeGlyphI[] = Object.values<OpenTypeGlyphI>(firaSans.glyphs.glyphs).filter(g => g.index === 0 || g.unicode < 256);
        glyphs.forEach((g, i) => {
            const paths = Array.from(g.svg?.querySelectorAll("path") ?? []);
            const path = paths.reduce((d, path) => d + " " + path.getAttribute("d"), "");
            gs.push(new OpenTypeGlyph({
                name: "g" + i,
                unicode: 0xE000 + i,
                path: OpenTypePath.fromSVG(path, { scale: 4 }),
                advanceWidth: 600,
            }));
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