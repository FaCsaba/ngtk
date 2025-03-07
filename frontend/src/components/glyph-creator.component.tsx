import { Glyph } from "@/models/glyph.model";
import { Designer, Path, Rect } from "@/react-designer";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X } from "lucide-react"

interface GlyphCreatorProps {
    glyph: Glyph;
    setGlyph: (glyph: Glyph) => void;
}

export function GlyphCreator({ glyph, setGlyph }: GlyphCreatorProps) {
    return (
        <div className="focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex gap-2 p-2">
                <Input className="w-full" onInput={(e) => setGlyph({ ...glyph, name: e.currentTarget.value })} value={glyph.name} placeholder="Glyph name" />
                <Button variant="ghost">X</Button>
            </div>
            <Designer objects={glyph.objs} width={250} height={350}
                objectTypes={{
                    'rect': Rect,
                    'path': Path
                }}
                onUpdate={(objs: any[], svg: SVGElement) => setGlyph({ ...glyph, objs, svg: svg.outerHTML })}
            ></Designer>
        </div>
    )
}