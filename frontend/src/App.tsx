import { useState } from "react";
import { Designer, Rect, Path } from "./react-designer";
import { AgentWasm } from "./agent";
import { NeographyPreviewer } from "./components/neography-preview.component";

export default function App({ agent }: { agent: AgentWasm }) {
  const [objects, setObjects] = useState([]);

  return (
    <>
      <Designer objects={objects} width={250} height={350}
        objectTypes={{
          'rect': Rect,
          'path': Path
        }}
        onUpdate={(objects: any) => setObjects(objects)}
      ></Designer>
      <NeographyPreviewer agent={agent} />
    </>
  )
}