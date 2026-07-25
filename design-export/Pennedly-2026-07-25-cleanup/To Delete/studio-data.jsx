// studio-data.jsx — seed content for the Studio screen.
// Realistic Threads-style drafts in one creator's voice (Mara Lin — writes about
// writing, building in public, and the craft of posting). Char counts are derived
// live from text length against the 500 limit, never stored.

const USER = {
  name: "Mara Lin",
  handle: "@mara.lin",
  initials: "ML",
  avatar: "assets/avatars/mara.png",
};

// status: 'draft' | 'ready' | 'published' | 'rejected'
const SEED_DRAFTS = [
  {
    id: "d1",
    kind: "post",
    status: "draft",
    time: "Just now",
    text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
  },
  {
    id: "d2",
    kind: "reply",
    status: "draft",
    time: "Just now",
    replyTo: { who: "@devon", text: "honestly how do you even start writing when your brain is completely blank" },
    text: "Start before you feel ready. I open a doc and write the worst possible first line on purpose — it kills the pressure to be good, and the real sentence usually shows up by line three.",
  },
  {
    id: "d3",
    kind: "post",
    status: "draft",
    time: "2 min ago",
    text: "Shipping cadence beats shipping speed. I'd rather post three decent things a week for a year than twenty great things in one month and then vanish. Consistency compounds. Bursts don't.",
  },
  {
    id: "d4",
    kind: "reply",
    status: "draft",
    time: "2 min ago",
    replyTo: { who: "@ana.writes", text: "do you outline everything first or just start typing and see what happens?" },
    text: "Outline anything over 200 words, freewrite everything under. The outline is just scaffolding — I tear most of it down once the real shape of the thing shows up.",
  },
  {
    id: "r1",
    kind: "post",
    status: "ready",
    time: "Approved 8 min ago",
    text: "You don't need a bigger audience. You need 100 people who'd be genuinely bummed if you stopped.",
  },
  {
    id: "r2",
    kind: "post",
    status: "ready",
    time: "Approved 20 min ago",
    text: "Three years of writing online taught me one thing worth repeating: nobody is thinking about your last post nearly as much as you are. So post the next one.",
  },
  {
    id: "p1",
    kind: "post",
    status: "published",
    time: "Published 2h ago",
    text: "Wrote 1,000 words this morning before I opened email. Cut 600 of them. The 400 that survived are the only ones that were ever going to matter.",
    stats: { likes: 412, replies: 27, reposts: 19 },
  },
  {
    id: "p2",
    kind: "reply",
    status: "published",
    time: "Published yesterday",
    replyTo: { who: "@samandtea", text: "what's the one habit that actually moved the needle for you?" },
    text: "Hitting publish before I'd decided whether it was good. The deciding never ends. The publishing is the only part that teaches you anything.",
    stats: { likes: 138, replies: 11, reposts: 4 },
  },
];

// canned regeneration outputs for the composer (used by the loading → result flow)
const GENERATED_POOL = [
  "Most 'writer's block' is just trying to write the finished sentence first. Write the ugly one. You can't edit a blank page, but you can always fix an embarrassing draft.",
  "Underrated creative skill: being willing to be a little boring on purpose. Not every post needs a twist. Some just need to be true and land on time.",
  "I stopped asking 'is this good enough to post?' and started asking 'would the version of me from a year ago have wanted to read this?' Much easier yes.",
  "The audience you're writing for doesn't exist yet — they show up after you've written the thing only they would love. You have to post into the quiet first.",
];

// canned "tweak" revisions, keyed loosely by intent
const TWEAK_RESULTS = {
  punchier: "Find your voice faster: publish the post you're a little embarrassed by. The polished one is everyone's. The embarrassing one is yours.",
  shorter: "Publish the thing you're slightly embarrassed by. The polished version is everyone's — the embarrassing one is yours.",
  question: "What's the fastest way to find your voice online? Publish the thing you're slightly embarrassed by. The polished version is everyone's; the embarrassing one is yours. What are you sitting on?",
  warmer: "Here's the kindest writing advice I have: publish the thing you're slightly embarrassed by. The polished version belongs to everyone. The embarrassing one is the only one that's truly yours.",
  default: "The fastest way to find your voice: publish the thing you're slightly embarrassed by. The careful, polished version is everyone's. The slightly-too-honest one is unmistakably yours.",
};

const TWEAK_SUGGESTIONS = ["Make it punchier", "Make it shorter", "End on a question", "Warmer tone"];

