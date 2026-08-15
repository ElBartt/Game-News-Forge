/**
 * Represents a Discord Guild (server) entity in the domain
 */
class Guild {
    constructor(id, name, icon, permissions, webhookUrl = null, channelId = null, owner = false) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.permissions = permissions;
        this.webhookUrl = webhookUrl;
        this.channelId = channelId;
        this.owner = Boolean(owner);
    }

    hasAdminPermission() {
        // Guild owner always has administrator rights
        if (this.owner) {
            return true;
        }

        if (this.permissions === undefined || this.permissions === null) {
            return false;
        }

        try {
            // Discord permissions in API v10 are 64-bit integers represented as strings.
            // Using BigInt prevents 32-bit integer overflow truncation.
            const perms = BigInt(this.permissions);
            const ADMINISTRATOR = 0x8n; // 1n << 3n
            const MANAGE_GUILD = 0x20n; // 1n << 5n

            return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
        } catch {
            return false;
        }
    }

    getIconUrl() {
        if (!this.icon) return null;
        return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.png`;
    }
}

module.exports = Guild;