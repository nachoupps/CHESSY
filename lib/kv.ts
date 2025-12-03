import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const LOCAL_DB_PATH = path.join(process.cwd(), 'local_db.json');

// Mock KV client for local development without Vercel credentials
const localKv = {
    hgetall: async (key: string) => {
        try {
            if (!fs.existsSync(LOCAL_DB_PATH)) return null;
            const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
            return data[key] || null;
        } catch (e) {
            console.error('Local KV Read Error:', e);
            return null;
        }
    },
    hget: async (key: string, field: string) => {
        try {
            if (!fs.existsSync(LOCAL_DB_PATH)) return null;
            const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
            return data[key]?.[field] || null;
        } catch (e) {
            console.error('Local KV hget Error:', e);
            return null;
        }
    },
    hset: async (key: string, value: Record<string, any>) => {
        try {
            let data: Record<string, any> = {};
            if (fs.existsSync(LOCAL_DB_PATH)) {
                data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
            }
            if (!data[key]) data[key] = {};
            data[key] = { ...data[key], ...value };
            fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
            return 1;
        } catch (e) {
            console.error('Local KV Write Error:', e);
            return 0;
        }
    },
    hdel: async (key: string, field: string) => {
        try {
            if (!fs.existsSync(LOCAL_DB_PATH)) return 0;
            const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
            if (data[key]?.[field]) {
                delete data[key][field];
                fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
                return 1;
            }
            return 0;
        } catch (e) {
            console.error('Local KV hdel Error:', e);
            return 0;
        }
    },
    del: async (key: string) => {
        try {
            if (!fs.existsSync(LOCAL_DB_PATH)) return 0;
            const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
            if (data[key]) {
                delete data[key];
                fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
                return 1;
            }
            return 0;
        } catch (e) {
            console.error('Local KV Delete Error:', e);
            return 0;
        }
    },
    get: async (key: string) => {
        // Mock get for migration check - always return null as we don't have old data locally
        return null;
    },
    pipeline: () => {
        // Mock pipeline - return object with exec
        return {
            exec: async () => []
        };
    }
};

// Use local mock if env vars are missing
const isVercelEnv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const db = isVercelEnv ? kv : localKv;

export default db;
