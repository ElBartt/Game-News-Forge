# Game News Forge

Game News Forge is a Discord bot designed to monitor and announce game releases and news. It integrates with platforms like Steam and Twitter to fetch the latest updates and ensures that your Discord community stays informed about upcoming and newly released games.

This monorepo contains the code for three main components:
- **Bot**: Discord bot that fetches and distributes game news and release announcements
- **API**: Backend services for data management
- **Dashboard**: Web interface that allows users to manage the bot's configuration for owned servers

## Features

- **Slash Command Handling**: Manage and execute various slash commands for interacting with the bot.
- **News Fetching**: Retrieve the latest news from Steam's internal and external feeds and Twitter.
- **Release Announcements**: Schedule and send announcements for game releases using cron jobs.
- **Permission Management**: Ensure only administrators can execute certain commands.
- **Auto-Complete**: Provide auto-complete suggestions for game names during interactions.
- **Logging**: Comprehensive logging for monitoring bot activities and errors.
- **Dashboard**: Manage the bot's configuration and game subscriptions through a web interface.
- **Multi-server Support**: Configure the bot differently for each Discord server.

## Technologies Used

### Core Technologies
- **Node.js** - Runtime environment
- **Discord.js** - Discord API library
- **Express.js** - Web framework for dashboard and API
- **MariaDB** - Database management system
- **PM2** - Process manager for production deployment

### Bot Specific
- **Puppeteer** - Headless browser for web scraping
- **Node-cron** - Task scheduling for release announcements
- **Axios** - HTTP client for API requests
- **XML2JS** - XML parsing for Steam feeds

### Dashboard Specific
- **Passport** - Authentication middleware with Discord OAuth
- **EJS** - Templating engine for server-side rendering
- **Helmet** - Security middleware
- **connect-sqlite3** - Session storage

### Development Tools
- **dotenv** - Environment variable management
- **cross-env** - Cross-platform environment setting
- **module-alias** - Module aliasing for cleaner imports
- **chalk** - Terminal string styling for logs

## Installation

1. **Clone the Repository**
    ```sh
    git clone https://github.com/your-repo/game-news-forge.git
    cd game-news-forge
    ```

2. **Install Dependencies**
    ```sh
    npm install
    ```
    
3. **Configure Environment Variables**
    - Create `.env.dev` and `.env.prod` files based on the following template.
    - The dashboard examples use port `4000` to match the current default `WEB_PORT`:
    ```
    # Logging
    LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR

    # Discord Configuration
    DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
    DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
    DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
    DISCORD_CALLBACK_URL=http://localhost:4000/auth/callback
    ADMIN_GUILD_ID=GUILD_ID_FOR_ADMIN_COMMANDS
    
    # Session / Auth Configuration
    SESSION_SECRET=YOUR_SESSION_SECRET
    COOKIE_DOMAIN=localhost
    SESSION_MAX_AGE=604800000

    # Database Configuration
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=dbuser
    DB_PASSWORD=dbpassword
    DB_NAME=gamewatcher
    
    # Dashboard Configuration
    WEB_PORT=4000
    WEB_URL=http://localhost:4000
    DASHBOARD_BASE_PATH=

    # API Configuration
    API_PORT=8473
    API_ENDPOINT=http://localhost
    CORS_ORIGINS=http://localhost:4000
    SESSION_CLEANUP_INTERVAL=3600000
    ```

4. **Configure Your Discord Bot**
    - Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications)
    - Navigate to the "Bot" tab and create a bot
    - Copy the bot token to your `.env` files
    - In the OAuth2 tab:
        - Set the OAuth2 URL Generator to use scopes: `bot` and `applications.commands`
        - Set bot permissions:
            - For development: `Administrator`
            - For production: `Send Messages`, `Embed Links`, `Attach Files`, `Use Slash Commands`, `Send Messages in Threads`, `Manage Webhooks`
        - Add a redirect URL matching your `DISCORD_CALLBACK_URL` (e.g., `http://localhost:3000/auth/callback`)
    - Use the generated URL to add the bot to your server

