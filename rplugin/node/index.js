const WebSocket = require("ws");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

const wsPort = process.env.ORUI_WS_PORT || 35903;
const httpPort = process.env.ORUI_HTTP_PORT || 35901;
const WebSocketServer = WebSocket.Server;

let wss = null;
let wsarray = [];
let graphdata = { nodes: [], links: [], tags: [] };
let orgRoamConfig = null;
let count = 0;
let isStandalone = false;

let timeout;
let delay = 200;
function debounce(fn, delay) {
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, arguments), delay);
  };
}
const debouncedCallback = debounce((callback) => {
  callback();
}, delay);

function processGraphDataFromLua(data) {
  try {
    const nodes = [];
    const links = [];
    const tags = [];

    if (data.nodes) {
      data.nodes.forEach((node) => {
        nodes.push({
          id: node.id,
          file: node.file,
          title: node.title,
          level: node.level || 0,
          pos: node.pos || 0,
          properties: node.properties || {},
          tags: node.tags || [],
          olp: node.olp,
        });
      });
    }

    if (data.links) {
      data.links.forEach((link) => {
        links.push({
          source: link.source,
          target: link.target,
          type: link.type || "bad",
        });
      });
    }

    if (data.tags) {
      data.tags.forEach((tag) => {
        tags.push(tag);
      });
    }

    return { nodes, links, tags };
  } catch (err) {
    console.error("Error processing graph data:", err.message);
    return { nodes: [], links: [], tags: [] };
  }
}

function getNodeById(id) {
  try {
    return graphdata.nodes.find((node) => node.id === id);
  } catch (err) {
    return null;
  }
}

function updateGraphData() {
  wsarray.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "graphdata",
          data: {
            nodes: graphdata.nodes,
            links: graphdata.links,
            tags: graphdata.tags,
          },
        }),
      );
    }
  });
}

function initHttpServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  let outDir = __dirname + "/../../out";
  if (!fs.existsSync(outDir)) {
    outDir = process.cwd() + "/out";
  }
  
  if (fs.existsSync(outDir)) {
    app.use(express.static(outDir));
  }

  app.get("/", (req, res) => {
    if (fs.existsSync(outDir + "/index.html")) {
      res.sendFile(outDir + "/index.html");
    } else {
      res.send("org-roam-ui frontend not found. Run 'npm run build' first.");
    }
  });

  app.get("/node/:id", (req, res) => {
    const id = req.params.id;
    const node = getNodeById(id);
    if (node && node.file) {
      try {
        const fileContent = fs.readFileSync(node.file, "utf8");
        res.send(fileContent);
      } catch (err) {
        res.status(404).send("File not found");
      }
    } else {
      res.status(404).send("Node not found");
    }
  });

  app.get("/img/:filePath", (req, res) => {
    const filePath = decodeURIComponent(decodeURIComponent(req.params.filePath));
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(err.status || 500).end();
      }
    });
  });

  app.post("/graphdata", (req, res) => {
    try {
      const data = req.body;
      sendGraphData(data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const server = app.listen(httpPort, () => {
    console.log(`HTTP server listening on port ${httpPort}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${httpPort} is already in use. Trying to kill existing process...`);
      const { exec } = require("child_process");
      exec(`fuser -k ${httpPort}/tcp`, () => {
        setTimeout(() => {
          server.listen(httpPort, () => {
            console.log(`HTTP server listening on port ${httpPort} (after retry)`);
          });
        }, 1000);
      });
    } else {
      console.error("Server error:", err);
    }
  });
}

function initWebSocketServer() {
  wss = new WebSocketServer({
    port: wsPort,
  });

  wss.on("connection", function (ws) {
    console.log("Client connected");
    wsarray.push(ws);
    if (isStandalone) {
      updateGraphData();
    }
  });

  wss.on("error", function (err) {
    console.error("WebSocket error:", err.message);
  });

  wss.on("close", function () {
    console.log("Client disconnected");
  });
}

function init(config) {
  orgRoamConfig = config;
  initHttpServer();
  initWebSocketServer();
  console.log(`org-roam-ui server started (HTTP: ${httpPort}, WS: ${wsPort})`);
}

function sendGraphData(data) {
  const processed = processGraphDataFromLua(data);
  graphdata = processed;
  updateGraphData();
}

function handleStdin() {
  if (isStandalone && process.stdin) {
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.trim()) {
          try {
            const msg = JSON.parse(line);
            if (msg.type === "graphdata") {
              sendGraphData(msg.data);
            } else if (msg.type === "init") {
              init(msg.config);
            }
          } catch (err) {
            console.error("Error parsing stdin message:", err.message);
          }
        }
      }
    });
    process.stdin.on("end", () => {
      console.log("stdin closed");
    });
  }
}

if (require.main === module) {
  isStandalone = true;
  init();
  handleStdin();
}

module.exports = {
  init: init,
  sendGraphData: sendGraphData,
};
