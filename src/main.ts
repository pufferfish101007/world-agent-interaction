import { loadEnvFile, env } from 'node:process';
import { GoogleGenAI } from '@google/genai';

loadEnvFile();
const { MODEL } = env;

const ai = new GoogleGenAI({});

