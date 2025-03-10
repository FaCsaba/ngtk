import { Glyph } from "@/models/glyph.model";
import { Designer, Path, Rect } from "@/react-designer";
import { Button } from "./ui/button";
import { X } from "lucide-react"
import { cn } from "@/lib/utils";
import { styles } from "@/react-designer/Designer";

interface GlyphCreatorProps {
    glyph: Glyph;
    setGlyph: (glyph: Glyph) => void;
    onDelete: () => void;
}

export function GlyphCreator({ glyph, setGlyph, className, onDelete, ...props }: React.ComponentProps<"div"> & GlyphCreatorProps) {
    return (
        <div className={cn(className, "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 rounded-xl border bg-card text-card-foreground shadow")} {...props}>
            <div className="p-2">
                <Button onClick={onDelete} variant="destructive" size="icon"><X /></Button>
            </div>
            <Designer objects={glyph.objs} width={250} height={250}
                objectTypes={{
                    'rect': Rect,
                    'path': Path
                }}
                onUpdate={(objs: any[], svg: SVGElement) => setGlyph({ ...glyph, objs, svg: svg.innerHTML })}
                background="none"
                styles={{
                    ...styles, canvasContainer: {
                        ...styles.canvasContainer,
                        height: "100%",
                        borderStyle: "var(--tw-border-style)",
                        borderWidth: "1px",
                        borderRadius: "calc(var(--radius) + 4px)"
                    }
                }}
            ></Designer>
        </div>
    )
}