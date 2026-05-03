import express from "express" 
import http from "http" 
import cookieParser from "cookie-parser" 
import { Server } from "socket.io" 
import cors from "cors" 
import { initRoutes } from '../routes/index.js';
import redisClient from '../databases_config/redis.config.js';
import { Meeting } from '../models/meeting.model.js';

const app = express(); 
app.set("trust proxy", 1); 
const server = http.createServer(app) 
const origin = process.env.FRONTEND_URL || "http://localhost:5173";
 
export const io = new Server(server, { 
    cors: { 
        origin: origin, 
        methods: ["GET", "POST"], 
        credentials: true 
    } 
}) 
 
const userSocketMap = {}  // { userId: socketId } 
const groupSocketMap = {} // { groupId: [socketIds] } 
const activeCalls = {}    // { socketId: targetUserId } 
const roomParticipants = new Map(); // Fallback meetingId -> Array of { userId, socketId }
let active = [] 

// Helper to get participants (Redis with Memory Fallback)
async function getParticipants(meetingId) {
    if (redisClient.isOpen) {
        try {
            const redisKey = `meeting:${meetingId}`;
            const allParticipantsData = await redisClient.hGetAll(redisKey);
            return Object.values(allParticipantsData).map(p => JSON.parse(p));
        } catch (err) {
            console.error('Redis getParticipants error:', err);
        }
    }
    return roomParticipants.get(meetingId) || [];
}

// Helper to add participant
async function addParticipant(meetingId, participant) {
    if (redisClient.isOpen) {
        try {
            const redisKey = `meeting:${meetingId}`;
            
            // 1. Remove any existing entries for this USER ID to prevent duplicates on refresh
            const allData = await redisClient.hGetAll(redisKey);
            for (const [sId, data] of Object.entries(allData)) {
                const p = JSON.parse(data);
                if (p.userId === participant.userId) {
                    await redisClient.hDel(redisKey, sId);
                }
            }

            // 2. Add the new socket entry
            await redisClient.hSet(redisKey, participant.socketId, JSON.stringify(participant));
            await redisClient.expire(redisKey, 86400);
            return;
        } catch (err) {
            console.error('Redis addParticipant error:', err);
        }
    }
    // Memory fallback
    if (!roomParticipants.has(meetingId)) roomParticipants.set(meetingId, []);
    const participants = roomParticipants.get(meetingId);
    
    // Remove existing entry for same userId
    const filtered = participants.filter(p => p.userId !== participant.userId);
    filtered.push(participant);
    roomParticipants.set(meetingId, filtered);
}

// Helper to remove participant
async function removeParticipant(meetingId, socketId) {
    if (redisClient.isOpen) {
        try {
            const redisKey = `meeting:${meetingId}`;
            await redisClient.hDel(redisKey, socketId);
        } catch (err) {
            console.error('Redis removeParticipant error:', err);
        }
    }
    // Memory fallback
    if (roomParticipants.has(meetingId)) {
        const participants = roomParticipants.get(meetingId).filter(p => p.socketId !== socketId);
        roomParticipants.set(meetingId, participants);
    }
}

// Helper to get socket ID from user ID
export function getOnlineUserIds(userId) { 
    return userSocketMap[userId]; 
} 
 
