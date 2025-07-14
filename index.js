const cors = require('cors')
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dbConnection = require('./src/config/db');
const authRoutes = require('./src/routes/Authroutes');
const messageRoutes = require('./src/routes/messageRoutes');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors())
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/Uploads', express.static(__dirname + '/public/Uploads'));

dbConnection();

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  // Handle new message
  socket.on('new_message', (data) => {
    const { receiverId, message } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message_received', {
        message,
        senderId: data.senderId
      });
      console.log(`Message sent to ${receiverId}`);
    }
  });
});

// Make io available to routes
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

server.listen(port, () => {
  console.log(`Server running on port = ${port}`);
});