// UI_LANGS now lives in shell-data.jsx (shared, app-wide). STUDIO_TR / GENERATED_TR
// below are faithful per-locale translations of every seed draft / generation
// output. (In the real app translations come from the service on demand.)
const STUDIO_TR = {
  d1: {
    es: "La forma más rápida de encontrar tu voz en internet: publica eso que te da un poco de vergüenza. La versión pulida es de todos. La que te avergüenza es tuya.",
    de: "Der schnellste Weg, online deine Stimme zu finden: Veröffentliche das, was dir ein bisschen peinlich ist. Die geschliffene Version gehört allen. Die peinliche gehört dir.",
    fr: "Le moyen le plus rapide de trouver ta voix en ligne : publie ce qui te gêne un peu. La version léchée est celle de tout le monde. La version gênante est la tienne.",
    it: "Il modo più rapido di trovare la tua voce online: pubblica ciò che ti mette un po' in imbarazzo. La versione levigata è di tutti. Quella imbarazzante è tua.",
    pt: "O jeito mais rápido de encontrar sua voz online: publique aquilo que te deixa um pouco sem graça. A versão polida é de todos. A sem graça é sua.",
    ru: "Самый быстрый способ найти свой голос в сети: опубликуй то, за что тебе немного неловко. Отполированная версия — общая. Неловкая — твоя.",
    uk: "Найшвидший спосіб знайти свій голос у мережі: опублікуй те, за що тобі трохи ніяково. Відшліфована версія — спільна. Ніякова — твоя.",
  },
  d2: {
    es: "Empieza antes de sentirte listo. Abro un documento y escribo a propósito la peor primera línea posible: mata la presión de ser bueno, y la frase de verdad suele aparecer por la tercera línea.",
    de: "Fang an, bevor du dich bereit fühlst. Ich öffne ein Dokument und schreibe absichtlich die schlechtestmögliche erste Zeile — das nimmt den Druck, gut zu sein, und der echte Satz kommt meist in Zeile drei.",
    fr: "Commence avant de te sentir prêt. J'ouvre un document et j'écris exprès la pire première phrase possible : ça tue la pression de bien faire, et la vraie phrase arrive en général à la troisième ligne.",
    it: "Comincia prima di sentirti pronto. Apro un documento e scrivo apposta la peggior prima riga possibile: toglie la pressione di essere bravo, e la frase vera di solito arriva alla terza riga.",
    pt: "Comece antes de se sentir pronto. Abro um documento e escrevo de propósito a pior primeira linha possível — isso mata a pressão de ser bom, e a frase de verdade costuma aparecer na terceira linha.",
    ru: "Начинай, не дожидаясь готовности. Я открываю документ и нарочно пишу худшую первую строку — это снимает давление быть хорошим, и настоящая фраза обычно появляется к третьей строке.",
    uk: "Починай, не чекаючи готовності. Я відкриваю документ і навмисно пишу найгіршу першу строку — це знімає тиск бути добрим, і справжнє речення зазвичай з’являється до третьої строки.",
  },
  d3: {
    es: "El ritmo de publicación gana a la velocidad. Prefiero publicar tres cosas decentes a la semana durante un año que veinte geniales en un mes y luego desaparecer. La constancia se acumula. Los arranques no.",
    de: "Veröffentlichungsrhythmus schlägt Tempo. Lieber poste ich ein Jahr lang drei solide Sachen pro Woche als zwanzig großartige in einem Monat und verschwinde dann. Beständigkeit summiert sich. Schübe nicht.",
    fr: "La régularité de publication vaut mieux que la vitesse. Je préfère poster trois choses correctes par semaine pendant un an que vingt géniales en un mois puis disparaître. La constance compose. Les à-coups non.",
    it: "La costanza di pubblicazione batte la velocità. Preferisco pubblicare tre cose decenti a settimana per un anno che venti ottime in un mese e poi sparire. La costanza si accumula. Gli sprint no.",
    pt: "Cadência de publicação vence velocidade. Prefiro postar três coisas decentes por semana durante um ano a vinte ótimas num mês e depois sumir. Consistência se acumula. Picos não.",
    ru: "Ритм публикаций важнее скорости. Лучше год выкладывать три достойные вещи в неделю, чем двадцать отличных за месяц и потом исчезнуть. Постоянство накапливается. Рывки — нет.",
    uk: "Ритм публікацій важливіший за швидкість. Краще рік викладати три гідні речі на тиждень, ніж двадцять чудових за місяць і потім зникнути. Постійність накопичується. Ривки — ні.",
  },
  d4: {
    es: "Esquematiza todo lo que pase de 200 palabras y escribe libre lo que esté por debajo. El esquema es solo andamiaje: lo desmonto casi entero en cuanto aparece la forma real del texto.",
    de: "Alles über 200 Wörter wird gegliedert, alles darunter frei geschrieben. Die Gliederung ist nur ein Gerüst — ich reiße das meiste wieder ab, sobald die echte Form sichtbar wird.",
    fr: "Fais un plan pour tout ce qui dépasse 200 mots, écris au fil de la plume en dessous. Le plan n'est qu'un échafaudage : j'en démonte l'essentiel dès que la vraie forme du texte apparaît.",
    it: "Fai una scaletta per tutto ciò che supera le 200 parole, scrivi a ruota libera sotto. La scaletta è solo un'impalcatura: la smonto quasi tutta appena emerge la forma vera del testo.",
    pt: "Faça um esboço para tudo acima de 200 palavras e escreva livre o que ficar abaixo. O esboço é só andaime — derrubo quase tudo assim que a forma real do texto aparece.",
    ru: "Всё, что длиннее 200 слов, — по плану, всё короче — свободным письмом. План — это просто леса: я сношу большую его часть, как только проступает настоящая форма текста.",
    uk: "Усе, що довше за 200 слів, — за планом, усе коротше — вільним письмом. План — це лише риштування: я зношу більшу його частину, щойно проступає справжня форма тексту.",
  },
  r1: {
    es: "No necesitas un público más grande. Necesitas 100 personas a las que de verdad les daría pena que lo dejaras.",
    de: "Du brauchst kein größeres Publikum. Du brauchst 100 Menschen, die es ehrlich bedauern würden, wenn du aufhörst.",
    fr: "Tu n'as pas besoin d'un public plus large. Tu as besoin de 100 personnes que ça attristerait vraiment que tu arrêtes.",
    it: "Non ti serve un pubblico più grande. Ti servono 100 persone a cui dispiacerebbe davvero se smettessi.",
    pt: "Você não precisa de um público maior. Precisa de 100 pessoas que ficariam realmente tristes se você parasse.",
    ru: "Тебе не нужна аудитория побольше. Тебе нужны 100 человек, которые искренне расстроятся, если ты остановишься.",
    uk: "Тобі не потрібна більша аудиторія. Тобі потрібні 100 людей, які щиро засмутяться, якщо ти зупинишся.",
  },
  r2: {
    es: "Tres años escribiendo en internet me enseñaron una cosa que vale la pena repetir: nadie piensa en tu última publicación ni de lejos tanto como tú. Así que publica la siguiente.",
    de: "Drei Jahre Schreiben im Netz haben mich eines gelehrt, das sich zu wiederholen lohnt: Niemand denkt auch nur annähernd so viel an deinen letzten Post wie du. Also poste den nächsten.",
    fr: "Trois ans à écrire en ligne m'ont appris une chose qui mérite d'être répétée : personne ne pense à ta dernière publication autant que toi. Alors publie la suivante.",
    it: "Tre anni di scrittura online mi hanno insegnato una cosa che vale la pena ripetere: nessuno pensa al tuo ultimo post quanto te. Quindi pubblica il prossimo.",
    pt: "Três anos escrevendo online me ensinaram uma coisa que vale repetir: ninguém pensa na sua última publicação nem de longe tanto quanto você. Então publique a próxima.",
    ru: "Три года письма в сети научили меня одному, что стоит повторить: никто не думает о твоём последнем посте даже близко так, как ты. Так что публикуй следующий.",
    uk: "Три роки письма в мережі навчили мене одного, що варто повторити: ніхто не думає про твій останній допис навіть близько так, як ти. Тож публікуй наступний.",
  },
  p1: {
    es: "Esta mañana escribí 1.000 palabras antes de abrir el correo. Recorté 600. Las 400 que sobrevivieron son las únicas que iban a importar.",
    de: "Heute Morgen habe ich 1.000 Wörter geschrieben, bevor ich die Mails öffnete. 600 habe ich gestrichen. Die 400, die übrig blieben, sind die einzigen, auf die es je ankam.",
    fr: "Ce matin, j'ai écrit 1 000 mots avant d'ouvrir mes mails. J'en ai coupé 600. Les 400 qui ont survécu sont les seules qui allaient compter.",
    it: "Stamattina ho scritto 1.000 parole prima di aprire la posta. Ne ho tagliate 600. Le 400 sopravvissute sono le uniche che avrebbero contato.",
    pt: "Hoje de manhã escrevi 1.000 palavras antes de abrir o e-mail. Cortei 600. As 400 que sobraram são as únicas que importariam.",
    ru: "Сегодня утром я написала 1000 слов до того, как открыла почту. Вырезала 600. Оставшиеся 400 — единственные, что вообще имели значение.",
    uk: "Сьогодні вранці я написала 1000 слів, перш ніж відкрила пошту. Вирізала 600. 400, що лишилися, — єдині, що взагалі мали значення.",
  },
  p2: {
    es: "Darle a publicar antes de haber decidido si era bueno. El decidir no termina nunca. Publicar es la única parte que te enseña algo.",
    de: "Auf Veröffentlichen zu drücken, bevor ich entschieden hatte, ob es gut ist. Das Entscheiden hört nie auf. Das Veröffentlichen ist der einzige Teil, der dir etwas beibringt.",
    fr: "Cliquer sur publier avant d'avoir décidé si c'était bon. Décider ne s'arrête jamais. Publier est la seule partie qui t'apprend quelque chose.",
    it: "Premere pubblica prima di aver deciso se fosse buono. Il decidere non finisce mai. Pubblicare è l'unica parte che ti insegna qualcosa.",
    pt: "Apertar publicar antes de decidir se estava bom. O decidir nunca acaba. Publicar é a única parte que te ensina algo.",
    ru: "Нажать «опубликовать» раньше, чем решу, хорошо ли это. Решение не заканчивается никогда. Публикация — единственная часть, которая хоть чему-то учит.",
    uk: "Натиснути «опублікувати» раніше, ніж вирішу, чи це добре. Рішення не закінчується ніколи. Публікація — єдина частина, що хоч чогось вчить.",
  },
};

