function parse(fileContent) {
    const orientations = {
        "top_bottom": "TB",
        "bottom_top": "BT",
        "left_right": "LR",
        "right_left": "RL",
    };

    let graphType = null;
    let graphOrientation = null;
    
    const nodes = [];
    const arrows = [];
    const subgraphs = [];
    
    let currentSubgraph = null;

    const lines = fileContent.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith("#")) {
            continue;
        }

        let lhs, rhs;
        if (line.includes(":")) {
            const parts = line.split(":");
            lhs = parts[0].trim();
            rhs = parts.slice(1).join(":").trim();
        } else {
            lhs = line;
            rhs = null;
        }

        const lhsWords = lhs.split(/\s+/);
        if (lhsWords.length === 0 || !lhsWords[0]) continue;
        
        const keyword = lhsWords[0];

        if (keyword === "Flowchart") {
            graphType = keyword;
            if (orientations[rhs]) {
                graphOrientation = orientations[rhs];
            } else {
                const err = new Error(`Invalid ${keyword} orientation '${rhs}'. Valid options are: top_down, down_top, left_right, right_left.`);
                err.line = i + 1;
                throw err;
            }
        } else if (graphType && keyword === "Subgraph") {
            const rest = line.substring("Subgraph".length).trim();
            currentSubgraph = {
                id_and_name: rest,
                nodes: []
            };
            subgraphs.push(currentSubgraph);
        } else if (graphType && keyword === "end") {
            currentSubgraph = null;
        } else if (graphType && keyword === "Node") {
            if (lhsWords.length < 3) {
                const err = new Error(`Node definition requires an id and a type. (e.g., 'Node start1 start: ...')`);
                err.line = i + 1;
                throw err;
            }
            const nodeId = lhsWords[1];
            const nodeType = lhsWords[2];
            const description = rhs;

            const validTypes = ["start", "end", "step", "decision", "rect", "db", "document"];
            if (!validTypes.includes(nodeType)) {
                const err = new Error(`Invalid Node type '${nodeType}'. Valid types: ${validTypes.join(', ')}`);
                err.line = i + 1;
                throw err;
            }

            const nodeDef = {
                id: nodeId,
                type: nodeType,
                desc: description
            };

            if (currentSubgraph) {
                currentSubgraph.nodes.push(nodeDef);
            } else {
                nodes.push(nodeDef);
            }
        } else if (graphType && keyword === "Arrow") {
            if (lhsWords.length < 2) {
                const err = new Error(`Arrow definition requires a type. (e.g., 'Arrow solid: ...')`);
                err.line = i + 1;
                throw err;
            }
            const arrowType = lhsWords[1];
            const validArrowTypes = ["solid", "dotted", "thick"];
            if (!validArrowTypes.includes(arrowType)) {
                const err = new Error(`Invalid Arrow type '${arrowType}'. Valid types: ${validArrowTypes.join(', ')}`);
                err.line = i + 1;
                throw err;
            }
            
            let label = null;
            if (lhs.includes('"')) {
                label = lhs.split('"')[1];
            }

            if (!rhs) {
                const err = new Error(`Arrow requires start and end nodes separated by a comma.`);
                err.line = i + 1;
                throw err;
            }
            const parts = rhs.split(",");
            if (parts.length < 2) {
                const err = new Error(`Arrow requires start and end nodes separated by a comma (e.g., 'start1, req1').`);
                err.line = i + 1;
                throw err;
            }
            const startId = parts[0].trim();
            const endId = parts[1].trim();

            arrows.push({
                type: arrowType,
                label: label,
                start: startId,
                end: endId
            });
        } else if (graphType) {
            const err = new Error(`Unknown keyword '${keyword}'. Expected 'Node', 'Arrow', 'Subgraph', or 'end'.`);
            err.line = i + 1;
            throw err;
        }
    }

    if (!graphType) {
        const err = new Error("No diagram layout defined. Please start with 'Flowchart: <orientation>'.");
        err.line = 1;
        throw err;
    }

    let mermaidCode = `---
config:
  flowchart:
    defaultRenderer: elk
  theme: base
  themeVariables:
    fontFamily: "KION Spezia, Aptos Display, sans-serif"
    primaryColor: "#ffffff"
    primaryBorderColor: "#6E0F4B"
    primaryTextColor: "#6E0F4B"
    lineColor: "#6E0F4B"
    textColor: "#6E0F4B"
    clusterBkg: "#f1e8ed"
    clusterBorder: "#6E0F4B"
---
`;
    mermaidCode += `flowchart ${graphOrientation}\n`;

    const defaultNodes = [];
    const decisionNodes = [];

    function generateNodeCode(node, indent) {
        const nodeId = node.id;
        const nodeType = node.type;
        const desc = `"${node.desc.replace(/"/g, '&quot;')}"`;
        
        let lineStr = "";
        if (nodeType === "start") {
            lineStr = `${indent}${nodeId}([${desc}])\n`;
            defaultNodes.push(nodeId);
        } else if (nodeType === "end") {
            lineStr = `${indent}${nodeId}(${desc})\n`;
            defaultNodes.push(nodeId);
        } else if (nodeType === "rect" || nodeType === "step") {
            lineStr = `${indent}${nodeId}[${desc}]\n`;
            defaultNodes.push(nodeId);
        } else if (nodeType === "decision") {
            lineStr = `${indent}${nodeId}{${desc}}\n`;
            decisionNodes.push(nodeId);
        } else if (nodeType === "db") {
            lineStr = `${indent}${nodeId}[(${desc})]\n`;
            defaultNodes.push(nodeId);
        } else if (nodeType === "document") {
            lineStr = `${indent}${nodeId}[/${desc}/]\n`;
            defaultNodes.push(nodeId);
        }
        return lineStr;
    }

    for (const node of nodes) {
        mermaidCode += generateNodeCode(node, "    ");
    }

    for (const sg of subgraphs) {
        mermaidCode += `    subgraph ${sg.id_and_name}\n`;
        for (const node of sg.nodes) {
            mermaidCode += generateNodeCode(node, "        ");
        }
        mermaidCode += "    end\n";
    }

    for (const arrow of arrows) {
        let arrowStr = "-->";
        if (arrow.type === "solid") {
            arrowStr = arrow.label ? `-- "${arrow.label}" -->` : "-->";
        } else if (arrow.type === "dotted") {
            arrowStr = arrow.label ? `-. "${arrow.label}" .->` : "-.->";
        } else if (arrow.type === "thick") {
            arrowStr = arrow.label ? `== "${arrow.label}" ==>` : "==>";
        }

        mermaidCode += `    ${arrow.start} ${arrowStr} ${arrow.end}\n`;
    }

    return mermaidCode;
}

if (typeof window !== 'undefined') {
    window.parseDDKL = parse;
}
