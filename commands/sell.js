const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell a car from your inventory')
    .addIntegerOption(option =>
      option.setName('car_id')
        .setDescription('The ID of the car to sell')
        .setRequired(true)),

  async execute(interaction) {
    const carId = interaction.options.getInteger('car_id');
    const userId = interaction.user.id;

    // Check if user has the car
    const result = await pool.query(
      'SELECT * FROM inventory WHERE user_id = $1 AND car_id = $2 LIMIT 1',
      [userId, carId]
    );

    if (result.rows.length === 0) {
      return interaction.reply({ content: 'You don\'t own this car!', ephemeral: true });
    }

    // Get car details
    const car = await pool.query('SELECT * FROM cars WHERE id = $1', [carId]);

    // Remove car from inventory and update total owners
    await pool.query('BEGIN');
    try {
      await pool.query(
        'DELETE FROM inventory WHERE id = $1',
        [result.rows[0].id]
      );
      await pool.query(
        'UPDATE cars SET total_owners = total_owners - 1 WHERE id = $1',
        [carId]
      );
      await pool.query(
        'UPDATE users SET balance = balance + $1 WHERE user_id = $2',
        [car.rows[0].value, userId]
      );
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

    const embed = new EmbedBuilder()
      .setTitle('💰 Car Sold!')
      .setDescription(`You sold ${car.rows[0].emoji} **${car.rows[0].name}** for $${car.rows[0].value.toLocaleString()}`)
      .setColor('#ff9900');

    await interaction.reply({ embeds: [embed] });
  },
}; 