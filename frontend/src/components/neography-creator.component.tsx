import { useState } from "react";
import { Input } from "./ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { NeographyPreviewer } from "./neography-preview.component";
import { useAgent } from "./agent-provider.component";
import { GlyphCreator } from "./glyph-creator.component";
import { Glyph } from "@/models/glyph.model";

enum NGStep {
    Naming = "Naming",
    GlyphCreation = "GlyphCreation",
    Download = "Download",
}

export const NeographyCreator = () => {
    const { agent, isLoading, error } = useAgent();
    const [step, setStep] = useState(NGStep.Naming);
    const [name, setName] = useState("");
    const [glyphs, setGlyphs] = useState<Glyph[]>([]);

    function canStepTo(step: NGStep): boolean {
        switch (step) {
            case NGStep.Naming: return true;
            case NGStep.GlyphCreation: return canStepTo(NGStep.Naming) && name.length > 0;
            case NGStep.Download: return canStepTo(NGStep.GlyphCreation) && true;
        }
        return false;
    }

    function onChangeStep(st: NGStep) {
        if (canStepTo(st)) setStep(st);
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
                        {glyphs.map((glyph, i) => {
                            return <GlyphCreator glyph={glyph} setGlyph={(glyph) => {
                                glyphs[i] = glyph;
                                setGlyphs([...glyphs]);
                            }} />
                        })}
                    </div>
                    <Button onClick={() => setGlyphs((glyphs) => [...glyphs, { name: "", objs: [], svg: "" }])}>Add Glyph</Button>
                    <div className="flex gap-2">
                        <Button disabled={!canStepTo(NGStep.Naming)} onClick={() => setStep(NGStep.Naming)}>Previous</Button>
                        <Button disabled={!canStepTo(NGStep.Download)} onClick={() => setStep(NGStep.Download)}>Next</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value={NGStep.Download} disabled={!canStepTo(NGStep.Download)}>
                <AccordionTrigger>Try it out</AccordionTrigger>
                <AccordionContent className="flex gap-5 flex-col p-5">
                    <NeographyPreviewer agent={agent} />
                    <div className="flex gap-2">
                        <Button disabled={!canStepTo(NGStep.GlyphCreation)} onClick={() => setStep(NGStep.GlyphCreation)}>Previous</Button>
                        <Button onClick={() => setStep(NGStep.Download)}>Download</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
}