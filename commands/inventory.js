const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db');

async function getOrCreateUser(userId) {
  const result = await pool.query(
    'INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING *',
    [userId]
  );
  return result.rows[0];
}

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your or another user\'s inventory')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check inventory for')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userId = targetUser.id;

    await getOrCreateUser(userId);
    const inventory = await getUserInventory(userId);

    if (inventory.length === 0) {
      return interaction.reply({ content: `${targetUser.username} doesn't have any cars!`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.username}'s Garage`)
      .setColor('#0099ff');

    const inventoryText = inventory.map(car => 
      `${car.emoji} **${car.name}** (x${car.count})\n` +
      `Value: $${car.value.toLocaleString()} | ID: ${car.id}`
    ).join('\n\n');

    embed.setDescription(inventoryText);
    await interaction.reply({ embeds: [embed] });
  },
}; 