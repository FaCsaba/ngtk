import { useState } from "react";
import { Designer, Text, Rect } from "./react-designer";

export default function App() {
  const [objects, setObjects] = useState([]);

  return (
    <Designer objects={objects} width={250} height={350}
      objectTypes={{
        'text': Text,
        'rect': Rect,
      }}
      onUpdate={(objects: any) => setObjects(objects)}
    ></Designer>
  )
}