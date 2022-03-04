// @ts-nocheck
import uniqueId from "lodash.uniqueid";

type Block = {
  id: string;
  type: string;
  title: string;
  description: string;
  entry: string;
  extensions?: string[];
};

interface BundleCode {
  name: string;
  content: string;
}
export const bundleCodesandboxFiles = ({
  block,
  bundleCode,
  context,
  id,
  contents,
  tree,
  metadata,
}: {
  block: Block;
  bundleCode: BundleCode[];
  context: FileContext | FolderContext;
  id: string;
  contents?: string;
  tree?: FolderData["tree"];
  metadata?: any;
}) => {
  const fileName = (block.entry.split("/").pop() || "index.js")
    .replace(".ts", ".js")
    .replace(".jsx", ".js");
  const contentWithUpdatedNames = bundleCode.map(({ name, content }) => ({
    name: name.slice(block.id.length + 1),
    content,
  }));
  const scriptFile = contentWithUpdatedNames?.find((f) => f.name === fileName);
  const mainContent = scriptFile?.content || "";
  const otherFilesContent = contentWithUpdatedNames.filter(
    (f) => f.name !== fileName
  );

  const cssFiles = otherFilesContent.filter((f) => f.name.endsWith(".css"));
  const cssFilesString = cssFiles
    .map((f) => `<style>${f.content}</style>`)
    .join("\n");
  const otherFilesContentProcessed = [
    {
      name: "/public/index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Custom block</title>
</head>
<body>
<!-- this won't load if added to the head -->
<link href="https://unpkg.com/@primer/css@^16.0.0/dist/primer.css" rel="stylesheet" />
${cssFilesString}
<div id="root"></div>
</body>
</html>`,
    },
    ...otherFilesContent.filter((f) => !f.name.endsWith(".css")),
  ];

  let otherFiles = otherFilesContentProcessed.reduce(
    (acc, { name, content }) => {
      acc[name] = content;
      return acc;
    },
    {} as any
  );

  const injectedSource = `
  import React from "react";
  import ReactDOM from "react-dom";
  import ReactDOMServer from "react-dom/server";

  ${processBundle(mainContent)}
  const Block = BlockBundle.default;

  const onUpdateMetadata = (newMetadata) => {
    window.parent.postMessage({
      type: "update-metadata",
      id: "${id}",
      context: ${JSON.stringify(context)},
      metadata: newMetadata,
      path: ${JSON.stringify(context.path)},
      block: ${JSON.stringify(block)},
      currentMetadata: ${JSON.stringify(metadata)},
    }, "*")
  }

  const onNavigateToPath = (path) => {
    window.parent.postMessage({
      type: "navigate-to-path",
      id: "${id}",
      context: ${JSON.stringify(context)},
      path,
    }, "*")
  }

  export default function WrappedBlock() {

    const onRequestUpdateContent = (content) => {
      window.parent.postMessage({
        type: "update-file",
        id: "${id}",
        context: ${JSON.stringify(context)},
        content: content
      }, "*")
    }

    let uniqueId = 0
    const getUniqueId = () => {
      uniqueId++
      return uniqueId
    }

    const onRequestGitHubData = React.useCallback((requestType, config) => {
      // for responses to this specific request
      const requestId = "${uniqueId(
        "github-data--request--"
      )}--" + getUniqueId()
      window.parent.postMessage({
        type: "github-data--request",
        id: "${id}",
        context: ${JSON.stringify(context)},
        requestId,
        requestType,
        config,
      }, "*")

      return new Promise((resolve, reject) => {
        const onMessage = (event: MessageEvent) => {
          if (event.origin !== "${window.location.origin}") return;
          if (event.data.type !== "github-data--response") return
          if (event.data.id !== "${id}") return
          window.removeEventListener("message", onMessage)
          resolve(event.data.data)
        }
        window.addEventListener("message", onMessage)
        const maxDelay = 1000 * 60 * 5
        window.setTimeout(() => {
          window.removeEventListener("message", onMessage)
          reject(new Error("Timeout"))
        }, maxDelay)
      })
    }, [])

    return <Block
      context={${JSON.stringify(context)}}
      content={${JSON.stringify(contents)}}
      tree={${JSON.stringify(tree)}}
      metadata={${JSON.stringify(metadata)}}
      onUpdateMetadata={onUpdateMetadata}
      onNavigateToPath={onNavigateToPath}
      onRequestUpdateContent={onRequestUpdateContent}
      onRequestGitHubData={onRequestGitHubData}
    />
  }
`;

  return {
    ...otherFiles,
    "/App.js": injectedSource,
  };
};
const processBundle = (bundle: string) => {
  // remove imports from React. This might need tweaking
  bundle = bundle.replace(
    /(import)([\w\s\}\{,]{3,30}?)(from\s["']react["'])/g,
    ""
  );

  return bundle;
};
