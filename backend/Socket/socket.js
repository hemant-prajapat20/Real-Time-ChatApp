import { Server } from "socket.io";
import http from 'http';
import express from 'express';

const app = express();

const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin:['http://localhost:5173'],
        methods:["GET","POST"],
    }
});
const userSocketmap={};

export const getReciverSocketId=(reciverId)=>{
    return userSocketmap[reciverId];
};

  io.on('connection',(socket)=>{
    const userId=socket.handshake.query.userId;
    if(userId && userId!=="undefined") userSocketmap[userId]= socket.id;
    io.emit("getOnlineUsers",Object.keys(userSocketmap))

    socket.on('disconnect',()=>{
        delete userSocketmap[userId],
        io.emit('getOnlineUsers',Object.keys(userSocketmap))
    });


//typing.. or not...
    socket.on("typing", ({ receiverId }) => {
  socket.to(userSocketmap[receiverId]).emit("typing");
});

socket.on("stopTyping", ({ receiverId }) => {
  socket.to(userSocketmap[receiverId]).emit("stopTyping");
});
    });

 export {app,io,server}