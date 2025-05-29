# Car RNG Discord Bot

A Discord bot that lets users roll for cars with different rarities and values. The bot features a unique rolling animation and tracks car ownership across all users.

## Features

- 🎲 Roll for cars with different rarities
- 🏎️ Animated rolling system
- 📊 Track total owners for each car
- 💰 Sell cars for their value
- 📦 View inventory with car details
- 🎯 Rarity system with different chances for each car

## Commands

- `/roll` - Roll for a random car
- `/sell <car_id>` - Sell a car from your inventory
- `/inventory [@user]` - View your or another user's inventory

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   DATABASE_URL=your_postgres_database_url
   ```
4. Deploy to Railway:
   - Connect your GitHub repository to Railway
   - Add the environment variables in Railway's dashboard
   - Deploy the application

## Database

The bot uses PostgreSQL and automatically creates the necessary tables:
- `users` - Stores user information and balance
- `cars` - Stores car information and total owners
- `inventory` - Stores user's car inventory

## Car Data

Cars are defined in `cars.json` with the following properties:
- `id` - Unique identifier
- `name` - Car name
- `emoji` - Car emoji
- `chance` - Roll chance (1 in X)
- `value` - Car value in currency

## Contributing

Feel free to submit issues and enhancement requests! 