5. **Set Up Database**
    - Create a MariaDB database matching your configuration
    - The application will automatically create the necessary tables on first run

## Usage
### Development

Start the bot in development mode:
```sh
npm run start:bot:dev
```

Start the dashboard in development mode:
```sh
npm run start:dashboard:dev
```

### Production

Start the bot in production mode:
```sh
npm run start:bot:prod
```

Start the dashboard in production mode:
```sh
npm run start:dashboard:prod
```

### Docker deployment (Coolify/VPS)

This repository now includes production Docker files for the bot, dashboard, and API:

- `./Dockerfile.bot`
- `./Dockerfile.dashboard`
- `./Dockerfile.api`
- `./docker-compose.coolify.yml`

For Coolify stack deployments:

1. Use `docker-compose.coolify.yml`.
2. Expose only the `dashboard` service through your domain.
3. Configure the domain/path as `https://bot.oslo.ovh/dashboard`.
4. Keep the `bot` and `api` services internal (no public ports).
5. Configure deployment secrets and environment variables through the Coolify UI.

The Coolify compose file keeps stable internal values inline and reads secrets or deployment-specific values from Coolify environment variables. Internal service communication uses Docker service names:

- dashboard -> api: `http://api:8473`
- api -> MariaDB: `mariadb`
- bot -> MariaDB: `mariadb`

Recommended `docker-compose.coolify.yml`:

```yml
x-common-env: &common-env
  NODE_ENV: prod
  LOG_LEVEL: ${LOG_LEVEL:-INFO}

x-db-env: &db-env
  DB_HOST: mariadb
  DB_PORT: 3306
  DB_USER: ${DB_USER}
  DB_PASSWORD: ${DB_PASSWORD}
  DB_NAME: ${DB_NAME}

services:
  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.dashboard
    restart: unless-stopped
    environment:
      <<: *common-env
      WEB_PORT: 4000
      DASHBOARD_BASE_PATH: /dashboard
      API_BASE_URL: http://api:8473
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET}
      DISCORD_CALLBACK_URL: ${DISCORD_CALLBACK_URL}
      # TODO: Required by dashboard/app/core/application/services/GuildService.js; remove when guild lookups stop using the bot token.
      DISCORD_TOKEN: ${DISCORD_TOKEN}
      SESSION_SECRET: ${SESSION_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      SESSION_MAX_AGE: ${SESSION_MAX_AGE:-604800000}
    depends_on:
      - api
    expose:
      - '4000'

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    restart: unless-stopped
    environment:
      <<: [*common-env, *db-env]
      API_PORT: 8473
      CORS_ORIGINS: ${CORS_ORIGINS}
      SESSION_CLEANUP_INTERVAL: ${SESSION_CLEANUP_INTERVAL:-3600000}
    expose:
      - '8473'

  bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    restart: unless-stopped
    environment:
      <<: [*common-env, *db-env]
      DISCORD_TOKEN: ${DISCORD_TOKEN}
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      ADMIN_GUILD_ID: ${ADMIN_GUILD_ID}
    depends_on:
      - api
```

The dashboard now supports path-based hosting and prefixes routes/static assets with `DASHBOARD_BASE_PATH`, while server-to-server API calls can use Docker-internal hostnames through `API_BASE_URL`.

Recommended `.env.prod` structure for Coolify-managed variables:

```sh
# Logging
LOG_LEVEL=INFO

# Discord
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=https://bot.yourdomain.com/dashboard/auth/callback
ADMIN_GUILD_ID=

# Session / auth
SESSION_SECRET=
COOKIE_DOMAIN=bot.yourdomain.com
SESSION_MAX_AGE=604800000

# Database
DB_USER=
DB_PASSWORD=
DB_NAME=

# API
CORS_ORIGINS=https://bot.yourdomain.com
SESSION_CLEANUP_INTERVAL=3600000
```

