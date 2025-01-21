import { useState } from "react"
import Designer from "./svg-designer/Designer";
import Circle from "./svg-designer/objects/Circle";
import Text from "./svg-designer/objects/Text";

export default function App() {
  const [objects, setObject] = useState([]);

  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!

      <Designer width={250} height={350}
        objectTypes={{
          'text': Text,
        }}
        onUpdate={(objects: any) => setObject(objects)}
        objects={objects} />
    </h1>
  )
}