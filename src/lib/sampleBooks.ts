import { Book } from '../types';
import { cleanNarrationText } from './cleaner';

function makeChapter(
  id: string,
  number: number,
  title: string,
  rawText: string
) {
  const clean = cleanNarrationText(rawText);
  const words = clean.cleanedText.split(/\s+/).filter(Boolean).length;
  // Average audio narration speed is ~130-150 words per minute
  const estimatedMinutes = Math.max(1, Math.round(words / 130));

  return {
    id,
    number,
    title,
    rawText,
    cleanedText: clean.cleanedText,
    wordCount: words,
    estimatedMinutes,
    cleanedStats: clean.stats,
  };
}

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'dom-casmurro',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    format: 'sample',
    coverAccentColor: '#1e3a8a',
    description: 'Um dos maiores clássicos da literatura brasileira. Bento Santiago narra sua juventude, seu amor por Capitu e as tormentas da dúvida.',
    currentChapterIndex: 0,
    chapters: [
      makeChapter(
        'dc-cap-1',
        1,
        'Capítulo I: Do Título',
        `Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos.
— 1 —
A viagem era curta, e os versos pode ser que não fossem inteiramente maus, porém o meu hábito de dormir em viagem e o cansaço do dia fizeram-me fechar os olhos. O rapaz não reparou que eu dormia; continuou a recitar os seus versos até que o trem parou na estação.
[1]
— Desculpe se o importunei — disse ele quando me acordei.
— De modo nenhum — retruquei com urbanidade.
[2, 3]

— 2 —
DOM CASMURRO | MACHADO DE ASSIS
No dia seguinte já os vizinhos me chamavam de "Dom Casmurro". O título não me desagradou. Casmurro não está aqui no sentido de homem teimoso, mas de sujeito recolhido, metido em si mesmo. O próprio rapaz dos versos foi quem espalhou o apelido, em vingança do meu sono.
(ASSIS, 1899, p. 7)
Também não achei melhor nome para este livro de memórias. Se não tiver outro préstimo, terá ao menos este: faz passar o tempo.`
      ),
      makeChapter(
        'dc-cap-2',
        2,
        'Capítulo II: Do Livro',
        `Agora que expliquei o título, passo a escrever o livro. Antes disso, porém, convém dizer as razões que me moveram a deitar no papel estas reminiscências.
— 3 —
Vivo só, com um criado. A casa em que moro é própria; fiz construí-la expressamente, com o mesmo arranjo e as mesmas pinturas que tinha a minha antiga casa de Mata-Cavalos, onde cresci. O meu fim evidente era atar as duas pontas da vida, e restaurar na velhice a adolescência.
[4]
Pois, senhor, não consegui recompor o que foi nem o que fui. Em verdade, as paredes são iguais, os quadros são os mesmos, mas faltam as pessoas de outro tempo, e eu próprio não sou o mesmo rapaz tímido que ali viveu com sua mãe e Capitu.
— 4 —
(cf. SCHWARZ, 1997, p. 34)
Falta a voz da minha juventude. Então, pensei: que melhor meio de ressuscitá-la do que escrevendo-a? Se o leitor me acompanhar com paciência, verá como tudo começou no ano da graça de 1857.`
      ),
      makeChapter(
        'dc-cap-3',
        3,
        'Capítulo III: A Denúncia',
        `Ia a entrar na sala de visitas, quando ouvi proferir o meu nome e escondi-me atrás da porta. A casa era a de Mata-Cavalos, a rua começava a ser mais habitada, mas ainda era pacata.
— 5 —
Quem falava era José Dias, o agregado da família. Minha mãe estava costurando perto da janela.
[5]
— D. Glória, a senhora precisa cumprir a promessa — dizia ele com a sua voz empolada. — O Bentinho há de ir para o seminário. Já tem quinze anos, e é tempo de começar a carreira eclesiástica. A senhora prometeu a Deus dar-lhe um padre se o menino nascesse são.
— 6 —
DOM CASMURRO | MACHADO DE ASSIS
— Sim, eu sei, José Dias — respondeu minha mãe suspirando. — Mas custa-me tanto separar-me dele!
— Custa, mas é a sua obrigação de mãe devota. Além disso, a senhora tem reparado que ele anda muito metido com a filha do Pádua? O Bentinho e a Capitu estão sempre de cochichos. Meninos assim, se pegam afeição, depois é uma dificuldade para desmanchar.
(CANDIDO, 1970, p. 55)
Quando ouvi isso, o coração deu-me um salto no peito. Pela primeira vez na vida compreendi que gostava de Capitu com outro amor que não era de irmão.`
      ),
      makeChapter(
        'dc-cap-4',
        4,
        'Capítulo IV: Um Dever Estrito',
        `José Dias continuou a falar com gravidade. Ele gostava de empregar superlativos e de falar em tom de tribuno romano.
— 7 —
— A Capitu é uma criatura dissimulada — afirmava ele, abaixando um pouco a voz para que ninguém mais ouvisse. — Tem uns olhos que parece que estão sempre espiando o que a gente pensa. Olhos de cigana oblíqua e dissimulada.
[6, 7]
Minha mãe ficou pensativa. Olhou para o jardim através dos vidros da janela e passou a mão pela testa, como se quisesse afastar uma nuvem incômoda.
— 8 —
— Não fale assim da menina, José Dias. São duas crianças apenas. Mas se o Bentinho precisa ir para o seminário, irá. Falarei com o padre Cabral ainda esta semana.
(ASSIS, 1899, p. 19)
Eu, detrás da porta, sentia que o chão fugia aos meus pés. Perder Capitu e ser metido entre padres e latins parecia-me a maior calamidade do universo inteiro.`
      ),
      makeChapter(
        'dc-cap-5',
        5,
        'Capítulo V: O Agregado',
        `José Dias amava os superlativos. Era a sua feição predileta de expressão. Se via uma tarde bonita, não dizia que estava linda: dizia que estava esplendidíssima. Se aprovava um doce, achava-o perfeitíssimo.
— 9 —
Vivia conosco havia muitos anos. Viera como médico homeopata improvisado quando meu pai ainda era vivo, curara alguns escravos com pílulas milagrosas, e acabara ficando em nossa casa. Tinha um quarto no fundo do quintal, comia à nossa mesa e aconselhava minha mãe nos negócios domésticos.
[8]
— 10 —
DOM CASMURRO | MACHADO DE ASSIS
Era homem de maneiras polidas, vestia-se de jaquetão preto e andava com passos medidos e lentos, curvando-se levemente a cada passo como reverência ao chão sagrado do mundo. Ninguém sabia ao certo donde viera nem que parentes tinha. Ele próprio se considerava membro indissolúvel da família Santiago.
(BARRETO, 1982, p. 112)
E agora, aquele mesmo José Dias ameaçava destruir o meu futuro com Capitu em nome de uma promessa antiga!`
      ),
    ],
  },
  {
    id: 'memorias-postumas',
    title: 'Memórias Póstumas de Brás Cubas',
    author: 'Machado de Assis',
    format: 'sample',
    coverAccentColor: '#14532d',
    description: 'Um defunto autor narra sua existência com ironia refinada, reflexões existenciais e pioneirismo estético.',
    currentChapterIndex: 0,
    chapters: [
      makeChapter(
        'mp-cap-1',
        1,
        'Capítulo I: Óbito do Autor',
        `Algum tempo hesitei se devia abrir estas memórias pelo princípio ou pelo fim, isto é, se poria em primeiro lugar o meu nascimento ou a minha morte. Suposto o uso vulgar seja começar pelo nascimento, duas considerações me levaram a adotar diferente método: a primeira é que eu não sou propriamente um autor defunto, mas um defunto autor, para quem a campa foi outro berço; a segunda é que o escrito ficaria assim mais galante e mais novo.
— 1 —
[1]
Moisés, que também contou a sua morte, não a pôs no introito, mas no cabo: diferença radical entre este livro e o Pentateuco.
— 2 —
MEMÓRIAS PÓSTUMAS | MACHADO DE ASSIS
Expirei às duas horas da tarde de uma sexta-feira do mês de agosto de 1869, na minha bela chácara de Catumbi. Tinha sessenta e quatro anos, rijos e prósperos, era solteiro, possuía cerca de trezentos contos e fui acompanhado ao cemitério por onze amigos. Onze amigos!
[2, 3]
(ASSIS, 1881, p. 5)
Verdade é que não houve cartas nem anúncios. Acresce que chovia — peneirava uma chuvinha miúda, triste e constante, tão constante e tão triste, que levou um daqueles fiéis da última hora a intercalar esta engenhosa ideia no discurso que proferiu à beira da minha cova: "Vós, que o conhecestes, meus senhores, vós podeis dizer comigo que a natureza parece estar chorando a perda do seu mais nobre filho!"`
      ),
      makeChapter(
        'mp-cap-2',
        2,
        'Capítulo II: O Emplasto',
        `Com efeito, a ideia de inventar um medicamento soberano, destinado a aliviar a melancólica humanidade, ocupou os últimos anos da minha vida.
— 3 —
Chamava-se Emplasto Brás Cubas. Era uma panaceia infalível, ou ao menos eu assim a concebera no meu laboratório mental. Não era a cura dos corpos que eu buscava com maior fervor; era a glória imortal.
[4]
A glória, essa deusa esquiva que os homens perseguem sem jamais a abraçar por inteiro!
— 4 —
(BOSI, 1999, p. 88)
Pois o emplasto foi a causa imediata do meu passamento. Peguei uma pneumonia enquanto supervisionava as primeiras experiências no laboratório e fechei os olhos para sempre sem ter visto a primeira caixa impressa com o meu retrato venerando.`
      ),
      makeChapter(
        'mp-cap-3',
        3,
        'Capítulo III: O Delírio',
        `De repente, vi-me montado sobre um hipopótamo colossal. O animal bateu as asas — pois tinha asas monstruosas — e arremessou-se através do espaço infinito.
— 5 —
[5]
Viajei através dos séculos. Vi os impérios erguerem-se e desabarem como castelos de areia soprados pela maré dos tempos. Vi a Natureza, mulher soberana e impassível, tecendo a vida com os fios da dor e da morte.
— 6 —
MEMÓRIAS PÓSTUMAS | MACHADO DE ASSIS
(ASSIS, 1881, p. 22)
— Por que me trazes aqui? — perguntei eu aterrado.
— Para que vejas a pequenez dos teus cuidados e o nada de tuas ambições — respondeu a grande figura com uma voz que parecia o eco de todas as montanhas da terra.`
      ),
    ],
  },
  {
    id: 'o-alienista',
    title: 'O Alienista',
    author: 'Machado de Assis',
    format: 'sample',
    coverAccentColor: '#78350f',
    description: 'A sátira brilhante da razão e da ciência: Dr. Simão Bacamarte funda a Casa Verde em Itaguaí e passa a internar toda a população.',
    currentChapterIndex: 0,
    chapters: [
      makeChapter(
        'oa-cap-1',
        1,
        'Capítulo I: De Como a Vila de Itaguaí Ganhou Uma Casa de Orates',
        `As crônicas da vila de Itaguaí dizem que no início do século XVIII o médico Simão Bacamarte, filho da nobreza da terra e o maior dos médicos do Brasil, de Portugal e das Espanhas, regressou a Itaguaí depois de muitos anos de estudos em Coimbra e Pádua.
— 1 —
[1, 2]
Tinha quarenta anos, era homem grave e metódico. Decidiu dedicar-se à psiquiatria, então chamada de cura das moléstias da alma. Para isso, fundou na vila uma casa de orates, a que deu o nome de Casa Verde.
— 2 —
O ALIENISTA | MACHADO DE ASSIS
A câmara de vereadores aplaudiu com fervor o ilustre médico e autorizou-o a recolher na instituição todos os loucos do termo da vila e das províncias circunvizinhas.
(ASSIS, 1882, p. 3)
Ninguém suspeitava que aquela casa se tornaria em breve o centro do maior tormento civil que a pacata localidade jamais presenciara.`
      ),
      makeChapter(
        'oa-cap-2',
        2,
        'Capítulo II: Torrente de Loucos',
        `Três dias depois de aberta a Casa Verde, começaram a chegar os primeiros alienados. Simão Bacamarte examinava-os a todos com severidade científica.
— 3 —
[3]
Não tardou, porém, que o médico começasse a ver sinais de insanidade em comportamentos que todos tinham por absolutamente normais.
— 4 —
(CHAUÍ, 1985, p. 104)
Um homem que vendia seus bens para ajudar os pobres foi internado por megalomania caritativa; um sujeito que não tolerava adulações foi recolhido por desvio maníaco de modéstia. Em poucos meses, quatro quintos da população de Itaguaí encontravam-se encarcerados sob a custódia do eminente cientista!`
      ),
    ],
  },
];
