import { readDB, writeDB } from "../db.js";

export interface FeedPost {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
}

export async function getFeed(): Promise<FeedPost[]> {
  return await readDB('feed.json');
}

export async function addFeedEvent(user: string, action: string, target: string): Promise<void> {
  const feed = await getFeed();
  feed.unshift({
    id: Math.random().toString(36).slice(2),
    user,
    action,
    target,
    timestamp: new Date().toISOString()
  });
  await writeDB('feed.json', feed.slice(0, 50)); // Keep last 50
}

export async function getMessages(user1: string, user2: string): Promise<Message[]> {
  const all = await readDB('messages.json');
  return all.filter((m: Message) => 
    (m.from === user1 && m.to === user2) || (m.from === user2 && m.to === user1)
  );
}

export async function sendMessage(from: string, to: string, text: string): Promise<Message> {
  const all = await readDB('messages.json');
  const msg: Message = {
    id: Math.random().toString(36).slice(2),
    from,
    to,
    text,
    timestamp: new Date().toISOString()
  };
  all.push(msg);
  await writeDB('messages.json', all);
  return msg;
}

export async function getContacts(username: string): Promise<any[]> {
  const all = await readDB('messages.json');
  const users = new Set<string>();
  all.forEach((m: Message) => {
    if (m.from === username) users.add(m.to);
    if (m.to === username) users.add(m.from);
  });
  
  // Mock profile data for contacts
  return Array.from(users).map(u => ({
    username: u,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u}`,
    bio: "BrainBricks Pilot"
  }));
}
