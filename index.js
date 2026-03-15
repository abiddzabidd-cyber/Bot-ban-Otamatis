require("dotenv").config();
const { 
Client, 
GatewayIntentBits, 
SlashCommandBuilder, 
REST, 
Routes 
} = require("discord.js");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

let bannedWords = ["miau"];
const violations = {};

function normalize(text){
return text.toLowerCase().replace(/[^a-z]/g,"");
}

client.once("ready", () => {
console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

if(message.author.bot) return;

const clean = normalize(message.content);

for(const word of bannedWords){

if(clean.includes(word)){

const userId = message.author.id;

if(!violations[userId]){
violations[userId] = 0;
}

violations[userId]++;

await message.delete().catch(()=>{});

if(violations[userId] === 1){

await message.member.timeout(86400000,"Kata terlarang");

try{
await message.author.send(
`🚫 Kamu timeout 1 hari karena mengirim kata terlarang di server **${message.guild.name}**`
);
}catch{}

message.channel.send(
`🚫 ${message.author} timeout 1 hari karena kata terlarang`
);

}else{

try{
await message.author.send(
`⛔ Kamu diban permanent dari server **${message.guild.name}** karena mengulang kata terlarang`
);
}catch{}

await message.guild.members.ban(userId,{
reason:"Mengulang kata terlarang"
});

message.channel.send(
`⛔ ${message.author.tag} diban permanent`
);

}

}

}

});

client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return;

if(!interaction.member.permissions.has("Administrator")){
return interaction.reply({
content:"❌ Hanya admin yang bisa pakai command ini",
ephemeral:true
});
}

if(interaction.commandName === "addword"){

const word = interaction.options.getString("kata");

bannedWords.push(word.toLowerCase());

interaction.reply(`✅ Kata **${word}** berhasil ditambahkan`);

}

if(interaction.commandName === "removeword"){

const word = interaction.options.getString("kata");

bannedWords = bannedWords.filter(w => w !== word.toLowerCase());

interaction.reply(`🗑 Kata **${word}** berhasil dihapus`);

}

if(interaction.commandName === "listword"){

interaction.reply(
`📋 Kata terlarang:\n${bannedWords.join("\n")}`
);

}

});

const commands = [

new SlashCommandBuilder()
.setName("addword")
.setDescription("Tambah kata terlarang")
.addStringOption(option =>
option.setName("kata")
.setDescription("kata")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("removeword")
.setDescription("Hapus kata terlarang")
.addStringOption(option =>
option.setName("kata")
.setDescription("kata")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("listword")
.setDescription("Lihat kata terlarang")

].map(command => command.toJSON());

const rest = new REST({version:"10"}).setToken(process.env.TOKEN);

(async () => {
try{

await rest.put(
Routes.applicationGuildCommands(
process.env.CLIENT_ID,
process.env.GUILD_ID
),
{body:commands}
);

console.log("Slash command berhasil dibuat");

}catch(error){
console.error(error);
}
})();

client.login(process.env.TOKEN);
