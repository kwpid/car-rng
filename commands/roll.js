const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db');

async function getOrCreateUser(userId) {
  const result = await pool.query(
    'INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING *',
    [userId]
  );
  return result.rows[0];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll for a random car'),
    
  async execute(interaction) {
    const userId = interaction.user.id;
    await getOrCreateUser(userId);

    // Get all cars and their chances
    const cars = await pool.query('SELECT * FROM cars');
    
    // Calculate total chance
    const totalChance = cars.rows.reduce((sum, car) => sum + car.chance, 0);
    
    // Generate random number
    const roll = Math.floor(Math.random() * totalChance) + 1;
    
    // Find winning car
    let currentSum = 0;
    let winningCar = null;
    
    for (const car of cars.rows) {
      currentSum += car.chance;
      if (roll <= currentSum) {
        winningCar = car;
        break;
      }
    }

    // Create rolling animation
    const animation = new EmbedBuilder()
      .setTitle('🎲 Rolling for a car...')
      .setColor('#0099ff');

    await interaction.reply({ embeds: [animation] });

    // Simulate wheel rolling
    const carsToShow = cars.rows.slice(0, 5);
    for (let i = 0; i < 5; i++) {
      const displayCars = carsToShow.map((car, index) => {
        if (index === i) return `> ${car.emoji} ${car.name} <`;
        return `${car.emoji} ${car.name}`;
      }).join('\n');

      animation.setDescription(displayCars);
      await interaction.editReply({ embeds: [animation] });
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Add car to inventory and update total owners
    await pool.query('BEGIN');
    try {
      await pool.query(
        'INSERT INTO inventory (user_id, car_id) VALUES ($1, $2)',
        [userId, winningCar.id]
      );
      await pool.query(
        'UPDATE cars SET total_owners = total_owners + 1 WHERE id = $1',
        [winningCar.id]
      );
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

    // Show result
    const resultEmbed = new EmbedBuilder()
      .setTitle('🎉 You won a car!')
      .setDescription(`${winningCar.emoji} **${winningCar.name}**\nValue: $${winningCar.value.toLocaleString()}\nTotal Owners: ${winningCar.total_owners}`)
      .setColor('#00ff00');

    await interaction.editReply({ embeds: [resultEmbed] });
  },
}; 