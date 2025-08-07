import express from "express";
import http from "http";
import { Server } from "socket.io";
import Action from "./src/pages/action.js"; // Use `import` to get the `Action` object
import dotenv from 'dotenv';
import cors from "cors";



const app = express();
app.use(cors());




const server = http.createServer(app);
const io = new Server(server);
dotenv.config();
const userSocketMap = {};

function getAllClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
    return {
      socketId,
      username: userSocketMap[socketId],
    };
  });
}

io.on("connection", (socket) => {
  console.log("socket.id", socket.id);
  socket.on(Action.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllClients(roomId);
     clients.forEach(({socketId})=>{
        io.to(socketId).emit(Action.JOINED,{
            clients,
            username,
            socketId:socket.id,
        });
     });
  });


  socket.on(Action.CODE_CHANGE,({roomId,code})=>{
    socket.in(roomId).emit(Action.CODE_CHANGE,{code});
  })


  socket.on(Action.SYNC_CODE,({socketId,code})=>{
   io.to(socketId).emit(Action.CODE_CHANGE,{code});
  });



socket.on('disconnecting',()=>{
    const rooms=[...socket.rooms];
    rooms.forEach((roomId)=>{
        socket.in(roomId).emit(Action.DISCONNECTED,{
            socketId:socket.id,
            username:userSocketMap[socket.id]
        });
    });
    delete userSocketMap[socket.id];
    socket.leave();

})


});
console.log(process.env.PORT);

server.listen(process.env.PORT, () => {
  console.log("server is live at port 3000");
});