io.on("connection", (socket) => { 
 
    const userId      = socket.handshake.query.userId; 
    const authUserId  = socket.handshake.query.authUserId; 
    const selectedId  = socket.handshake.query.selected_id; 
    const userName    = socket.handshake.query.userName; 

    if (userId) { 
        userSocketMap[userId] = socket.id; 
    } 
 
    if (selectedId && authUserId) { 
        active.push({ authUserId, selectedId }); 
    } 
 
    io.emit("onlineUser", Object.keys(userSocketMap)); 
    io.emit("getActiveUser", active); 
 
    // ── Block / Unblock ─────────────────────────────────────────────────────── 
    socket.on("block", ({ to, from }) => { 
        const targetId = userSocketMap[to]; 
        io.to(targetId).emit("blocked", { to, from }); 
    }); 

    socket.on("unBlock", ({ to, from }) => { 
        const targetId = userSocketMap[to]; 
        io.to(targetId).emit("unBlocked", { to, from }); 
    }); 

    // ── Active user management ──────────────────────────────────────────────── 
    socket.on("delete_active_user", ({ authUserId, selectedId }) => { 
        active = active.filter(pair => !(pair.authUserId === authUserId && pair.selectedId === selectedId)); 
        io.emit("getActiveUser", active); 
    }); 

    socket.on("delete_authUserMatchId", (userId) => { 
        active = active.filter(pair => pair.authUserId !== userId); 
        io.emit("getActiveUser", active); 
    }); 

    socket.on("lastScene", (userId) => { 
        active = active.filter(pair => pair.authUserId !== userId); 
        io.emit("new_Date", { userId, newDate: Date.now() }); 
        io.emit("getActiveUser", active); 
    }); 

    // ── meeting rooms ───────────────────────────────────────────────────────── 
    socket.on('join-meeting', async ({ meetingId, userId, name }) => {
        socket.join(meetingId);
        const participant = { userId, socketId: socket.id, name: name || userName || 'Guest' };
        console.log(`User ${userId} (socket: ${socket.id}) joined meeting: ${meetingId}`);
        
        try {
            let meeting = await Meeting.findOne({ meetingId, status: 'ongoing' });
            if (!meeting) {
                const existingEndedMeeting = await Meeting.findOne({ meetingId, status: 'ended' });
                if (existingEndedMeeting) {
                    socket.emit('error', { message: 'This meeting has already ended.' });
                    return;
                }
                meeting = await Meeting.create({ meetingId, host: userId, members_info: [participant], status: 'ongoing' });
            } else {
                const isAlreadyMember = meeting.members_info.some(m => m.socketId === socket.id);
                if (!isAlreadyMember) {
                    meeting.members_info.push(participant);
                    await meeting.save();
                }
            }
            if (redisClient.isOpen) {
                await redisClient.set(`user_active_meeting:${userId}`, meetingId, { EX: 86400 });
            }
        } catch (err) {
            console.error('Join meeting error:', err);
        }

        await addParticipant(meetingId, participant);
        const participants = await getParticipants(meetingId);
        socket.to(meetingId).emit('user-joined', { userId, socketId: socket.id, name: participant.name });
        io.to(meetingId).emit('room-users', { meetingId, users: participants });
    });

    socket.on('offer', ({ offer, to, from }) => {
        // If 'to' is a userId, find socketId; if not found or 'to' is already a socketId, use 'to'
        const targetSocketId = userSocketMap[to] || to;
        console.log(`Relaying offer from ${socket.id} to ${targetSocketId} (target userId: ${to})`);
        if (targetSocketId) {
            io.to(targetSocketId).emit('offer', { offer, from, fromSocket: socket.id });
        }
    });

    socket.on('answer', ({ answer, to, from }) => {
        const targetSocketId = userSocketMap[to] || to;
        console.log(`Relaying answer from ${socket.id} to ${targetSocketId} (target userId: ${to})`);
        if (targetSocketId) {
            io.to(targetSocketId).emit('answer', { answer, from, fromSocket: socket.id });
        }
    });

    socket.on("ice-candidate", ({ candidate, to }) => { 
        const targetSocket = userSocketMap[to] || to; 
        console.log(`Relaying ice-candidate from ${socket.id} to ${targetSocket} (target userId: ${to})`);
        if (targetSocket) {
            io.to(targetSocket).emit("ice-candidate", { candidate, from: userId, fromSocket: socket.id }); 
        }
    }); 

    socket.on("call-ended", async ({ to, meetingId }) => { 
        console.log(`Call ended by ${userId} (socket: ${socket.id}) in meeting ${meetingId}`);
        if (meetingId) {
            try {
                const meeting = await Meeting.findOne({ meetingId, status: 'ongoing' });
                if (meeting) {
                    if (String(meeting.host) === String(userId)) {
                        meeting.status = 'ended';
                        await meeting.save();
                        io.to(meetingId).emit('meeting-ended');
                        const redisKey = `meeting:${meetingId}`;
                        const allParticipantsData = await redisClient.hGetAll(redisKey);
                        const participants = Object.values(allParticipantsData).map(p => JSON.parse(p));
                        for (const p of participants) await redisClient.del(`user_active_meeting:${p.userId}`);
                        await redisClient.del(redisKey);
                    } else {
                        meeting.members_info = meeting.members_info.filter(m => m.socketId !== socket.id);
                        await meeting.save();
                        if (redisClient.isOpen) await redisClient.del(`user_active_meeting:${userId}`);
                    }
                }
            } catch (err) { console.error('Call ended error:', err); }
            await removeParticipant(meetingId, socket.id);
            const participants = await getParticipants(meetingId);
            io.to(meetingId).emit('user-left', { userId, socketId: socket.id, name: userName });
            io.to(meetingId).emit('room-users', { meetingId, users: participants });
        }
        
        if (to) {
            const targetSocket = userSocketMap[to] || to; 
            if (targetSocket) io.to(targetSocket).emit("call-ended", { from: userId, fromSocket: socket.id }); 
        }
        delete activeCalls[socket.id]; 
    }); 

    socket.on("call-user", ({ to, from, signal, callType }) => { 
        const targetSocket = userSocketMap[to] || to; 
        if (!targetSocket) return socket.emit("user-unavailable", { to }); 
        activeCalls[socket.id] = to; 
        io.to(targetSocket).emit("incoming-call", { from, signal, to, callType }); 
    }); 
 
    socket.on("call-accepted", ({ to, signal }) => { 
        const targetSocket = userSocketMap[to?._id || to] || to?._id || to; 
        activeCalls[socket.id] = to?._id || to; 
        if (targetSocket) io.to(targetSocket).emit("accepted_answer", { signal }); 
    }); 
 
    socket.on("call-rejected", ({ to }) => { 
        const targetSocket = userSocketMap[to] || to; 
        delete activeCalls[socket.id]; 
        if (targetSocket) io.to(targetSocket).emit("call-rejected"); 
    }); 

    socket.on("disconnect", async () => { 
        console.log(`User ${userId} disconnected (socket: ${socket.id})`);
        
        if (activeCalls[socket.id]) { 
            delete activeCalls[socket.id]; 
        } 

        // Cleanup meetings
        try {
            // Memory fallback cleanup
            roomParticipants.forEach(async (participants, meetingId) => {
                const index = participants.findIndex(p => p.socketId === socket.id);
                if (index !== -1) {
                    participants.splice(index, 1);
                    const updatedParticipants = await getParticipants(meetingId);
                    console.log(`Memory cleanup for socket ${socket.id} from meeting ${meetingId}`);
                    io.to(meetingId).emit('user-left', { userId, socketId: socket.id, name: userName });
                    io.to(meetingId).emit('room-users', { meetingId, users: updatedParticipants });
                    
                    // Also update MongoDB
                    const meeting = await Meeting.findOne({ meetingId, status: 'ongoing' });
                    if (meeting) {
                        meeting.members_info = meeting.members_info.filter(m => m.socketId !== socket.id);
                        await meeting.save();
                    }
                }
            });

            // Redis cleanup
            if (redisClient.isOpen) {
                const keys = await redisClient.keys('meeting:*');
                for (const key of keys) {
                    if (await redisClient.hExists(key, socket.id)) {
                        await redisClient.hDel(key, socket.id);
                        const meetingId = key.split(':')[1];
                        const updatedParticipants = await getParticipants(meetingId);
                        console.log(`Redis cleanup for socket ${socket.id} from meeting ${meetingId}`);
                        io.to(meetingId).emit('user-left', { userId, socketId: socket.id, name: userName });
                        io.to(meetingId).emit('room-users', { meetingId, users: updatedParticipants });
                        
                        // Also update MongoDB
                        const meeting = await Meeting.findOne({ meetingId, status: 'ongoing' });
                        if (meeting) {
                            meeting.members_info = meeting.members_info.filter(m => m.socketId !== socket.id);
                            await meeting.save();
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Disconnect cleanup error:', err);
        }
 
        if (userId && userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId]; 
        }
        io.emit("onlineUser", Object.keys(userSocketMap)); 
    }); 
}); 
 
app.use(cors({ origin: origin, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"], exposedHeaders: ["set-cookie"] })); 
app.use(express.json({ limit: "1mb" })); 
app.use(express.urlencoded({ limit: "16kb", extended: true })); 
app.use(express.static("public")); 
app.use(cookieParser()); 
initRoutes(app);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
 
export default server;
