import { useState } from "react";
import { Designer, Text, Rect } from "./react-designer";
import { AgentWasm } from "./agent";
import { NeographyPreviewer } from "./components/neography-preview.component";

export default function App({ agent }: { agent: AgentWasm }) {
  const [objects, setObjects] = useState([]);

  return (
    <>
      <Designer objects={objects} width={250} height={350}
        objectTypes={{
          'text': Text,
          'rect': Rect,
        }}
        onUpdate={(objects: any) => setObjects(objects)}
      ></Designer>
      <NeographyPreviewer agent={agent} />
    </>
  )
}