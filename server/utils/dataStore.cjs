"use strict";

const fs = require("node:fs");
const path = require("node:path");

const STORE_PATH = path.resolve(__dirname, "../data/store.json");

const ensureStore = () => {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ users: {} }, null, 2), "utf8");
  }
};

const readStore = () => {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf8");
  return JSON.parse(raw || "{}");
};

const writeStore = (data) => {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const getUser = (email) => {
  const data = readStore();
  const normalized = normalizeEmail(email);
  return data.users?.[normalized] ?? null;
};

const createUser = ({ email, password, nickname }) => {
  const data = readStore();
  const normalized = normalizeEmail(email);
  if (!data.users) {
    data.users = {};
  }
  if (data.users[normalized]) {
    return null;
  }
  const timestamp = new Date().toISOString();
  const user = {
    email: email.trim(),
    nickname,
    password,
    playbackHistory: [],
    favorites: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  data.users[normalized] = user;
  writeStore(data);
  return user;
};

const verifyCredentials = ({ email, password }) => {
  const user = getUser(email);
  if (!user) {
    return false;
  }
  return user.password === password;
};

const updateUser = (email, updater) => {
  const data = readStore();
  const normalized = normalizeEmail(email);
  const user = data.users?.[normalized];
  if (!user) {
    return null;
  }
  const nextUser = updater({ ...user });
  const updatedUser = { ...user, ...nextUser, updatedAt: new Date().toISOString() };
  data.users[normalized] = updatedUser;
  writeStore(data);
  return updatedUser;
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  verifyCredentials,
};
