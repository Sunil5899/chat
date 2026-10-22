const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (socket) => {
    socket.room = null;
    socket.username = "User";

    socket.on("message", (raw) => {
        try {
            const data = JSON.parse(raw.toString());

            if (data.type === "join") {
                const room = String(data.room || "").trim();
                const username = String(data.username || "User").trim();

                if (!/^[a-zA-Z0-9_-]{3,40}$/.test(room)) return;
                if (!username || username.length > 30) return;

                socket.room = room;
                socket.username = username;

                socket.send(JSON.stringify({
                    type: "status",
                    text: "आप चैट रूम से जुड़ गए हैं।"
                }));
            }

            if (
                data.type === "chat" &&
                socket.room &&
                typeof data.text === "string"
            ) {
                const text = data.text.trim().slice(0, 2000);
                if (!text) return;

                const message = JSON.stringify({
                    type: "chat",
                    username: socket.username,
                    text: text,
                    time: new Date().toLocaleTimeString("hi-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Kolkata"
                    })
                });

                for (const client of wss.clients) {
                    if (
                        client.readyState === WebSocket.OPEN &&
                        client.room === socket.room
                    ) {
                        client.send(message);
                    }
                }
            }
        } catch (error) {
            console.log("Message error:", error.message);
        }
    });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("Chat server running on port " + PORT);
});