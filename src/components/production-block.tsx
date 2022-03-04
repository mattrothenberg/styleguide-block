import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import uniqueId from "lodash.uniqueid";
import { bundleCodesandboxFiles } from "../lib";

type Block = {
  id: string;
  type: string;
  title: string;
  description: string;
  entry: string;
  extensions?: string[];
};
interface ProductionBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext;
}
interface BundleCode {
  name: string;
  content: string;
}
export const ProductionBlock = (props: ProductionBlockProps) => {
  const { block, contents, tree, metadata = {}, context } = props;

  const [bundleCode, setBundleCode] = useState<BundleCode[]>([]);
  const sandpackWrapper = useRef<HTMLDivElement>(null);
  const id = useRef(uniqueId("sandboxed-block-"));

  const getContents = async () => {
    // const allContent = await import.meta.glob(`../blocks/styleguide-block/*`);
    // const jsKey = Object.keys(allContent)[1];
    // console.log(typeof allContent[jsKey]);
    // const res = await allContent[jsKey]();
    // console.log(res.default);

    const raw = await import("../blocks/styleguide-block/index.tsx?raw");

    // const relevantPaths = Object.keys(allContent).filter((d: string) =>
    //   d.startsWith(`./../../dist/${block.id}`)
    // );
    // let relevantContent = [];
    // for (const path of relevantPaths) {
    //   const importType = path.endsWith(".css") ? "inline" : "raw";
    //   const content = await import(
    //     /* @vite-ignore */ `${path}?${importType}`
    //   ).then((d) => d.default);
    //   relevantContent.push({
    //     name: path.slice(13),
    //     content,
    //   });
    // }
    setBundleCode([
      {
        name: "block.tsx",
        content: raw.default,
      },
    ]);
  };

  useEffect(() => {
    getContents();
  }, [block.entry]);

  if (!bundleCode.length) {
    return <div>No bundle found</div>;
  }

  const files = bundleCodesandboxFiles({
    block,
    bundleCode,
    context,
    id: id.current,
    contents,
    tree,
    metadata,
  });

  if (!bundleCode) return null;

  const stubBlockParent = `
    import Block from "/block.tsx";
    console.log(Block);

    export default function App () {
      const props = {
        content: "* {background: red;}",
        context: {
          owner: "mattrothenberg",
          org: "paisjdpoasijdpiosadj"
        }
      };

      return (
        <Block {...props} />
      )
    }
  
  `;

  return (
    <div
      ref={sandpackWrapper}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <SandpackProvider
        externalResources={["https://cdn.tailwindcss.com"]}
        template="react-ts"
        customSetup={{
          dependencies: {
            "@codesandbox/sandpack-react": "latest",
            "@uiw/react-textarea-code-editor": "latest",
          },
          files: {
            "/block.tsx": bundleCode[0].content,
            "/App.tsx": stubBlockParent,
          },
        }}
        autorun
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
        />
      </SandpackProvider>
    </div>
  );
};
