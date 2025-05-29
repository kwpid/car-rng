require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { pool, initializeDatabase } = require('./db');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Create commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Register commands
async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    console.log('Started refreshing application (/) commands.');

    const commands = [];
    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      commands.push(command.data.toJSON());
    }

    // Register commands for each guild the bot is in
    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: commands }
      );
      console.log(`Successfully registered commands for guild: ${guild.name}`);
    }

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

// Initialize database and register commands when bot starts
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await initializeDatabase();
  await registerCommands();
});

// Helper function to get or create user
async function getOrCreateUser(userId) {
  const result = await pool.query(
    'INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING *',
    [userId]
  );
  return result.rows[0];
}

// Helper function to get user's inventory
async function getUserInventory(userId) {
  const result = await pool.query(`
    SELECT c.*, COUNT(*) as count
    FROM inventory i
    JOIN cars c ON i.car_id = c.id
    WHERE i.user_id = $1
    GROUP BY c.id
    ORDER BY c.value DESC
  `, [userId]);
  return result.rows;
}

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ 
      content: 'There was an error executing this command!', 
      ephemeral: true 
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
