import "dotenv/config";
import express from "express";

import {fileURLToPath} from "url";
import path from "path";
import http from "http";
import {setupSocket} from "./socket/socket.js";

const app = express();
const httpServer = http.createServer(app);
const Port = Number(process.env.PORT) || 3000;

const __filename = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__filename, "public")));

setupSocket(httpServer);

httpServer.listen(Port, "0.0.0.0", () => {
    console.log(`Server is running on port ${Port}`);
})
