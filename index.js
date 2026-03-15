require("dotenv").config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let bannedWords = ["miau"];
let violations = {};

client.once("ready", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  for (const word of bannedWords) {

    if (msg.includes(word)) {

      const id = message.author.id;

      if (!violations[id]) violations[id] = 0;

      violations[id]++;

      await message.delete().catch(()=>{});

      if (violations[id] === 1) {

        await message.member.timeout(86400000, "Kata terlarang");

        try{
          await message.author.send("🚫 Kamu timeout 1 hari karena kata terlarang");
        }catch{}

        message.channel.send(`🚫 ${message.author} timeout 1 hari`);

      } else {

        try{
          await message.author.send("⛔ Kamu diban karena mengulang kata terlarang");
        }catch{}

        await message.guild.members.ban(id);

        message.channel.send(`⛔ ${message.author.tag} diban permanent`);

      }

      return;

    }

  }

});

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "addword") {

    const word = interaction.options.getString("kata").toLowerCase();

    bannedWords.push(word);

    interaction.reply(`✅ Kata **${word}** ditambahkan`);

  }

  if (interaction.commandName === "listword") {

    interaction.reply(`📋 Kata terlarang:\n${bannedWords.join(", ")}`);

  }

});

const commands = [
new SlashCommandBuilder()
.setName("addword")
.setDescription("Tambah kata terlarang")
.addStringOption(o =>
  o.setName("kata")
  .setDescription("kata")
  .setRequired(true)
),

new SlashCommandBuilder()
.setName("listword")
.setDescription("Lihat kata terlarang")

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash command berhasil dibuat");

  } catch (error) {
    console.error(error);
  }
})();

client.login(process.env.TOKEN);
