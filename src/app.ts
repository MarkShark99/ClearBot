import { Client, Intents } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client({intents: [Intents.FLAGS.GUILDS]})

client.once('ready', () => console.log("Bot is ready!"));

client.login(process.env.token);