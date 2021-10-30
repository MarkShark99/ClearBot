import { Client, Intents } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import * as dotenv from "dotenv";

// Read in configuration from .env file (if there)
dotenv.config();

// Verify that environment variables exist
if (!("token" in process.env)) throw new Error("\"token\" not found in environment variables");
if (!("clientId" in process.env)) throw new Error("\"clientId\" not found in environment variables");
if (!("guildId" in process.env)) throw new Error("\"guildId\" not found in environment variables");

const token = process.env.token as string;
const clientId = process.env.clientId as string;
const guildId = process.env.guildId as string;

// Create bot client
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Wait for client to be ready
client.once('ready', () => console.log("Bot is ready!"));

// Run this when bot is live and added to a server to automatically add commands
client.on("guildCreate", () => {
  console.log("Bot has joined a new server!");
  
  // Create list of commands that we want to be able to use
  const commands = [
    new SlashCommandBuilder().setName("clear").setDescription("Clear!"),
  ].map(command => command.toJSON());

  // Create REST object
  const rest = new REST({ version: '9' }).setToken(token);

  // Submit slash commands
  rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered commands in server"))
  .catch(console.error);
});

// Run this when someone interacts with the bot
client.on('interactionCreate', async (interaction) => {
  // Verify that this is a command
  if (!interaction.isCommand()) return;

  // Extract command name and verify that it equals 'clear'
  const commandName = interaction.commandName;
  if (commandName === "clear" ) {
    // TODO: Replace this with an API call

    // Create db client
    const client = new DynamoDBClient({ region: "us-east-2" });
    
    // Create command to increment value for Key 'count' in Clear-Button table
    const dbUpdateCommand = new UpdateItemCommand({
      TableName: "Clear-Button",
      Key: {
        "Key": {
          S: "count"
        }
      },
      UpdateExpression: "SET V = V + :one",
      ExpressionAttributeValues: { ":one": { N: "1" } },
      ReturnValues: "UPDATED_NEW"
    });

    const response = client.send(dbUpdateCommand);
    await response.then(async (value) => {
      // If everything worked with DynamoDB, reply with the next value
      if (value.Attributes && value.Attributes.V.N) {
        await interaction.reply(`Clear! (${value.Attributes.V.N})`);
      } else {
        await interaction.reply("Unclear...");
      }
    }).catch(console.error);
  }
});

client.login(token);