Secrets that should exist only in the Coolify UI:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_SECRET`
- `SESSION_SECRET`
- `DB_PASSWORD`

note: the current dashboard implementation also needs `DISCORD_TOKEN` for guild detail lookups, so it must be provided to both `dashboard` and `bot` until that runtime dependency is removed from the application code.

Variables no longer needed in the production env with this Coolify setup:

- `WEB_PORT`
- `API_PORT`
- `API_ENDPOINT`
- `DB_HOST`
- `DB_PORT`
- `WEB_URL`

`WEB_URL` is no longer included because the current production dashboard runtime does not read it; the deployed dashboard URL is represented by `DISCORD_CALLBACK_URL`, `COOKIE_DOMAIN`, and the public Coolify domain/path configuration instead.

### Deploy Commands

Deploy slash commands for development:
```sh
npm run deployCommands:dev
```

Deploy slash commands for production:
```sh
npm run deployCommands:prod
```

### Build Scripts

build the api project:
```sh
npm run build:api
```

Build the bot project:
```sh
npm run build:bot
```

Build the dashboard project:
```sh
npm run build:dashboard
```

Build all projects:
```sh
npm run build:all
```

### Deployment Scripts

Deploy the api to a production environment:
```sh
npm run deploy:api --user USER_NAME --host IP --path FOLDER --password PASSWORD
```

Deploy the bot to a production environment:
```sh
npm run deploy:bot --user USER_NAME --host IP --path FOLDER --password PASSWORD
```

Deploy the dashboard to a production environment:
```sh
npm run deploy:dashboard --user USER_NAME --host IP --path FOLDER --password PASSWORD
```

### Start deployed projects

install the npm packages for each project
```sh
npm install
```

each project use pm2 to start the project, so you can use the following command to start the project
```sh
pm2 start ecosystem.config.js --env production
```

### Project Structure

```
i:\_workspace_fourtou\Discord\GameWatcher\
├── .env.dev
├── .env.prod
├── .gitignore
├── package.json
├── package-lock.json
├── readme.md
├── todo.md
├── api/
│   ├── ecosystem.config.js
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── controllers/
│       │   └── gameController.js
│       └── routes/
│           └── gameRoutes.js
├── bot/
│   ├── ecosystem.config.js
│   ├── package.json
│   ├── publish.bat
│   ├── app/
│   │   ├── app.js
│   │   ├── client.js
│   │   ├── commandDeployer.js
│   │   ├── commandHandler.js
│   │   ├── commandHelper.js
│   │   ├── messageUtil.js
│   │   ├── releaseManager.js
│   │   ├── utils.js
│   │   ├── webhookManager.js
│   │   ├── commands_private/
│   │   │   ├── configuration/
│   │   │   └── utility/
│   │   ├── commands_public/
│   │   │   └── configuration/
│   │   ├── constants/
│   │   │   ├── commandsName.js
│   │   │   ├── commandsOption.js
│   │   │   ├── discordConstants.js
│   │   │   ├── sourceType.js
│   │   │   └── steamFeedType.js
│   │   ├── events/
│   │   │   ├── guildDelete.js
│   │   │   ├── interactionCreate.js
│   │   │   └── ready.js
│   │   ├── utils/
│   │   └── watchers/
│   │       ├── steamExternalWatcher.js
│   │       ├── steamInternalWatcher.js
│   │       ├── twitterWatcher.js
│   │       ├── watcher.js
│   │       ├── watcherManager.js
│   │       └── wrappers/
│   │           ├── steamExternalWrapper.js
│   │           ├── steamInternalWrapper.js
│   │           └── twitterWrapper.js
│   ├── assets/
│   │   ├── icon_pc_gamer.png
│   │   ├── icon_pcgamesn.png
│   │   ├── icon_rps.png
│   │   ├── icon_steam.png
│   │   ├── icon_twitter.png
│   │   └── icon_VG247.png
│   └── storage/
│       └── 5d9a17cb70b9733aadc073a44c21889d33325874c51f9c0c461de3e61a2425eb
├── dashboard/
│   ├── ecosystem.config.js
│   ├── hexagonal-api.md
│   ├── hexagonal.md
│   ├── package.json
│   ├── sessions/
│   └── app/
│       ├── app.js
│       ├── webServer.js
│       ├── adapters/
│       │   ├── in/
│       │   │   └── web/
│       │   │       ├── AuthController.js
│       │   │       ├── GameController.js
│       │   │       ├── GuildController.js
│       │   │       ├── ErrorMiddleware.js
│       │   │       ├── Router.js
│       │   │       └── viewmodels/
│       │   │           ├── DashboardViewModel.js
│       │   │           └── GameViewModel.js
│       │   └── out/
│       │       ├── discord/
│       │       │   └── DiscordRepositoryImpl.js
│       │       └── persistence/
│       │           ├── GameRepositoryImpl.js
│       │           └── GuildMapper.js
│       ├── config/
│       │   ├── AuthConfig.js
│       │   └── SecurityConfig.js
│       ├── core/
│       │   ├── application/
│       │   │   ├── errors/
│       │   │   │   └── ApplicationErrors.js
│       │   │   ├── factories/
│       │   │   │   ├── ControllerFactory.js
│       │   │   │   └── ServiceFactory.js
│       │   │   └── services/
│       │   │       ├── GameService.js
│       │   │       ├── GuildService.js
│       │   │       └── UserService.js
│       │   └── domain/
│       │       ├── entities/
│       │       │   ├── Guild.js
│       │       │   ├── Pagination.js
│       │       │   └── Source.js
│       │       └── ports/
│       │           ├── in/
│       │           │   ├── GamePort.js
│       │           │   ├── GuildPort.js
│       │           │   └── UserPort.js
│       │           └── out/
│       │               ├── DiscordRepository.js
│       │               └── GameRepository.js
│       ├── img/
│       │   ├── game-news-forge-logo-favicon.png
│       │   └── game-news-forge-logo-light.png
│       ├── infrastructure/
│       │   ├── AppInitializer.js
│       │   └── WebServer.js
│       ├── public/
│       │   ├── css/
│       │   │   └── dashboard.css
│       │   └── js/
│       │       ├── adapters/
│       │       │   └── apiClient.js
│       │       ├── application/
│       │       │   └── gameService.js
│       │       ├── dashboard.js
│       │       ├── presentation/
│       │       │   ├── gameList.js
│       │       │   └── serverList.js
│       │       └── utils/
│       │           └── formatters.js
│       └── views/
│           ├── dashboard.ejs
│           ├── error.ejs
│           ├── login.ejs
│           └── pages/
│               ├── privacy_policy.ejs
│               └── terms_of_service.ejs
├── deploy/
│   ├── api/
│   │   ├── ecosystem.config.js
│   │   ├── package.json
│   │   ├── shared/
│   │   │   ├── config.js
│   │   │   ├── database.js
│   │   │   ├── logger.js
│   │   │   ├── prettyColors.js
│   │   │   └── timeConstants.js
│   │   └── src/
│   │       ├── app.js
│   │       ├── server.js
│   │       ├── controllers/
│   │       └── routes/
│   ├── bot/
│   │   ├── ecosystem.config.js
│   │   ├── package.json
│   │   ├── publish.bat
│   │   ├── readme.md
│   │   ├── app/
│   │   ├── assets/
│   │   ├── shared/
│   │   └── storage/
│   └── dashboard/
│       ├── ecosystem.config.js
│       ├── package.json
│       ├── sessions/
│       ├── app/
│       └── shared/
├── scripts/
│   ├── deploy.js
│   └── deployToVPS.js
└── shared/
    ├── config.js
    ├── database.js
    ├── logger.js
    ├── prettyColors.js
    └── timeConstants.js
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

See the LICENSE file for details.