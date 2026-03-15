require("dotenv").config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let data = JSON.parse(fs.readFileSync("words.json"));
let bannedWords = data.words;

let violations = {};

function normalize(text){
  return text
  .toLowerCase()
  .replace(/1/g,"i")
  .replace(/3/g,"e")
  .replace(/4/g,"a")
  .replace(/0/g,"o")
  .replace(/[^a-z]/g,"");
}

function saveWords(){
  fs.writeFileSync("words.json", JSON.stringify({words:bannedWords},null,2));
}

client.once("ready", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message)=>{

  if(message.author.bot) return;

  const msg = normalize(message.content);

  for(const word of bannedWords){

    if(msg.includes(normalize(word))){

      const id = message.author.id;

      if(!violations[id]) violations[id]=0;

      violations[id]++;

      await message.delete().catch(()=>{});

      if(violations[id]===1){

        await message.member.timeout(86400000,"Kata terlarang");

        try{
          await message.author.send("🚫 Kamu timeout 1 hari karena kata terlarang");
        }catch{}

        message.channel.send(`🚫 ${message.author} timeout 1 hari`);

      }else{

        try{
          await message.author.send("⛔ Kamu diban permanent karena mengulang kata terlarang");
        }catch{}

        await message.guild.members.ban(id);

        message.channel.send(`⛔ ${message.author.tag} diban permanent`);

      }

      return;

    }

  }

});

client.on("interactionCreate", async interaction=>{

  if(!interaction.isChatInputCommand()) return;

  if(interaction.commandName==="addword"){

    const word = interaction.options.getString("kata").toLowerCase();

    if(bannedWords.includes(word)){
      return interaction.reply("⚠️ Kata sudah ada di blacklist.");
    }

    bannedWords.push(word);
    saveWords();

    interaction.reply(`✅ Kata **${word}** ditambahkan`);

  }

  if(interaction.commandName==="removeword"){

    const word = interaction.options.getString("kata").toLowerCase();

    if(!bannedWords.includes(word)){
      return interaction.reply("⚠️ Kata tidak ditemukan.");
    }

    bannedWords = bannedWords.filter(w=>w!==word);
    saveWords();

    interaction.reply(`🗑 Kata **${word}** dihapus`);

  }

  if(interaction.commandName==="listword"){

    if(bannedWords.length===0){
      return interaction.reply("📋 Tidak ada kata terlarang.");
    }

    interaction.reply(
`📋 **Daftar Kata Terlarang**

Jumlah kata: ${bannedWords.length}

${bannedWords.map((w,i)=>`${i+1}. ${w}`).join("\n")}`
    );

  }

});

const commands=[

new SlashCommandBuilder()
.setName("addword")
.setDescription("Tambah kata terlarang")
.addStringOption(o=>
o.setName("kata").setDescription("kata").setRequired(true)
),

new SlashCommandBuilder()
.setName("removeword")
.setDescription("Hapus kata terlarang")
.addStringOption(o=>
o.setName("kata").setDescription("kata").setRequired(true)
),

new SlashCommandBuilder()
.setName("listword")
.setDescription("Lihat kata terlarang")

].map(c=>c.toJSON());

const rest = new REST({version:"10"}).setToken(process.env.TOKEN);

(async()=>{
  try{

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {body:commands}
    );

    console.log("Slash command berhasil dibuat");

  }catch(err){
    console.error(err);
  }
})();

client.login(process.env.TOKEN);
