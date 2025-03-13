import { useState } from "react";
import { Input } from "./ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button, buttonVariants } from "./ui/button";
import { NeographyPreviewer } from "./neography-preview.component";
import { useAgent } from "./agent-provider.component";
import { GlyphCreator } from "./glyph-creator.component";
import { Glyph } from "@/models/glyph.model";
import { KeyMapping } from "./key-mapping.component";
import { Font } from "@/models/font.model";

enum NGStep {
    Naming = "Naming",
    GlyphCreation = "GlyphCreation",
    KeyMapping = "KeyMapping",
    Preview = "Preview",
}

export const NeographyCreator = () => {
    const { agent, isLoading, error } = useAgent();
    const [step, setStep] = useState(NGStep.Naming);
    const [name, setName] = useState("");
    const [glyphs, setGlyphs] = useState<Glyph[]>([]);
    const [font, setFont] = useState<Font>();

    function canStepTo(step: NGStep): boolean {
        switch (step) {
            case NGStep.Naming: return true;
            case NGStep.GlyphCreation: return canStepTo(NGStep.Naming) && !!name.trim();
            case NGStep.KeyMapping: return canStepTo(NGStep.GlyphCreation) && glyphs.length > 0 && glyphs.every(g => g.svg);
            case NGStep.Preview: return canStepTo(NGStep.KeyMapping) && glyphs.every(g => g.keyMap);
        }
        return false;
    }

    function onChangeStep(st: NGStep) {
        if (canStepTo(st)) setStep(st);
    }

    function onSetGlyph(glyph: Glyph) {
        setGlyphs((glyphs) => {
            const i = glyphs.findIndex((g) => g.uuid === glyph.uuid);
            if (i < 0) throw new Error("Unreachable: Should not be able to change non existent glyph");
            glyphs[i] = glyph;
            return [...glyphs];
        });
    }

    function onDeleteGlyph(glyph: Glyph) {
        setGlyphs((glyphs) => glyphs.filter(g => g !== glyph));
    }

    function onNewGlyph() {
        setGlyphs((glyphs) => [...glyphs, { uuid: crypto.randomUUID(), objs: [] }])
    }


    function onChangeStepToPreview(): void {
        const font = new Font(glyphs, name);
        setFont(font);

        if (!agent) throw new Error("Unreachable: Agent should be initialized at this point.");

        agent.loadFont(font.encode());
        setStep(NGStep.Preview);
    }

    if (isLoading) return <h1 className="text-xxl">Loading wasm module...</h1>;

    if (error || agent === null) {
        return <>
            <h1 className="text-xxl fg-destructive">Failed to load in component</h1>
            {error ?
                <h2 className="text-lg">{error.message}</h2>
                : <></>
            }
        </>
    }

    return <div className="w-full">
        <h1 className="text-xl">Create your neography</h1>
        <Accordion type="single" value={step} defaultValue={step} onValueChange={onChangeStep} collapsible>
            <AccordionItem value={NGStep.Naming} disabled={!canStepTo(NGStep.Naming)}>
                <AccordionTrigger>General information</AccordionTrigger>
                <AccordionContent className="flex gap-5 flex-col p-5">
                    <form onSubmit={(e) => { e.preventDefault(); onChangeStep(NGStep.GlyphCreation) }}>
                        <Input onInput={(e) => setName(e.currentTarget.value)} value={name} placeholder="Name of your script" />
                    </form>
                    <div className="flex gap-2">
                        <Button disabled={!canStepTo(NGStep.GlyphCreation)} onClick={() => setStep(NGStep.GlyphCreation)}>Next</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value={NGStep.GlyphCreation} disabled={!canStepTo(NGStep.GlyphCreation)}>
                <AccordionTrigger>Creating your glyphs</AccordionTrigger>
                <AccordionContent className="flex gap-5 flex-col p-5">
                    <div className="flex flex-wrap gap-2">
                        {glyphs.map(glyph => (
                            <GlyphCreator
                                key={glyph.uuid}
                                glyph={glyph}
                                setGlyph={onSetGlyph}
                                onDelete={() => onDeleteGlyph(glyph)}
                            />
                        ))}
                    </div>
                    <Button onClick={onNewGlyph}>Add Glyph</Button>
                    <div className="flex gap-2">
                        <Button disabled={!canStepTo(NGStep.Naming)} onClick={() => setStep(NGStep.Naming)}>Previous</Button>
                        <Button disabled={!canStepTo(NGStep.KeyMapping)} onClick={() => setStep(NGStep.KeyMapping)}>Next</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value={NGStep.KeyMapping} disabled={!canStepTo(NGStep.KeyMapping)}>
                <AccordionTrigger>Key mapping</AccordionTrigger>
                <AccordionContent className="flex gap-5 flex-col p-5">
                    <p>Map the corresponding character to a key</p>
                    <div className="flex gap-5 flex-col p-5">
                        {glyphs.map(glyph => (
                            <KeyMapping key={glyph.uuid} glyph={glyph} setGlyph={onSetGlyph} />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button disabled={!canStepTo(NGStep.GlyphCreation)} onClick={() => setStep(NGStep.GlyphCreation)}>Previous</Button>
                        <Button disabled={!canStepTo(NGStep.Preview)} onClick={() => onChangeStepToPreview()}>Next</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value={NGStep.Preview} disabled={!canStepTo(NGStep.Preview)}>
                <AccordionTrigger>Try it out</AccordionTrigger>
                <AccordionContent className="flex gap-5 flex-col p-5">
                    <NeographyPreviewer agent={agent} />
                    <div className="flex gap-2">
                        <Button disabled={!canStepTo(NGStep.KeyMapping)} onClick={() => setStep(NGStep.KeyMapping)}>Previous</Button>
                        <a className={buttonVariants()} download={name+".ttf"} href={window.URL.createObjectURL(new Blob([font?.encode() ?? ""]))}>Download</a>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
}