require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const admin = require('firebase-admin');
const serviceAccountKey = JSON.parse(process.env.FIREBASE_CREDENTIALS);
const { getAuth } = require("firebase-admin/auth");
const { storage } = require("./cloudConfig.js");

const path = require("path");
const multer = require('multer');
const upload = multer({ storage });

const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const { error } = require('console');
const SupportQuery = require('./models/SupportQuery.js');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow requests from all origins
    methods: ["GET", "POST"],
  },
});

let PORT = process.env.PORT|| 5000;
const _dirname = path.resolve();
// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey)
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const dbUrl = process.env.MONGODB_URL;
async function main() {
  await mongoose.connect(dbUrl);
}
main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(cors());

// Helper Functions
const formatDataSend = (user) => {
  const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY);
  return {
    isRestricted:user.isRestricted,
    role:user.personal_info.role,
    id:user._id,
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
    bio:user.personal_info.bio
  };
};

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ "error": "Access denied" });
  }

  jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, decoded) => {
    if (err) {
    
      return res.status(403).json({ "error": "Invalid or expired token" });
    }
    req.user = decoded;
   
    next();
  });
};

// Admin Middleware
const verifyAdmin = async(req, res, next) => {

  const user = await User.findOne({ "_id": req.user.id });

  if (!user || user.personal_info.role !== 'admin') {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }
  next();
};


// PUT /api/users/:id
app.put('/api/users/:id', verifyToken, async (req, res) => {
  console.log("Request received for user update");

  const { fullname, username, bio } = req.body;
  const { id } = req.params;

  try {
    // Update nested fields inside `personal_info`
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          "personal_info.fullname": fullname,
          "personal_info.username": username,
          "personal_info.bio": bio
        }
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("User updated successfully");
    res.status(200).json({
      id: updatedUser._id,
      fullname: updatedUser.personal_info.fullname,
      username: updatedUser.personal_info.username,
      bio: updatedUser.personal_info.bio,
      profile_img: updatedUser.personal_info.profile_img,
      role: updatedUser.personal_info.role,
      isRestricted: updatedUser.isRestricted
    });
  } catch (err) {
    console.error("Error while updating user:", err);
    res.status(500).json({ message: 'Error updating user' });
  }
});




app.delete('/api/support/:id', async (req, res) => {
  try {
    console.log("loggging");
    await SupportQuery.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Query deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting query' });
  }
});


