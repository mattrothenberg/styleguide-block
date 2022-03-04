import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { FileBlockProps } from "@githubnext/utils";
import { useState } from "react";

const Editor = ({
  onChange,
  value,
}: {
  value: string;
  onChange: (code: string) => void;
}) => {
  return (
    <CodeEditor
      className="w-full h-full whitespace-nowrap editor"
      language="jsx"
      placeholder="Please enter JS code."
      style={{
        fontSize: 12,
        backgroundColor: "#f5f5f5",
        fontFamily:
          "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
      }}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
};

interface ComponentDefinition {
  title: string;
  code: string;
}

interface ComponentBlockProps {
  definition: ComponentDefinition;
  stylesheet: string;
  onChange: (definition: ComponentDefinition) => void;
  onDelete: () => void;
}

function ComponentBlock(props: ComponentBlockProps) {
  const { definition, stylesheet, onChange, onDelete } = props;

  const adjustedCode = `
    import "/style.css";export default function App () {
      return (
        <>
          ${definition.code}
        </>
      )
    }
  `;

  const handleEditorChange = (code: string) => {
    onChange({
      ...definition,
      code,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...definition,
      title: e.target.value,
    });
  };

  return (
    <div>
      <div className="mb-2">
        <div className="flex justify-between items-center">
          <input
            onChange={handleTitleChange}
            className="w-full text-lg"
            value={definition.title}
          />
          <button onClick={onDelete} className="btn btn-danger btn-sm">
            Delete
          </button>
        </div>
      </div>
      <SandpackProvider
        customSetup={{
          files: {
            "/style.css": stylesheet,
            "/App.js": {
              code: adjustedCode,
            },
          },
        }}
        template="react"
      >
        <SandpackLayout className="flex border divide-x">
          <div className="flex-1">
            <Editor value={definition.code} onChange={handleEditorChange} />
          </div>
          <div className="flex-1">
            <SandpackPreview
              showRefreshButton={false}
              showOpenInCodeSandbox={false}
            />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

export default function (props: FileBlockProps) {
  const { context, content, metadata, onUpdateMetadata } = props;
  const [components, setComponents] = useState<ComponentDefinition[]>(
    metadata?.components ?? []
  );

  const handleAddComponent = () => {
    setComponents((curr) => [
      ...curr,
      {
        title: "New Component",
        code: "<button className='btn'>I'm a lonely button</button>",
      },
    ]);
  };

  const handleChange = (component: ComponentDefinition, index: number) => {
    setComponents((curr) => curr.map((c, i) => (i === index ? component : c)));
  };

  const handleDelete = (index: number) => {
    setComponents((curr) => curr.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdateMetadata({ components });
  };

  return (
    <div className="mb-8">
      <div className="max-w-2xl mx-auto">
        <header className="border-b py-3">
          <div className="flex items-center justify-between">
            <h1 className="h2">Styleguide</h1>
            <div className="flex items-center justify-between gap-3">
              <button onClick={handleAddComponent} className="btn btn-outline">
                Add Component
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </header>
        <ul className="mt-6 space-y-8">
          {components.map((component, index) => (
            <li key={index}>
              <ComponentBlock
                stylesheet={content}
                onChange={(component) => handleChange(component, index)}
                onDelete={() => handleDelete(index)}
                definition={component}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
