import fs from "fs";
import path from "path";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  createdAt: string;
}

// In-memory list as an extra safety fallback
let inMemoryUsers: User[] = [
  {
    id: "user-1",
    name: "عميل بوكيلا التجريبي",
    email: "bookella@demo.com",
    password: "password123",
    createdAt: new Date().toISOString()
  }
];

const getDbPath = () => {
  // Use a writeable location like /tmp or inside the workspace src
  const dir = path.join(process.cwd(), "src", "data");
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
  return path.join(dir, "users.json");
};

export function getUsers(): User[] {
  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      return JSON.parse(data);
    } else {
      // Initialize with demo user
      saveUsers(inMemoryUsers);
      return inMemoryUsers;
    }
  } catch (error) {
    console.error("Failed to read user DB:", error);
    return inMemoryUsers;
  }
}

export function saveUsers(users: User[]) {
  try {
    const dbPath = getDbPath();
    fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), "utf-8");
    inMemoryUsers = users;
  } catch (error) {
    console.error("Failed to write to user DB, falling back to in-memory:", error);
    inMemoryUsers = users;
  }
}

export function addUser(user: Omit<User, "id" | "createdAt">): User {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: `usr-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}