// Translations for the canned generation outputs, aligned by index to GENERATED_POOL.
const GENERATED_TR = [
  {
    es: "Casi todo el 'bloqueo del escritor' es intentar escribir la frase final de primeras. Escribe la fea. No puedes editar una página en blanco, pero siempre puedes arreglar un borrador vergonzoso.",
    de: "Die meisten „Schreibblockaden“ sind nur der Versuch, gleich den fertigen Satz zu schreiben. Schreib den hässlichen. Eine leere Seite kann man nicht bearbeiten, einen peinlichen Entwurf immer.",
    fr: "La plupart du « syndrome de la page blanche », c'est vouloir écrire la phrase finale d'emblée. Écris la moche. On ne peut pas éditer une page vide, mais on peut toujours corriger un brouillon gênant.",
    it: "Quasi tutto il 'blocco dello scrittore' è provare a scrivere subito la frase finita. Scrivi quella brutta. Non puoi modificare una pagina bianca, ma puoi sempre sistemare una bozza imbarazzante.",
    pt: "Quase todo 'bloqueio criativo' é tentar escrever a frase pronta de cara. Escreva a feia. Não dá para editar uma página em branco, mas sempre dá para consertar um rascunho vergonhoso.",
    ru: "Почти весь «писательский ступор» — это попытка сразу написать готовую фразу. Напиши уродливую. Пустую страницу не отредактируешь, а неловкий черновик — всегда.",
    uk: "Майже весь «творчий ступор» — це спроба одразу написати готову фразу. Напиши потворну. Порожню сторінку не відредагуєш, а ніякову чернетку — завжди.",
  },
  {
    es: "Habilidad creativa subestimada: estar dispuesto a ser un poco aburrido a propósito. No todo post necesita un giro. Algunos solo necesitan ser ciertos y llegar a tiempo.",
    de: "Unterschätzte kreative Fähigkeit: bereit sein, absichtlich ein bisschen langweilig zu sein. Nicht jeder Post braucht eine Wendung. Manche müssen einfach wahr sein und pünktlich landen.",
    fr: "Compétence créative sous-estimée : accepter d'être un peu ennuyeux exprès. Tout post n'a pas besoin d'une chute. Certains doivent juste être vrais et tomber au bon moment.",
    it: "Abilità creativa sottovalutata: essere disposti a risultare un po' noiosi di proposito. Non ogni post ha bisogno di un colpo di scena. Alcuni devono solo essere veri e arrivare al momento giusto.",
    pt: "Habilidade criativa subestimada: topar ser um pouco sem graça de propósito. Nem todo post precisa de uma reviravolta. Alguns só precisam ser verdadeiros e chegar na hora certa.",
    ru: "Недооценённый творческий навык — готовность быть чуть скучным нарочно. Не каждому посту нужен поворот. Некоторым достаточно быть правдой и выйти вовремя.",
    uk: "Недооцінена творча навичка — готовність бути трохи нудним навмисно. Не кожному допису потрібен поворот. Деяким досить бути правдою і вийти вчасно.",
  },
  {
    es: "Dejé de preguntarme '¿esto es lo bastante bueno para publicar?' y empecé a preguntarme '¿la versión de mí de hace un año habría querido leer esto?'. Un sí mucho más fácil.",
    de: "Ich habe aufgehört zu fragen „ist das gut genug zum Posten?“ und fange an zu fragen „hätte mein Ich von vor einem Jahr das lesen wollen?“. Ein viel leichteres Ja.",
    fr: "J'ai arrêté de me demander « est-ce assez bon pour être publié ? » pour me demander « est-ce que le moi d'il y a un an aurait voulu lire ça ? ». Un oui bien plus facile.",
    it: "Ho smesso di chiedermi 'è abbastanza buono da pubblicare?' e ho iniziato a chiedermi 'la me di un anno fa avrebbe voluto leggerlo?'. Un sì molto più facile.",
    pt: "Parei de perguntar 'isto está bom o bastante para postar?' e passei a perguntar 'a versão de mim de um ano atrás iria querer ler isto?'. Um sim bem mais fácil.",
    ru: "Я перестала спрашивать «достаточно ли это хорошо, чтобы опубликовать?» и начала спрашивать «захотела бы я год назад это прочитать?». Сказать «да» куда легче.",
    uk: "Я перестала питати «чи це достатньо добре, щоб опублікувати?» і почала питати «чи захотіла б я рік тому це прочитати?». Сказати «так» набагато легше.",
  },
  {
    es: "El público para el que escribes aún no existe: aparece después de que escribas eso que solo ellos amarían. Primero tienes que publicar en el silencio.",
    de: "Das Publikum, für das du schreibst, existiert noch nicht — es taucht auf, nachdem du das geschrieben hast, das nur es lieben würde. Du musst erst in die Stille hinein posten.",
    fr: "Le public pour qui tu écris n'existe pas encore : il arrive après que tu as écrit la chose que lui seul aimerait. Il faut d'abord publier dans le silence.",
    it: "Il pubblico per cui scrivi non esiste ancora: arriva dopo che hai scritto la cosa che solo lui amerebbe. Prima devi pubblicare nel silenzio.",
    pt: "O público para quem você escreve ainda não existe — ele aparece depois que você escreve aquilo que só ele amaria. Primeiro você tem que publicar no silêncio.",
    ru: "Аудитория, для которой ты пишешь, ещё не существует — она появляется после того, как ты напишешь то, что полюбит только она. Сначала нужно публиковать в тишину.",
    uk: "Аудиторія, для якої ти пишеш, ще не існує — вона з’являється після того, як ти напишеш те, що полюбить лише вона. Спершу треба публікувати в тишу.",
  },
];

