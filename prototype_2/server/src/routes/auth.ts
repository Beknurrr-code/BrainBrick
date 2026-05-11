import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, "../../data/users.json");

export const authRouter = Router();

const getUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
};

const saveUsers = (users: any[]) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

authRouter.post("/register", (req, res) => {
  try {
    const { username, password, email } = req.body;
    console.log(`[AUTH] Registration attempt: username="${username}", email="${email}"`);
    
    if (!username || !password) {
      console.warn("[AUTH] Registration failed: Missing credentials");
      res.status(400).json({ success: false, error: "Username and password required" });
      return;
    }

    const users = getUsers();
    if (users.find((u: any) => u.username === username || (email && u.email === email))) {
      res.status(400).json({ success: false, error: "User or Email already exists" });
      return;
    }

    users.push({ 
      username, 
      password,
      email: email || "",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bio: "New BrainBricks Pilot",
      xp: 0,
      level: 1,
      bricks: 500,
      showcase: [],
      aiTier: "standard"
    });
    saveUsers(users);
    
    const secret = process.env.JWT_SECRET || "brainbricks-secret-2024";
    const token = Buffer.from(username + ":" + Date.now() + ":" + secret).toString('base64');
    res.json({ success: true, token, user: { username, email } });
  } catch (err: any) {
    console.error("[Auth Register Error]:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

authRouter.post("/login", (req, res) => {
  const { username, password } = req.body; // 'username' here can be email or username from the form
  console.log(`[AUTH] Login attempt: login="${username}"`);
  const users = getUsers();
  
  // Search by username OR email
  const user = users.find((u: any) => 
    (u.username === username || (u.email && u.email === username)) && 
    u.password === password
  );
  
  if (!user) {
    console.warn(`[AUTH] Login failed for: "${username}"`);
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }
  
  const secret = process.env.JWT_SECRET || "brainbricks-secret-2024";
  const token = Buffer.from(user.username + ":" + Date.now() + ":" + secret).toString('base64');
  res.json({ success: true, token, user: { username: user.username, email: user.email } });
});

authRouter.post("/verify", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const [username] = decoded.split(":");
    const users = getUsers();
    const user = users.find((u: any) => u.username === username);
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid token" });
      return;
    }
    res.json({ success: true, user: { username: user.username, email: user.email } });
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
});

authRouter.get("/profile/:username", (req, res) => {
  const users = getUsers();
  const user = users.find((u: any) => u.username === req.params.username || (u.email && u.email === req.params.username));
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  
  const { password, ...publicProfile } = user;
  res.json({ success: true, user: publicProfile });
});

authRouter.post("/profile/update", (req, res) => {
  const { username, bio, avatar } = req.body;
  const users = getUsers();
  const index = users.findIndex((u: any) => u.username === username);
  if (index === -1) return res.status(404).json({ success: false, error: "User not found" });
  
  users[index] = { ...users[index], bio: bio || users[index].bio, avatar: avatar || users[index].avatar };
  saveUsers(users);
  res.json({ success: true, user: users[index] });
});

authRouter.post("/bricks/reward", (req, res) => {
  const { username, amount } = req.body;
  const users = getUsers();
  const index = users.findIndex((u: any) => u.username === username);
  if (index === -1) return res.status(404).json({ success: false, error: "User not found" });
  
  users[index].bricks += (amount || 0);
  users[index].xp += Math.floor((amount || 0) / 2);
  saveUsers(users);
  res.json({ success: true, bricks: users[index].bricks, xp: users[index].xp });
});
