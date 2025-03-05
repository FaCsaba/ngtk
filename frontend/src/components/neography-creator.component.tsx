import { useState } from "react";

export enum NeographyCreationStep {
    Naming,
    GlyphCreation,
    Download,
}

export const NeographyCreator = () => {
    const [step, setStep] = useState(NeographyCreationStep.Naming);
    const [name, setName] = useState("");

    return <>
        <section id="neography-step-naming">
            <h1>Naming</h1>

        </section>
    </>
}