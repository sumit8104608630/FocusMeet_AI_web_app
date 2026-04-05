import express from 'express';
import WebSocket from 'ws';
const app=express();
const socket=new WebSocket.Server({posrt:8000});

socket.on('connection',(ws)=>{
    console.log('client connected');
    
});





