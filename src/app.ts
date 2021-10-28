import { Client, Intents } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";


import * as dotenv from "dotenv";

// Read in configuration from .env file
dotenv.config();

if (!("token" in process.env)) throw new Error("\"token\" not found in .env file");
if (!("clientId" in process.env)) throw new Error("\"clientId\" not found in .env file");
if (!("guildId" in process.env)) throw new Error("\"guildId\" not found in .env file");

const token = process.env.token as string;
const clientId = process.env.clientId as string;
const guildId = process.env.guildId as string;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => console.log("Bot is ready!"));

client.on("guildCreate", () => {
  console.log("Bot has joined a new server!");
  const commands = [
    new SlashCommandBuilder().setName("ping").setDescription("Replies with pong"),
    new SlashCommandBuilder().setName("clear").setDescription("Clear!"),
  ].map(command => command.toJSON());

  const rest = new REST({ version: '9' }).setToken(token);

  rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered commands in server"))
  .catch(console.error);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName;
  if (commandName === "clear" ) {
    const client = new DynamoDBClient({ region: "us-east-2" });
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
  
    let count;
    const response = client.send(dbUpdateCommand);
    await response.then(async (value) => {
      if (value.Attributes && value.Attributes.V.N) {
        count = value.Attributes.V.N;
      } else {
        await interaction.reply("Unclear...");
        return;
      }
    }).catch(console.error);
    
    await interaction.reply(`Clear! (${count})`);
  }
});

client.login(token);