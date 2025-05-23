const { createServer } = require("http");
const { Server } = require("socket.io");
const { Client } = require("ssh2");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const sshConnections = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("ssh:connect", async (config) => {
    const conn = new Client();

    conn
      .on("ready", () => {
        sshConnections.set(socket.id, conn);
        socket.emit("ssh:connected");
      })
      .on("error", (err) => {
        socket.emit("ssh:error", err.message);
      })
      .connect(config);
  });

  socket.on("ssh:command", async ({ command, stream }) => {
    const conn = sshConnections.get(socket.id);
    if (!conn) {
      socket.emit("ssh:error", "Not connected");
      return;
    }

    conn.exec(command, (err, streamObj) => {
      if (err) {
        socket.emit("ssh:error", err.message);
        return;
      }

      if (stream) {
        streamObj
          .on("data", (data) => {
            socket.emit("ssh:output", data.toString());
          })
          .stderr.on("data", (data) => {
            socket.emit("ssh:output", `[ERROR] ${data.toString()}`);
          });
      } else {
        let output = "";
        streamObj
          .on("close", () => {
            socket.emit("ssh:result", output);
          })
          .on("data", (data) => {
            output += data.toString();
          })
          .stderr.on("data", (data) => {
            output += `[ERROR] ${data.toString()}`;
          });
      }
    });
  });

  socket.on("disconnect", () => {
    const conn = sshConnections.get(socket.id);
    if (conn) {
      conn.end();
      sshConnections.delete(socket.id);
    }
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