// "Ideas in your voice" — ~8 hook+angle brainstorm seeds in Mara's voice, surfaced
// by the composer's ✨ sparkle. Tapping one seeds the brief with its hook. Copy runs
// long on purpose so the cards are proven to wrap, never clip.
const STUDIO_IDEAS = [
  { hook: "The best post I wrote this year took four minutes and broke every rule I'd been taught.",
    angle: "A short story about overthinking — argue momentum beats polish." },
  { hook: "Finding your voice mostly means deleting the sentences that sound like everyone else.",
    angle: "Craft note: subtraction is the real edit." },
  { hook: "I almost didn't post the thing that did the best. Here's exactly what stopped me.",
    angle: "Vulnerability — the embarrassing draft outperforms the safe one." },
  { hook: "Writing every day didn't make me a better writer. Publishing every day did.",
    angle: "Contrarian take on practice vs. shipping." },
  { hook: "Someone asked how I come up with ideas. The honest answer: I just stopped throwing them away.",
    angle: "Process post — capture, don't manufacture." },
  { hook: "The trend everyone's chasing this week is already over. Here's the quieter one underneath it.",
    angle: "React to a trend, then reframe to the durable signal." },
  { hook: "I used to think a small audience meant I was doing it wrong.",
    angle: "Encouragement for early creators — depth over reach." },
  { hook: "Three sentences I almost published, and the one word that would've made them mine.",
    angle: "Teardown of voice at the word level." },
];

Object.assign(window, { USER, SEED_DRAFTS, GENERATED_POOL, TWEAK_RESULTS, TWEAK_SUGGESTIONS, STUDIO_TR, GENERATED_TR, STUDIO_IDEAS });