// GET all queries (admin use only)
app.get('/api/support', async (req, res) => {
  try {
    const queries = await SupportQuery.find().sort({ submittedAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/support', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newQuery = new SupportQuery({ name, email, message });
    console.log(newQuery)
    await newQuery.save();
    res.status(201).json({ success: true, message: 'Query submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Try again later.' });
  }
});

app.get("/api/admin/users", verifyToken, verifyAdmin, async (req, res) => {
 
  try {
    const users = await User.find() // Optionally exclude password
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// Update User Role (Admin only)
app.put("/api/admin/users/:userId", verifyToken, verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { fullname, email, username, bio, role } = req.body.personal_info;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        personal_info: { fullname, email, username, bio, role },
        isRestricted:req.body.isRestricted,
      },
      { new: true } // Returns the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});



app.patch('/api/admin/users/:userId/restrict', verifyToken, verifyAdmin, async (req, res) => {

  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isRestricted = !user.isRestricted; // Toggle the restriction status
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to restrict user' });
  }
});


app.post('/api/admin/users/import', verifyToken, verifyAdmin, async (req, res) => {
  const users = req.body; // Array of users with personal_info including password

  try {
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => {
        if (!user.personal_info || !user.personal_info.password) {
          throw new Error('Password missing for user: ' + (user.personal_info?.email || 'unknown'));
        }

        const hashedPassword = await bcrypt.hash(user.personal_info.password, 10);

        return {
          ...user,
          personal_info: {
            ...user.personal_info,
            password: hashedPassword,
          },
        };
      })
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    res.status(201).json(createdUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to import users', error: err.message });
  }
});

// Create Admin User (Admin only)
// Create Admin User (Admin only)
app.post("/api/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  const { fullname, email, username, bio, role, password } = req.body.personal_info;

  try {
    // 1. Validate if password exists
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // saltRounds = 10

    // 3. Create new user with hashed password
    const newUser = new User({
      personal_info: {
        fullname,
        email,
        username,
        bio,
        role,
        password: hashedPassword, // Add hashed password
      },
      isRestricted: req.body.isRestricted,
    });

    // 4. Save to DB
    await newUser.save();

    // 5. Send response (you may choose to omit password in response)
    const userToReturn = newUser.toObject();
    delete userToReturn.personal_info.password; // Avoid sending password in response
    res.status(201).json(userToReturn);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add user" });
  }
});

app.delete('/api/admin/users/:userId', verifyToken, verifyAdmin, async (req, res) => {

  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(204).end(); // No content to return after deletion
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});
// Routes

// Fetch all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Fetch a user by ID
app.get("/api/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Fetch messages between two users
app.get('/chat/:receiverId', verifyToken, async (req, res) => {
  try {
    const { receiverId } = req.params;
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId },
      ]
    });

    res.status(200).json({ messages });
  } catch (err) {
    console.error('Error in fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message
app.post('/chat/send', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { message, receiverId } = req.body;
    const senderId = req.user.id;

    if (!message && !req.file) {
      return res.status(400).json({ error: 'Message or file must be provided.' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message || null,
      file: req.file
        ? { filename: req.file.originalname, url: req.file.path, type: req.file.mimetype }
        : null,
    });

    await newMessage.save();

    // Emit new message event
 
    io.emit('receive_message', {newMessage,receiverId});

    res.status(200).json({ message: newMessage });
  } catch (err) {
    console.error('Error in sending message:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Signup Route
app.post("/signup", async (req, res) => {
  const { fullname, email, password } = req.body;

  if (fullname.length < 3) {
    return res.status(400).json({ "error": "Fullname must be at least 3 letters long" });
  }
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ "error": "Please enter a valid email" });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ "error": "Invalid password format" });
  }

  try {
    const existingUser = await User.findOne({ "personal_info.email": email });
    if (existingUser) {
      return res.status(400).json({ "error": "Email already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const username = email.split("@")[0];

    const newUser = new User({
      personal_info: { fullname, email, password: hashedPass, username },
    });

    const savedUser = await newUser.save();
    res.status(200).json(formatDataSend(savedUser));
  } catch (err) {
    res.status(500).json({ "error": err.message });
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 2. Find user by email
    const user = await User.findOne({ "personal_info.email": email });
    if (!user) {
      return res.status(403).json({ error: "Email not found" });
    }

    // 3. Ensure user has a password field
    if (!user.personal_info.password) {
      return res.status(500).json({ error: "User account has no password set" });
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.personal_info.password);
    if (!isMatch) {
      return res.status(403).json({ error: "Incorrect password" });
    }

    // 5. Send successful login response
    res.status(200).json(formatDataSend(user));

  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Internal server error during sign-in" });
  }
});

// Google Auth Route
app.post("/google-auth", async (req, res) => {
  
  console.log("hiting here ->")
  const { access_token } = req.body;
   console.log("--->>>",access_token);
  try {
    console.log("-- inside decoded ->")
    const decodedUser = await getAuth().verifyIdToken(access_token);
    console.log(decodedUser);

    let { email, name, picture } = decodedUser;
    let user = await User.findOne({ "personal_info.email": email });

    if (!user) {
      const username = email.split("@")[0];
      user = new User({
        personal_info: { fullname: name, email, profile_img: picture, username },
        google_auth: true,
      });
      await user.save();
    }
    res.status(200).json(formatDataSend(user));
  } catch (error){
    console.log("error ->",error);
    console.log("error messafe")
    res.status(500).json({ "error": "Failed to authenticate" });
  }
});

// Socket.IO Real-Time Communication
io.on('connection', (socket) => {
   
  // Join a chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  // Send a message
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data.message);
  });

  socket.on('disconnect', () => {
   
  });
});

app.use(express.static(path.join(_dirname,"/my-app/build")))
app.get('*',(req,res)=>
{
  res.sendFile(path.resolve(_dirname,"my-app","build","index.html"))
})

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
