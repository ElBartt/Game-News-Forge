/**
 * Subscribe All Command
 * 
 * This command allows users to subscribe to all available games at once.
 * It leverages the gameDatabaseService to perform bulk subscription operations.
 */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const CommandsName = require('@bot/constants/commandsName');
const logger = require('@shared/logger');
const gameDatabaseService = require('@bot/services/gameDatabaseService');
const PrettyColors = require('@shared/prettyColors');

// Constants for consistent messaging
const MESSAGES = {
    PROCESSING: '🔄 Subscribing to all games. This will be quick...',
    ERROR_PREFIX: '❌ An error occurred while subscribing to all games: ',
    SUCCESS_TITLE: 'Subscription Complete',
    SUCCESS_DESCRIPTION: 'Successfully subscribed to all available games.',
};

// Embed configuration
const EMBED_CONFIG = {
    BOT_NAME: 'Game News Forge',
    BOT_ICON: 'https://cdn.discordapp.com/avatars/1239574548928794655/e6726f56578da8c3d1f495dd2f509b33',
};

/**
 * Creates a response embed for subscription results
 * @param {Object} result - The subscription result data
 * @returns {EmbedBuilder} The configured embed
 */
function createResponseEmbed(result) {
    return new EmbedBuilder()
        .setTitle(MESSAGES.SUCCESS_TITLE)
        .setColor(PrettyColors.SUCCESS)
        .setDescription(MESSAGES.SUCCESS_DESCRIPTION)
        .addFields(
            { name: 'Newly Subscribed', value: `${result.newSubscriptions}`, inline: true }
        )
        .setFooter({
            text: EMBED_CONFIG.BOT_NAME,
            iconURL: EMBED_CONFIG.BOT_ICON
        })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(CommandsName.SUBSCRIBE_ALL)
        .setDescription('Subscribe to all available games')
        .setDMPermission(false),

    /**
     * Execute the subscribe all command
     * @param {Object} interaction - Discord interaction object containing command data
     * @returns {Promise<void>} A promise that resolves when the command execution is complete
     */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        try {
            // Validate guild existence
            if (!interaction.guildId) {
                throw new Error('This command can only be used in a server.');
            }

            // Log command execution
            logger.info(`Subscribe all command executed by user ${interaction.user.tag} (${interaction.user.id}) in guild ${interaction.guild.name} (${interaction.guildId})`);

            // Status message
            await interaction.editReply({ content: MESSAGES.PROCESSING });

            // Use the optimized bulk subscribe function
            const result = await gameDatabaseService.subscribeGuildToAllGames(interaction.guildId);

            // Log successful operation with metrics
            logger.info(`Bulk subscription complete for guild ${interaction.guildId}: ${result.newSubscriptions} new subscriptions`);

            // Create and send response
            const embed = createResponseEmbed(result);
            await interaction.editReply({
                content: null,
                embeds: [embed]
            });

        } catch (error) {
            // Categorize and log error
            const errorMessage = error.message || 'Unknown error occurred';
            logger.error(`Subscribe all command error for guild ${interaction.guildId}: ${errorMessage}`, {
                userId: interaction.user?.id,
                guildId: interaction.guildId,
                error: error.stack
            });

            // Send user-friendly error message
            await interaction.editReply({
                content: MESSAGES.ERROR_PREFIX + errorMessage
            });
        }
    }
};
