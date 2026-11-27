/* Ezekiel – The Destroyer · Das Lager wächst
   In der Feste warten Gefangene und Verirrte (seltene Ereignisse in Nebenzweigen, Schatzkammern, nach Bossen).
   Wer befreit wird, zieht ins Lager vor der Feste – mit eigenem Platz, Zelt, Stand, Sprüchen und Freischaltungen
   (Seelensplitter), die in Stufen wachsen. Das Lager selbst wächst sichtbar mit dem Ruhm: Zelte → Feuerstellen und
   Lichterketten → Hütten → Palisade und zweite Ebene → Banner → Stein auf Stein. Dazu Trophäenbalken der besiegten
   Bosse, Gedenkstein (Läufe, Tode, Rekorde) und ein Brett für Steckbriefe (nemesis.js).
   Der Kern (Feuer, Ständer, Tor) bleibt, wo er ist – das Lager wächst nach Westen, der Weg zum Tor bleibt kurz.
   Speicher: Z.meta.lager (abwärtskompatibel, fehlt bei alten Ständen einfach).
   Schnittstelle für andere Module: Z.lager.station(id, opts), Z.lager.addUpgrade(res, id, def), Z.lager.wanted(list, opts),
   Z.lager.level(res, id), Z.lager.has(res), Z.lager.stage(), Z.lager.rescue(res), Z.lager.on(evt, fn).
   Farben: Glut, Gold, Rot, Violett, Grün, Erdtöne – kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, L = v => Z.L(v), inp = Z.input;
  const { limb, circ, poly, ell, glow } = Z.draw;
  const TAU = Math.PI * 2, PI = Math.PI;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ui = () => Z.ui || {};
  const lo = () => !!(Z.gq && Z.gq.level === 0);
  const notify = (html, ms, art, prio) => { const u = ui(); if (u.notify) { try { return u.notify(html, { prio: prio == null ? 2 : prio, art: art || "gold", dauer: ms }); } catch (_) {} } if (Z.toast) Z.toast(html, ms); };
  const useKey = () => (inp.device === "touch" ? "✋" : inp.label("use"));
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const strHash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; };

  /* ======================= BEWOHNER ======================= */
  /* plot: bekommt einen eigenen Platz im Westen. min: frühestes Gebiet (Stufe). bio: bevorzugte Gebiete. where: side | vault | boss | final.
     ups: Stufen 1…n (Seelensplitter). Die Zahlen stehen gesammelt in COST, damit das Balancing sie findet. */
  const COST = {
    edda: [70, 150, 260], quirin: [60, 150, 280], sigrun: [80, 170, 300], wendel: [60, 140, 260], jori: [70, 160, 280],
    lied: [80, 170, 300], alwin: [50, 150, 280], lotte: [60, 150, 260], mira: [200, 320]
  };
  Z.LAGER_COST = COST;
  const RES = {
    edda: {
      n: "Edda", r: ["Kartografin", "Cartographer"], plot: true, min: 0, bio: ["torhof", "keller", "hallen", "wehrgang"], where: "side", emb: "karte", col: "#c8902a",
      rumor: ["Eine Kundschafterin soll in den Nebengängen von Torhof, Kellern, Hallen oder Wehrgang festsitzen.", "A scout is said to be stuck in the side passages of the gate yard, cellars, halls or ramparts."],
      rescue: [["Endlich! Die Karte hab ich im Kopf, nur die Ketten nicht. Wir sehen uns im Lager, Gehörnter.", "Finally! I've got the map in my head, just not the chains. See you at camp, horned one."]],
      intro: [["Edda. Kundschafterin. Mira hat mir das Kartenzeichnen beigebracht – bevor sie ohne mich weitergegangen ist.", "Edda. Scout. Mira taught me to draw maps – before she went on without me."], ["Die Feste verschiebt sich, ja. Aber nicht alles. Eingänge bleiben Eingänge. Ich zeichne dir, was bleibt.", "The keep shifts, yes. But not everything. Entrances stay entrances. I'll draw you what stays."]],
      idle: [["Wenn du schon stirbst, dann bitte an einer Stelle, die ich noch nicht kenne.", "If you must die, do it somewhere I haven't mapped yet."], ["Barradin will eine Karte mit „Hier war Barradin“ an jeder Ecke. Ich hab abgelehnt.", "Barradin wants a map with 'Barradin was here' on every corner. I declined."], ["Rex hat auf meine Karte gesabbert. Jetzt ist der Keller nass. Auf der Karte.", "Rex drooled on my map. Now the cellar is wet. On the map."], ["Geheimgänge riechen anders. Nach kaltem Stein und schlechten Ideen.", "Secret passages smell different. Of cold stone and bad ideas."]],
      buy: [["Ein Strich mehr – und du verläufst dich einmal weniger.", "One more line – and you get lost one time less."]],
      ups: [
        { n: ["Skizze des Eingangs", "Sketch of the entrance"], d: ["Beim Betreten eines Gebiets sind die Kammern rund um den Eingang und der Ausgangsraum aufgedeckt.", "When you enter an area, the chambers around the entrance and the exit room are revealed."] },
        { n: ["Geheimniszeichen", "Secret marks"], d: ["Geheimkammern, Schatzkammern, Schlüssel und Prüfungen sind auf der Minikarte markiert.", "Secret rooms, treasure chambers, keys and trials are marked on the minimap."] },
        { n: ["Miras Linien", "Mira's lines"], d: ["Auch Tagebuchseiten, Runenfragmente und Verirrte stehen auf der Karte – und der aufgedeckte Eingangsbereich ist doppelt so groß.", "Diary pages, rune fragments and lost souls appear on the map too – and the revealed entrance area is twice as large."] }
      ]
    },
    quirin: {
      n: "Quirin", r: ["Alchemist", "Alchemist"], plot: true, min: 1, bio: ["keller", "verlies", "hallen"], where: "side", emb: "flasche", col: "#7a9a3a",
      rumor: ["In den Kellern und im Verlies blubbert es verdächtig. Jemand braut dort – oder wird gebraut.", "Something bubbles suspiciously in the cellars and the dungeon. Someone is brewing down there – or being brewed."],
      rescue: [["Vorsicht, nicht an die Phiolen stoßen – die linke explodiert. Die rechte auch. Ich komme mit ins Lager!", "Careful, don't knock the vials – the left one explodes. So does the right. I'm coming to camp!"]],
      intro: [["Quirin, Alchemist. Ich mache aus Pilzen, Rattenschwänzen und Hoffnung etwas, das man trinken kann. Meistens.", "Quirin, alchemist. I turn mushrooms, rat tails and hope into something drinkable. Mostly."], ["Bring mir Splitter, und deine Tränke werden … weniger enttäuschend.", "Bring me shards and your potions will become… less disappointing."]],
      idle: [["Nein, Barradin, das raucht man nicht. – Na gut, das da vielleicht.", "No, Barradin, you don't smoke that. – Well, maybe that one."], ["Echo hat gefragt, ob man Gold trinken kann. Man kann. Einmal.", "Echo asked if you can drink gold. You can. Once."], ["Rot heißt Heilung. Lila heißt … finden wir heraus.", "Red means healing. Purple means… we'll find out."], ["Der Geruch ist Absicht. Glaube ich.", "The smell is intentional. I think."]],
      buy: [["Probier mal. Nein, nicht jetzt. Im Notfall.", "Try it. No, not now. In an emergency."]],
      ups: [
        { n: ["Kräftiger Sud", "Hearty brew"], d: ["Heiltränke heilen zusätzlich 15 % deines Lebens.", "Healing potions heal an extra 15% of your health."] },
        { n: ["Nachglühen", "Afterglow"], d: ["Nach dem Trinken 4 Sekunden lang 35 % weniger Schaden.", "For 4 seconds after drinking you take 35% less damage."] },
        { n: ["Doppelte Destille", "Double distillate"], d: ["+1 Heiltrank in jedem Lauf.", "+1 healing potion in every run."] }
      ]
    },
    sigrun: {
      n: "Sigrun", r: ["Runenleserin", "Rune reader"], plot: true, min: 2, bio: ["verlies", "glocken", "schmiede", "zinnen"], where: "vault", emb: "rune", col: "#a04a8a",
      rumor: ["Wer Schatzkammern öffnet, hört manchmal Runen flüstern. Eine Runenleserin soll dort eingesperrt sein – ab dem Verlies abwärts.", "Those who open treasure chambers sometimes hear runes whispering. A rune reader is said to be locked away there – from the dungeon downwards."],
      rescue: [["Die Runen sagten, ein Gehörnter kommt. Sie sagten nicht, dass er so lange braucht.", "The runes said a horned one would come. They didn't say he'd take this long."]],
      intro: [["Sigrun. Ich lese Runen – und ich schreibe sie. In Stahl, wenn es sein muss.", "Sigrun. I read runes – and I write them. In steel, if need be."], ["Nimm eine Klinge vom Ständer, und ich gebe ihr einen Namen. Einen gefährlichen.", "Take a blade from the rack and I'll give it a name. A dangerous one."]],
      idle: [["Die Steine sagen, heute stirbst du nicht. Die Steine lügen manchmal.", "The stones say you won't die today. The stones lie sometimes."], ["Nundro schmiedet Stahl. Ich schmiede, was der Stahl will.", "Nundro forges steel. I forge what the steel wants."], ["Barradin wollte eine Rune für bessere Reime. So etwas gibt es nicht. Leider.", "Barradin wanted a rune for better rhymes. No such thing exists. Sadly."], ["Jede Rune ist ein Faden. Und Fäden kennen wir hier ja.", "Every rune is a thread. And we know about threads here."]],
      buy: [["Die Steine nicken. Das tun sie selten.", "The stones nod. They rarely do."]],
      ups: [
        { n: ["Gravur vor dem Aufbruch", "Engraving before departure"], d: ["Einmal pro Lagerbesuch graviert Sigrun eine von zwei Runen in eine Waffe aus deiner Hand.", "Once per camp visit Sigrun engraves one of two runes into a weapon in your hand."] },
        { n: ["Runenblick", "Rune sight"], d: ["Drei Runen zur Wahl – und sie graviert auch um: Eine vorhandene Rune wird ersetzt.", "Three runes to choose from – and she re-engraves: an existing rune is replaced."] },
        { n: ["Doppelgravur", "Double engraving"], d: ["Zwei Gravuren pro Lagerbesuch.", "Two engravings per camp visit."] }
      ]
    },
    wendel: {
      n: "Wendel", r: ["Bestienmeister", "Beastmaster"], plot: true, min: 1, bio: ["wehrgang", "hafen", "glocken"], where: "side", emb: "pfote", col: "#8a5a2a",
      rumor: ["Auf Wehrgang, Hafen und im Glockenturm heult es nachts. Ein Mann, der mit Tieren spricht, wartet dort auf jemanden, der zurückredet.", "Something howls at night on the ramparts, the harbour and the bell tower. A man who talks to animals waits there for someone to talk back."],
      rescue: [["Meine Hunde sind weggelaufen. Kluge Hunde. Aber du hast einen, der bleibt, hab ich gehört?", "My dogs ran off. Clever dogs. But I hear you've got one that stays?"]],
      intro: [["Wendel. Ich bringe Tieren Dinge bei. Und manchmal bringen sie mir welche bei.", "Wendel. I teach animals things. And sometimes they teach me."], ["Der Hund da – Rex? Der ist klüger als die Hälfte von euch. Zusammen.", "That dog – Rex? He's smarter than half of you. Combined."]],
      idle: [["Friedrich und ich sind uns einig: Rex hat immer recht.", "Friedrich and I agree: Rex is always right."], ["Sitz! – Nicht du, Barradin.", "Sit! – Not you, Barradin."], ["Ein Hund vergisst nie, wer ihm das Stöckchen geworfen hat. Wirf öfter.", "A dog never forgets who threw him the stick. Throw more often."], ["Rex hat heute einen Goblinschuh gebracht. Ohne Goblin. Gutes Zeichen.", "Rex brought a goblin shoe today. Without the goblin. Good sign."]],
      buy: [["Rex hat's verstanden. Du noch nicht, aber Rex.", "Rex got it. You haven't yet, but Rex has."]],
      ups: [
        { n: ["Sitz! Platz! Fass!", "Sit! Stay! Bite!"], d: ["Rex! beißt 50 % stärker und bleibt 4 Sekunden länger. Im Lager springt er durch den Reifen.", "Rex! bites 50% harder and stays 4 seconds longer. At camp he jumps through the hoop."] },
        { n: ["Such!", "Seek!"], d: ["In jedem Gebiet gräbt Rex am Eingang etwas aus: Gold, Essen oder Schmiedeglut.", "In every area Rex digs something up at the entrance: gold, food or forge embers."] },
        { n: ["Treuer Freund", "Loyal friend"], d: ["Fällt dein Leben unter 30 %, kommt Rex zu Hilfe – einmal pro Gebiet.", "When your health drops below 30%, Rex comes to help – once per area."] }
      ]
    },
    jori: {
      n: "Jori", r: ["Schmiedelehrling", "Smith's apprentice"], plot: false, min: 1, bio: ["hallen", "glocken", "schmiede"], where: "side", emb: "hammer", col: "#c86a2a",
      rumor: ["Ein Schmiedelehrling ist Nundro davongelaufen – direkt in die Feste. In den Hallen, im Glockenturm und in der Runenschmiede hört man ihn hämmern.", "A smith's apprentice ran away from Nundro – straight into the keep. He's been heard hammering in the halls, the bell tower and the rune forge."],
      rescue: [["Sag Nundro nichts! … Doch, sag's ihm. Ich will heim.", "Don't tell Nundro! … No, tell him. I want to go home."]],
      intro: [["Jori. Nundros Lehrling. Wieder. Er sagt, ich soll erst mal den Ständer machen.", "Jori. Nundro's apprentice. Again. He says I should start with the rack."], ["Alles, was du in der Feste schon gefunden hast, kann ich nachschmieden. Fast. Ungefähr.", "Anything you've found in the keep, I can copy. Almost. Roughly."]],
      idle: [["Nundro sagt, mein Schliff ist schief. Der Schleifstein ist schief!", "Nundro says my edge is crooked. The grindstone is crooked!"], ["Nimm die da. Nein, die. Die ist schärfer. Glaub ich.", "Take that one. No, that one. That one's sharper. I think."], ["Ich hab einen Hammer nach Barradin geworfen. Aus Versehen. Zweimal.", "I threw a hammer at Barradin. By accident. Twice."]],
      buy: [["Hängt schon am Ständer! … Ich mein, gleich.", "It's already on the rack! … I mean, in a moment."]],
      ups: [
        { n: ["Fundstück", "Found piece"], d: ["Ein zusätzliches Stück am Waffenständer – zufällig aus Waffen, die du schon gefunden hast.", "One extra piece on the weapon rack – chosen at random from weapons you've already found."] },
        { n: ["Zweites Fundstück", "Second piece"], d: ["Zwei zusätzliche Fundstücke am Ständer.", "Two extra found pieces on the rack."] },
        { n: ["Lehrlingsgravur", "Apprentice's engraving"], d: ["Die Fundstücke am Ständer tragen eine Rune.", "The found pieces on the rack carry a rune."] }
      ]
    },
    lied: {
      n: "Barradin", r: ["Bühne", "Stage"], obj: ["Barradins Liederbuch", "Barradin's songbook"], plot: true, min: 1, bio: ["hallen", "glocken", "hafen", "zinnen"], where: "vault", emb: "note", col: "#8a3a8a",
      rumor: ["Barradin hat sein Liederbuch verwettet – an einen Kobold, der es in eine Schatzkammer geschleppt hat. Barradin bestreitet das.", "Barradin bet away his songbook – to an imp who dragged it into a treasure chamber. Barradin denies this."],
      rescue: [["Ein ledernes Liederbuch voller Kritzeleien. Seite eins: „Eigentum von Barradin. Finger weg, Ezekiel.“", "A leather songbook full of scribbles. Page one: 'Property of Barradin. Hands off, Ezekiel.'"]],
      intro: [["Mein Liederbuch! Ich hab es nie verloren. Ich habe es … der Feste geliehen.", "My songbook! I never lost it. I… lent it to the keep."], ["Bevor du losziehst: ein Lied. Es hilft. Wissenschaftlich erwiesen. Von mir.", "Before you head out: a song. It helps. Scientifically proven. By me."]],
      idle: [["Dieses Lied hat drei Strophen, und keine endet gut für den Gegner.", "This song has three verses, and none of them ends well for the enemy."], ["Nein, ich trinke nicht. Ich rauche. Das ist etwas völlig anderes.", "No, I don't drink. I smoke. That's something else entirely."], ["Ein Reim auf „Ezekiel“? „Schädelspiel“. Ich arbeite dran.", "A rhyme for 'Ezekiel'? 'Steel appeal'. I'm working on it."], ["Applaus ist auch eine Währung, Echo.", "Applause is a currency too, Echo."]],
      buy: [["Hörst du das? Das ist der Klang von Ruhm. Und von meiner Laute.", "Hear that? That's the sound of glory. And of my lute."]],
      ups: [
        { n: ["Ein Lied für den Weg", "A song for the road"], d: ["Vor jedem Lauf ein Lied wählen (zwei zur Wahl) – sein Segen begleitet dich den ganzen Lauf.", "Choose a song before every run (two to choose from) – its blessing stays with you for the whole run."] },
        { n: ["Zugabe!", "Encore!"], d: ["Drei Lieder zur Wahl.", "Three songs to choose from."] },
        { n: ["Refrain", "Chorus"], d: ["In jedem Durchgang heilt dich der Refrain um 20 %.", "In every passage the chorus heals you by 20%."] }
      ]
    },
    alwin: {
      n: "Alwin", r: ["Chronist", "Chronicler"], plot: true, min: 3, bio: [], where: "boss", emb: "buch", col: "#a07a3a",
      rumor: ["Nach großen Kämpfen sitzt manchmal ein alter Mann zwischen den Trümmern und schreibt mit. Er soll den Bossen gefolgt sein, um ihre Geschichten aufzuschreiben.", "After great battles an old man sometimes sits among the rubble, taking notes. They say he followed the bosses to write down their stories."],
      rescue: [["Nicht so schnell! Ich war gerade bei der Stelle, wo du gewinnst. Schön. Ich komme mit.", "Not so fast! I was just at the part where you win. Lovely. I'll come along."]],
      intro: [["Alwin, Chronist. Ich schreibe auf, was passiert. Bei dir ist das meistens: Du stirbst, du stehst auf.", "Alwin, chronicler. I write down what happens. With you that's usually: you die, you get up."], ["Wissen ist Schärfe. Wer weiß, wie ein Gegner fällt, lässt ihn schneller fallen.", "Knowledge is an edge. Whoever knows how an enemy falls makes it fall faster."]],
      idle: [["Ich habe ein Kapitel „Rex frisst einen Stiefel“. Es ist mein bestes.", "I have a chapter 'Rex eats a boot'. It's my best."], ["Barradin will, dass ich seine Lieder abschreibe. Ich will, dass er sie nicht singt.", "Barradin wants me to copy out his songs. I want him not to sing them."], ["Echo hat mein Tintenfass gegen Gold getauscht. Ich habe kein Gold bekommen.", "Echo traded my inkwell for gold. I got no gold."], ["Jeder Tod ist eine Fußnote. Du hast viele Fußnoten.", "Every death is a footnote. You have many footnotes."]],
      buy: [["Notiert. Mit Unterstreichung.", "Noted. Underlined."]],
      ups: [
        { n: ["Die Chronik", "The chronicle"], d: ["Am Gedenkstein stehen deine Rekorde. Und: +8 % Schaden gegen Gegnerarten, die du schon 15-mal erschlagen hast.", "Your records appear on the memorial stone. And: +8% damage against enemy types you've slain 15 times."] },
        { n: ["Bestiarium", "Bestiary"], d: ["+10 % gegen Arten mit 30 Kills, +15 % ab 100 – und +8 % gegen Bosse, die du schon besiegt hast.", "+10% vs types with 30 kills, +15% from 100 – and +8% vs bosses you've already defeated."] },
        { n: ["Heldenepos", "Heroic epic"], d: ["Jeder neue Rekord bringt am Ende des Laufs 30 Seelensplitter.", "Every new record grants 30 soul shards at the end of the run."] }
      ]
    },
    lotte: {
      n: "Lotte", r: ["Händlerin", "Trader"], plot: true, min: 0, bio: ["torhof", "hallen", "hafen"], where: "side", emb: "muenze", col: "#c8402a",
      rumor: ["Eine Händlerin hat sich mit ihrem Karren in Torhof, Hallen oder Hafen verfahren. Sie verkauft angeblich sogar in Ketten.", "A trader got lost with her cart in the gate yard, the halls or the harbour. She supposedly still sells, even in chains."],
      rescue: [["Gerettet! Was schulde ich dir? – Nichts? Merkwürdiger Kunde. Bis gleich im Lager!", "Saved! What do I owe you? – Nothing? Strange customer. See you at camp!"]],
      intro: [["Lotte. Ich kaufe billig und verkaufe ehrlich. Meistens in dieser Reihenfolge.", "Lotte. I buy cheap and sell honest. Usually in that order."], ["Splitter nehme ich auch. Was ich damit mache? Geschäftsgeheimnis.", "I take shards too. What I do with them? Trade secret."]],
      idle: [["Echo bietet mir ständig „Steine von unschätzbarem Wert“ an.", "Echo keeps offering me 'stones of inestimable value'."], ["Rabatt? Für den Zerstörer? Ich bin doch nicht lebensmüde.", "A discount? For the Destroyer? I'm not tired of living."], ["Frisch aus einer Truhe, die niemandem gehört hat!", "Fresh from a chest that belonged to nobody!"], ["Barradin zahlt in Liedern. Ich nehme keine mehr an.", "Barradin pays in songs. I don't accept them any more."]],
      buy: [["Gutes Geschäft. Für mich. Für dich auch, irgendwie.", "Good deal. For me. For you too, somehow."]],
      ups: [
        { n: ["Reisekasse", "Travel purse"], d: ["Jeder Lauf beginnt mit 70 Gold.", "Every run starts with 70 gold."] },
        { n: ["Lottes Ware", "Lotte's wares"], d: ["Bei jedem Lagerbesuch bietet sie eine Waffe oder Fähigkeit aus deinem Fundbuch an – gegen Splitter.", "On every camp visit she offers a weapon or skill from your ledger – for shards."] },
        { n: ["Stammkundschaft", "Regular customer"], d: ["120 Gold Reisekasse und zwei Waren zur Auswahl.", "120 gold travel purse and two wares to choose from."] }
      ]
    },
    mira: {
      n: "Mira", r: ["Kartenzeichnerin", "Mapmaker"], plot: true, min: 6, bio: [], where: "final", emb: "faden", col: "#c03a5a",
      rumor: ["Miras Spur endet bei der Weberin. Wer alle Seiten ihres Tagebuchs kennt, findet sie vielleicht nach einem der letzten Kämpfe – in Seide gewickelt.", "Mira's trail ends at the Weaver. Whoever knows every page of her diary may find her after one of the final battles – wrapped in silk."],
      rescue: [["… Ezekiel? Der rote Mann mit Hörnern. Ich hab geschrieben, dass die Karte nicht stimmt. Du bist trotzdem gekommen.", "…Ezekiel? The red man with horns. I wrote that the map was wrong. You came anyway."]],
      intro: [["Ich habe alles aufgeschrieben, weil ich dachte, niemand würde es je hören. Jetzt erzähle ich es dir am Feuer. Das ist besser.", "I wrote everything down because I thought no one would ever hear it. Now I'll tell you by the fire. That's better."], ["Grete war die Mutigste. Holm betet noch immer. Und Tavik … lacht irgendwo. Für jeden habe ich einen Faden behalten.", "Grete was the bravest. Holm still prays. And Tavik… laughs somewhere. I kept a thread for each of them."], ["Nimm einen davon mit. Wenn du fällst, zieht er dich zurück.", "Take one of them with you. When you fall, it pulls you back."]],
      idle: [["Die Karte stimmt immer noch nicht. Aber jetzt weiß ich, warum.", "The map is still wrong. But now I know why."], ["Edda zeichnet besser als ich. Sag ihr das nicht.", "Edda draws better than I do. Don't tell her."], ["Barradin hat aus meinem Tagebuch eine Ballade gemacht. Sie ist … laut.", "Barradin turned my diary into a ballad. It's… loud."], ["Manchmal höre ich die Glocken noch. Dann zähle ich, wer am Feuer sitzt.", "Sometimes I still hear the bells. Then I count who's sitting by the fire."]],
      buy: [["Halt ihn fest. Er hält dich auch.", "Hold on to it. It holds on to you, too."]],
      ups: [
        { n: ["Miras Faden", "Mira's thread"], d: ["Einmal pro Lauf: Statt zu fallen, stehst du mit 40 % Leben wieder auf.", "Once per run: instead of falling, you rise again with 40% health."] },
        { n: ["Gretes Mut", "Grete's courage"], d: ["Der Faden zieht stärker: 70 % Leben, und Gegner in der Nähe werden zurückgeschleudert.", "The thread pulls harder: 70% health, and nearby enemies are hurled back."] }
      ]
    }
  };
  Z.LAGER_RES = RES;
  const MIRA_STORY = ["Miras letzte Seite – nachgetragen", "Mira's last page – written later",
    "Ich dachte, ich schreibe für niemanden. Ich saß in Seide, in einem Netz über dem Sturm, und zählte die Glocken. Dann wurde es still, und ein roter Mann mit Hörnern schnitt die Fäden, nicht die Menschen. Genau, wie ich es aufgeschrieben hatte.<br><br>Grete, Holm, Tavik – ich habe für jeden einen Faden behalten. Sie hängen jetzt über meinem Tisch im Lager. Barradin sagt, das sieht aus wie Wäsche. Barradin hat keine Ahnung von Trauer, aber er spielt gut genug, dass man es vergisst.<br><br>Die Karte stimmt immer noch nicht. Aber die Feste ist nicht mehr der Ort, an dem man allein ist. Sie ist der Ort, aus dem man zurückkommt. – Mira",
    "I thought I was writing for no one. I sat in silk, in a web above the storm, counting the bells. Then it went quiet, and a red man with horns cut the threads, not the people. Just as I had written it down.<br><br>Grete, Holm, Tavik – I kept a thread for each of them. They hang above my table at camp now. Barradin says it looks like laundry. Barradin knows nothing about grief, but he plays well enough that you forget it.<br><br>The map is still wrong. But the keep is no longer the place where you are alone. It is the place you come back from. – Mira"];

  /* ======================= SPEICHER ======================= */
  let lmRef = null;
  function LM() {
    const M = Z.meta; let m = M.lager;
    if (m && m === lmRef) return m;
    if (!m || typeof m !== "object" || Array.isArray(m)) m = M.lager = {};
    if (!m.res || typeof m.res !== "object" || Array.isArray(m.res)) m.res = {};
    for (const id in m.res) { const r = m.res[id]; if (!r || typeof r !== "object") m.res[id] = { lvl: 0 }; else if (!Number.isFinite(r.lvl)) r.lvl = 0; }
    if (!Array.isArray(m.order)) m.order = [];
    m.order = m.order.filter((id, i, a) => typeof id === "string" && m.res[id] && a.indexOf(id) === i);
    for (const id in m.res) if (!m.order.includes(id)) m.order.push(id);
    if (!m.up || typeof m.up !== "object" || Array.isArray(m.up)) m.up = {};
    if (!m.rek || typeof m.rek !== "object" || Array.isArray(m.rek)) m.rek = {};
    for (const k of ["pity", "stageSeen", "visits"]) if (!Number.isFinite(m[k])) m[k] = 0;
    lmRef = m; return m;
  }
  const has = id => !!(RES[id] && LM().res[id]);
  const lvl = id => (has(id) ? clamp(LM().res[id].lvl | 0, 0, RES[id].ups.length) : 0);
  const save = () => Z.saveMeta && Z.saveMeta();

  /* ======================= RUHM & STUFEN ======================= */
  const STAGES = [
    { n: ["Zeltlager", "Tent camp"], d: ["Ein paar Zelte, ein Feuer, ein Hund.", "A few tents, a fire, a dog."], at: 0 },
    { n: ["Feuerstellen", "Fire pits"], d: ["Mehr Feuer, mehr Licht, mehr Leute, die nicht schlafen können.", "More fire, more light, more people who can't sleep."], at: 5 },
    { n: ["Hütten", "Huts"], d: ["Wer bleibt, baut sich ein Dach.", "Those who stay build a roof."], at: 12 },
    { n: ["Palisade", "Palisade"], d: ["Spitze Pfähle und eine zweite Ebene. Jetzt schaut das Lager zurück.", "Sharp stakes and a second level. Now the camp stares back."], at: 22 },
    { n: ["Banner", "Banners"], d: ["Jede Fahne ein Name. Die Feste soll wissen, wer hier wohnt.", "Every flag a name. The keep shall know who lives here."], at: 34 },
    { n: ["Die Feste vor der Feste", "The Keep before the Keep"], d: ["Stein auf Stein. Aus dem Lager ist ein Ort geworden.", "Stone upon stone. The camp has become a place."], at: 48 }
  ];
  Z.LAGER_STAGES = STAGES;
  function bossIds() { return Object.keys(Z.BOSSDEF || {}).filter(id => id !== "nezna" && !(Z.BOSSDEF[id].minion)); }
  function trophies() { const b = Z.meta.bosses || {}; return bossIds().filter(id => b[id] && b[id].won > 0); }
  function ruhm() {
    const m = LM(), M = Z.meta; let r = 0;
    for (const id in m.res) if (RES[id]) r += 3 + 2 * lvl(id);
    r += trophies().length;
    r += 3 * Object.keys(M.endings || {}).length;
    r += Math.min(10, Math.floor((M.runs || 0) / 4));
    for (const k in m.up) r += Math.min(3, m.up[k] | 0);
    return r;
  }
  function stage() { const r = ruhm(); let s = 0; for (let i = 0; i < STAGES.length; i++) if (r >= STAGES[i].at) s = i; return s; }
  const plotted = () => LM().order.filter(id => RES[id] && RES[id].plot);

  /* ======================= GRUNDRISS ======================= */
  /* Bodenplätze (je 10 Kacheln) wachsen nach Westen, ein leerer Bauplatz zeigt, dass noch jemand fehlt.
     Ab dem sechsten Bewohner (oder ab Stufe Palisade) entsteht eine Galerie als zweite Ebene. */
  const GROUND_MAX = 5, PLOT_W = 10;
  Z.hubPlan = function () {
    const n = plotted().length, st = stage();
    const left = Object.keys(RES).some(id => RES[id].plot && !has(id));
    const g = Math.min(GROUND_MAX, n + (left ? 1 : 0)), ext = g ? 4 + PLOT_W * g : 0;
    return { ext, terrace: n >= GROUND_MAX || (st >= 3 && ext >= 32), stage: st, ground: g, n };
  };
  function layout(lv) {
    const ox = lv.ox || 0, ids = plotted(), out = [];
    const nG = Math.min(GROUND_MAX, Math.max(0, Math.round((ox - 4) / PLOT_W)));
    const ground = [];
    for (let i = 0; i < nG; i++) ground.push({ x0: ox - PLOT_W * (i + 1), w: PLOT_W, gy: 11, lvl: 0 });
    const terr = [];
    if (lv.terrace) {
      const t = lv.terrace, len = t.x1 - t.x0 - 1, w = Math.floor(len / 4);
      for (let j = 0; j < 4; j++) terr.push({ x0: t.x1 - w * (j + 1), w, gy: t.y - 1, lvl: 1 });
    }
    const slots = ground.concat(terr);
    ids.forEach((id, i) => { if (slots[i]) out.push(Object.assign({ id }, slots[i])); });
    const free = Object.keys(RES).some(id => RES[id].plot && !has(id)) ? slots[ids.length] : null;
    if (free) out.push(Object.assign({ id: null, bau: true }, free));
    for (const p of out) { p.cx = p.x0 + p.w / 2; p.fx = p.x0 + p.w * 0.74; }
    return out;
  }

  /* ======================= LAGER AUFBAUEN ======================= */
  let camp = null; /* Zustand des aktuellen Lagerbesuchs */
  const hub0 = Z.genHub;
  Z.genHub = function () {
    const lv = hub0.apply(this, arguments);
    try { decorate(lv); } catch (err) { console.error(err); }
    return lv;
  };
  function decorate(lv) {
    const ox = lv.ox || 0, st = stage(), X = x => x + ox;
    lv.lstage = st; lv.plots = layout(lv);
    /* freie Galerie-Abschnitte: Vorräte, Wäscheleine, Kräutertöpfe – damit die zweite Ebene nicht leer wirkt */
    lv.terrFree = [];
    if (lv.terrace) {
      const t = lv.terrace, w = Math.floor((t.x1 - t.x0 - 1) / 4);
      for (let j = 0; j < 4; j++) { const x0 = t.x1 - w * (j + 1); if (!lv.plots.some(p => p.lvl && p.x0 === x0)) lv.terrFree.push({ x0, w, gy: t.y - 1, k: j }); }
    }
    /* Barradin zieht auf seine Bühne */
    const bp = lv.plots.find(p => p.id === "lied");
    if (bp) { const b = lv.props.find(p => p.id === "B"); if (b) { b.x = Math.round(bp.x0 + bp.w * 0.5); b.y = bp.gy; } }
    /* Licht: Feuer und Laternen bei den Plätzen */
    for (const p of lv.plots) {
      if (p.bau) continue;
      if (st >= 2) lv.lights.push({ kind: "lantern", x: Math.round(p.x0 + 2), y: p.gy - 2 });
      else lv.lights.push({ kind: "candle", x: Math.round(p.x0 + 3), y: p.gy });
    }
    if (st >= 1) for (const p of lv.plots) if (!p.lvl && p.x0 > 1) lv.lights.push({ kind: "brazier", x: p.x0, y: p.gy });
    if (st >= 1) lv.lights.push({ kind: "brazier", x: X(5), y: 11 });
    if (st >= 3 && ox >= 12) lv.lights.push({ kind: "torch", x: 2, y: 6 });
    if (lv.terrace && st >= 2) lv.lights.push({ kind: "lantern", x: Math.round((lv.terrace.x0 + lv.terrace.x1) / 2), y: lv.terrace.y - 3 });
    /* Ab den Hütten wohnt auch Friedrich unter einem Dach: das große Zelt im Kern wird zur Hütte */
    if (st >= 2) { const n0 = lv.decor.length; lv.decor = lv.decor.filter(d => !(d.kind === "tent" && !d.s && d.x === X(30))); lv.coreHut = lv.decor.length < n0 ? X(30) : null; }
    /* Kern-Zusätze (nach Westen verschoben wie der Rest des Kerns) */
    lv.lcore = { stone: X(40.6), board: X(46.9), beam: [X(53.2), X(64.6)], jori: X(49.2), sign: ox >= 14 ? 2.4 : null, signT: lv.terrace ? lv.terrace.x0 + 6 : null };
  }

  /* ======================= FIGUREN: gemeinsamer Körper ======================= */
  /* Füße bei (0,0), Kopf bei etwa −23. Flächig wie in figuren.js, Schattierung durch dunklere Teilflächen. */
  function human(c, t, o) {
    const br = Math.sin(t * 2 + (o.ph || 0)) * 0.4, s = o.stoop || 0;
    c.save(); c.globalAlpha *= 0.25; ell(c, 0, 0.4, 6, 1.3, "#000"); c.restore();
    if (o.robe) {
      poly(c, [-5.4, 0, 5.4, 0, 4.4, -12, -4.4, -12], o.robe); poly(c, [-5.4, 0, -1.8, 0, -1.8, -12, -4.4, -12], o.robeD || o.robe);
      ell(c, -2.4, -0.2, 2, 0.8, o.boot || "#2a1a14"); ell(c, 2.8, -0.2, 2, 0.8, o.boot || "#2a1a14");
    } else {
      const k = o.walk ? Math.sin(o.walk * PI) : 0;
      limb(c, -2, -10, -2.2 - k * 2.4, 0, 2.8, o.legs || "#3a2a20"); limb(c, 2, -10, 2.4 + k * 2.4, 0, 2.8, o.legsD || o.legs || "#4a3424");
      ell(c, -2.4 - k * 2.4, -0.2, 2, 0.9, o.boot || "#2a1a14"); ell(c, 3 + k * 2.4, -0.2, 2, 0.9, o.boot || "#2a1a14");
    }
    if (o.back) o.back(c, br);
    const w = o.wide || 0;
    poly(c, [-4.5 - w, -9, 4.5 + w, -9, 4 + w, -20 - br, -4 - w, -20 - br], o.coat);
    poly(c, [-4.5 - w, -9, -1.4, -9, -1.6, -20 - br, -4 - w, -20 - br], o.coatD || o.coat);
    if (o.hem) poly(c, [-4.7 - w, -9.4, 4.7 + w, -9.4, 5 + w, -6, -5 - w, -6], o.hem);
    if (o.belt) limb(c, -4 - w, -12, 4 + w, -12, 1, o.belt);
    if (o.torso) o.torso(c, br);
    c.save(); c.translate(0.5 + s, -23 - br); c.rotate(o.tilt || 0);
    circ(c, 0, 0, o.headR || 3.2, o.skin || "#e0b890"); poly(c, [2.6, -0.4, 3.8, 0.4, 2.8, 0.9], o.skin || "#e0b890");
    c.fillStyle = "#2a1a14"; c.fillRect(1.6, -0.7, 1, 0.9);
    if (o.head) o.head(c);
    c.restore();
    if (o.arms) o.arms(c, br);
  }
  const DRAW = {};
  /* Edda: Kundschafterin mit Lederjacke, ockerfarbenem Schal und Federkappe – zeichnet mit dem Stift */
  DRAW.edda = (c, t, x, y, f, cap) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    const sk = Math.sin(t * 6) * 0.8;
    human(c, t, { ph: 1, legs: "#4a3a28", coat: "#6a4a2a", coatD: "#4e341c", hem: "#5a3e22", belt: "#2a1a10", skin: "#e8c0a0", tilt: cap ? 0.35 : 0.05,
      head: c2 => { poly(c2, [-3.6, 1.6, -3.4, -2.8, 2.4, -3.6, 3.2, -1.2, -0.4, -2, -2, 4], "#a0522d"); limb(c2, -3.2, 1, -4.6, 5, 1.4, "#a0522d");
        poly(c2, [-3.8, -2.4, 3.6, -2.6, 2.4, -5, -2.8, -5.2], "#3a5a2a"); limb(c2, -3.8, -2.4, 4.4, -2.6, 0.8, "#2a4220"); limb(c2, -2, -5, -6, -9 + Math.sin(t * 2) * 0.4, 0.7, "#c8902a"); },
      torso: (c2, br) => { poly(c2, [-4, -20 - br, 4, -20 - br, 3, -16, -3, -16], "#c8902a"); limb(c2, 2, -17, 3, -12, 1.2, "#c8902a"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 1.8, "#6a4a2a"); limb(c2, 2, -19, 1.6, -12, 1.8, "#6a4a2a"); return; }
        limb(c2, -2, -19 - br, -5, -14, 1.8, "#5a3e22"); circ(c2, -5.2, -13.8, 1, "#e8c0a0");
        limb(c2, 1.4, -19 - br, 5.2, -14.2 + sk * 0.3, 1.8, "#6a4a2a"); circ(c2, 5.4, -14 + sk * 0.3, 1, "#e8c0a0");
        limb(c2, 5.4, -14 + sk * 0.3, 7.6, -16.6 + sk * 0.3, 0.5, "#e8dcc0");
      } });
    c.restore();
  };
  /* Quirin: Alchemist in olivgrüner Robe, Glatze, weißer Bart, Kupferbrille auf der Stirn – rührt im Kessel */
  DRAW.quirin = (c, t, x, y, f, cap) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    const st = cap ? 0 : Math.sin(t * 2.4);
    human(c, t, { ph: 2, robe: "#4a5a2a", robeD: "#36421e", coat: "#4a5a2a", coatD: "#36421e", belt: "#8a6a2a", skin: "#e0b090", stoop: 0.8, tilt: cap ? 0.4 : 0.1,
      torso: (c2, br) => { poly(c2, [-3, -19 - br, 3, -19 - br, 2.6, -9, -2.6, -9], "#c8b890"); for (let i = 0; i < 3; i++) circ(c2, -1 + i, -13 + i * 0.4, 0.5, ["#e0545a", "#9ad04a", "#c890ff"][i]); },
      head: c2 => { poly(c2, [-0.6, 1.4, 3.4, 1.2, 2.6, 6, 0.6, 7, -1.6, 4], "#e8e0d0"); poly(c2, [-3.2, 0.4, -3.4, -1.6, -2.2, -1.2], "#d8d0c0");
        limb(c2, -3.2, -1.8, 3.2, -1.8, 1, "#6a4a2a"); circ(c2, 0.4, -2, 1.2, "#c87a3a"); circ(c2, 2.6, -2, 1.2, "#c87a3a"); circ(c2, 0.4, -2, 0.6, "#ffd890"); circ(c2, 2.6, -2, 0.6, "#ffd890"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 1.8, "#4a5a2a"); limb(c2, 2, -19, 1.6, -12, 1.8, "#4a5a2a"); return; }
        const hx = 6 + st * 1.6, hy = -12 + Math.cos(t * 2.4) * 0.6;
        limb(c2, 0, -19 - br, hx - 1, hy, 1.9, "#4a5a2a"); limb(c2, -2, -19 - br, hx - 2.4, hy + 0.6, 1.9, "#36421e");
        limb(c2, hx - 1, hy - 3, hx + 1.4, hy + 7, 0.9, "#6a4a2a");
      } });
    c.restore();
  };
  /* Sigrun: Runenleserin, weinroter Kapuzenmantel, silbergraue Zöpfe, schwebende Runensteine */
  DRAW.sigrun = (c, t, x, y, f, cap) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    human(c, t, { ph: 3, robe: "#5a2a4a", robeD: "#401c34", coat: "#5a2a4a", coatD: "#401c34", belt: "#c8a060", skin: "#e0c0a8", tilt: cap ? 0.45 : -0.05,
      back: (c2, br) => poly(c2, [-4.6, -20 - br, 4.6, -20 - br, 6, -2, -6.4, -2], "#4a1e3a"),
      head: c2 => { poly(c2, [-4, 2, -4.2, -3, 0, -5.4, 4.2, -3.4, 4.6, -0.6, 3.2, -2.4, -2, -2.6, -2.4, 3], "#5a2a4a"); limb(c2, -3, 2, -3.4, 8, 1.3, "#c8c0b8"); limb(c2, 2.6, 2, 3.2, 7, 1.1, "#c8c0b8");
        poly(c2, [1, -1.6, 3.4, -1.4, 3.2, 0, 1.4, -0.2], "#e0c0a8"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 1.8, "#5a2a4a"); limb(c2, 2, -19, 1.6, -12, 1.8, "#5a2a4a"); return; }
        const r = Math.sin(t * 1.6) * 1.2;
        limb(c2, -2, -19 - br, -5, -15 - r, 1.8, "#401c34"); limb(c2, 2, -19 - br, 6, -16 + r, 1.8, "#5a2a4a"); circ(c2, 6.2, -16 + r, 1, "#e0c0a8"); circ(c2, -5.2, -15 - r, 1, "#e0c0a8");
        if (!lo()) { c2.save(); c2.globalCompositeOperation = "lighter"; glow(c2, 8, -21, 6 + Math.sin(t * 3) * 1.2, "rgba(200,140,255,.45)"); c2.restore(); }
        for (let i = 0; i < 3; i++) { const a = t * 1.3 + i * 2.1, rx = 8 + Math.cos(a) * 4, ry = -21 + Math.sin(a) * 2; poly(c2, [rx - 1.4, ry, rx, ry - 1.8, rx + 1.4, ry, rx, ry + 1.8], i ? "#d8b0ff" : "#ffd27a"); }
      } });
    c.restore();
  };
  /* Wendel: Bestienmeister, breit, Fellweste, roter Rauschebart, Pfeife um den Hals */
  DRAW.wendel = (c, t, x, y, f, cap, cmd) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    human(c, t, { ph: 4, legs: "#4a3a2a", coat: "#8a3a2a", coatD: "#6a2a1e", wide: 1.2, belt: "#3a2414", skin: "#d8a888", tilt: cap ? 0.4 : 0,
      torso: (c2, br) => { poly(c2, [-5.6, -9, -2, -9, -2.4, -20.4 - br, -5.2, -20 - br], "#7a5a3a"); poly(c2, [5.6, -9, 2, -9, 2.4, -20.4 - br, 5.2, -20 - br], "#8a6a46"); limb(c2, 0.5, -19.4 - br, 3, -15, 0.4, "#c8a060"); circ(c2, 3, -14.6, 0.8, "#d8c890"); },
      head: c2 => { poly(c2, [-1.6, 1, 3.6, 0.8, 3.4, 5, 1, 7.4, -2.6, 5], "#a04a20"); poly(c2, [-3.6, 1, -3.4, -2.4, 1, -3.8, 3.4, -2.4, 1, -2], "#a04a20"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 2, "#8a3a2a"); limb(c2, 2, -19, 1.6, -12, 2, "#8a3a2a"); return; }
        if (cmd) { limb(c2, 1.4, -19 - br, 7, -24, 2, "#8a3a2a"); circ(c2, 7.2, -24.4, 1.2, "#d8a888"); }
        else { limb(c2, 1.4, -19 - br, 5, -13, 2, "#8a3a2a"); circ(c2, 5.2, -12.6, 1.2, "#d8a888"); }
        limb(c2, -2, -19 - br, -5, -13, 2, "#6a2a1e"); circ(c2, -5.2, -12.6, 1.2, "#d8a888");
      } });
    c.restore();
  };
  /* Jori: junger Lehrling mit Lederschürze und Mütze – schleift am Stein */
  DRAW.jori = (c, t, x, y, f, cap) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    const g = cap ? 0 : Math.sin(t * 7) * 1.2;
    human(c, t, { ph: 5, legs: "#3a2a22", coat: "#a04a2a", coatD: "#7a3420", belt: "#2a1a10", skin: "#e8c0a0", stoop: cap ? 0 : 1.2, tilt: cap ? 0.4 : 0.25,
      torso: (c2, br) => poly(c2, [-3.6, -19 - br, 3.6, -19 - br, 3.4, -7, -3.4, -7], "#5a3a22"),
      head: c2 => { poly(c2, [-3.6, -0.6, -3, -3.6, 2.8, -3.8, 3.8, -1.6], "#6a2a1a"); poly(c2, [2.6, -2.4, 5.4, -1.8, 3, -1], "#6a2a1a"); poly(c2, [-3.4, 0, -3.6, 2.2, -2.4, 0.4], "#4a2a14"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 1.7, "#a04a2a"); limb(c2, 2, -19, 1.6, -12, 1.7, "#a04a2a"); return; }
        limb(c2, 0, -19 - br, 6 + g, -11, 1.7, "#a04a2a"); limb(c2, -2, -19 - br, 4.6 + g, -10.4, 1.7, "#7a3420");
        c2.save(); c2.translate(6.2 + g, -11); c2.rotate(-0.25); limb(c2, -1, 0, 9, 0, 1.1, "#d8d0c8"); limb(c2, -3, 0, -1, 0, 1.4, "#4a2a14"); c2.restore();
      } });
    c.restore();
  };
  /* Alwin: alter Chronist, dunkle Robe, Brille, Federkiel, gebeugt */
  DRAW.alwin = (c, t, x, y, f, cap) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    const wr = cap ? 0 : Math.sin(t * 9) * 0.6;
    human(c, t, { ph: 6, robe: "#3a2a2a", robeD: "#2a1e1e", coat: "#3a2a2a", coatD: "#2a1e1e", belt: "#a07a3a", skin: "#d8b098", stoop: 1.4, tilt: cap ? 0.3 : 0.3,
      torso: (c2, br) => { poly(c2, [-4, -20 - br, 4, -20 - br, 3, -17, -3, -17], "#a07a3a"); },
      head: c2 => { poly(c2, [-3.4, 0.6, -3.6, -1.8, -2.6, -1], "#d8d0c8"); poly(c2, [0.6, 1.6, 3.4, 1.4, 2, 4.4], "#d8d0c8"); c2.strokeStyle = "#8a6a2a"; c2.lineWidth = 0.4; c2.beginPath(); c2.arc(2.2, -0.4, 1.1, 0, TAU); c2.stroke(); poly(c2, [-3, -2.4, 2.6, -3, 1.4, -3.6, -2.4, -3.4], "#c8c0b8"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 1.8, "#3a2a2a"); limb(c2, 2, -19, 1.6, -12, 1.8, "#3a2a2a"); return; }
        limb(c2, -1, -19 - br, 5.4 + wr, -14, 1.8, "#3a2a2a"); circ(c2, 5.6 + wr, -13.8, 1, "#d8b098");
        limb(c2, 5.6 + wr, -13.8, 8 + wr, -17.6, 0.5, "#f0e8d8"); poly(c2, [7.6 + wr, -17.8, 9.6 + wr, -20.6, 8.6 + wr, -17], "#f0e8d8");
        limb(c2, -2, -19 - br, -4.6, -13, 1.8, "#2a1e1e"); circ(c2, -4.8, -12.8, 1, "#d8b098");
      } });
    c.restore();
  };
  /* Lotte: Händlerin, rotes Kleid, cremefarbene Schürze, Kopftuch, zählt Münzen */
  DRAW.lotte = (c, t, x, y, f, cap) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    const coin = cap ? 0 : (t * 1.4) % 1;
    human(c, t, { ph: 7, robe: "#8a2a2a", robeD: "#6a1e1e", coat: "#8a2a2a", coatD: "#6a1e1e", wide: 1.4, skin: "#e8b898", tilt: cap ? 0.4 : 0,
      torso: (c2, br) => { poly(c2, [-3.6, -18 - br, 3.6, -18 - br, 4.4, -2, -4.4, -2], "#e8dcc0"); limb(c2, -5, -12, 5, -12, 0.8, "#c8902a"); },
      head: c2 => { poly(c2, [-3.8, 1, -3.6, -2.6, 0, -4.2, 3.6, -2.8, 3.4, -1.6, -1.4, -2, -2.2, 2], "#c8902a"); circ(c2, -3.8, 1.4, 1.2, "#c8902a"); circ(c2, 2, 1.6, 0.6, "#e08a7a"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 2, "#8a2a2a"); limb(c2, 2, -19, 1.6, -12, 2, "#8a2a2a"); return; }
        limb(c2, 1.4, -19 - br, 6, -14, 2, "#8a2a2a"); circ(c2, 6.2, -14, 1.1, "#e8b898");
        limb(c2, -2, -19 - br, 3, -13, 2, "#6a1e1e"); circ(c2, 3.2, -13, 1.1, "#e8b898");
        const cy = -15 - Math.sin(coin * PI) * 7; ell(c2, 6.4, cy, 1.2, 1.2 * Math.abs(Math.cos(coin * 9)) + 0.2, "#ffd27a");
      } });
    c.restore();
  };
  /* Mira: Kartenzeichnerin der Vorgänger, ockerfarbener Mantel, dunkles Haar, rote Fäden ums Handgelenk */
  DRAW.mira = (c, t, x, y, f, cap) => {
    c.save(); c.translate(x, y); c.scale(f, 1);
    human(c, t, { ph: 8, legs: "#3a2a22", coat: "#c8a060", coatD: "#a0804a", hem: "#b08a50", belt: "#5a3a1a", skin: "#e0b890", tilt: cap ? 0.5 : 0.08,
      head: c2 => { poly(c2, [-3.6, 2.4, -3.6, -2.6, 0, -4, 3.4, -2.6, 3.6, -1, 0.6, -2.4, -2, 4.6], "#6a3a1a"); limb(c2, -2.6, 3, -2.8, 7, 1.6, "#6a3a1a"); },
      arms: (c2, br) => {
        if (cap) { limb(c2, -2, -19, -1, -12, 1.8, "#c8a060"); limb(c2, 2, -19, 1.6, -12, 1.8, "#c8a060"); return; }
        const r = Math.sin(t * 1.2) * 0.8;
        limb(c2, 1.4, -19 - br, 5.4, -15 + r, 1.8, "#c8a060"); circ(c2, 5.6, -15 + r, 1, "#e0b890"); limb(c2, 4.6, -15.6 + r, 5.2, -14.2 + r, 0.5, "#c03a5a");
        limb(c2, -2, -19 - br, -4.6, -13.4, 1.8, "#a0804a"); circ(c2, -4.8, -13.2, 1, "#e0b890");
        c2.strokeStyle = "#c03a5a"; c2.lineWidth = 0.4; c2.beginPath(); c2.moveTo(5.6, -15 + r); c2.quadraticCurveTo(8, -9, 7 + Math.sin(t * 2) * 1.4, -4); c2.stroke();
      } });
    c.restore();
  };
  /* Liederbuch (Fund) – Barradin selbst steht dann auf der Bühne (Z.drawNPC "B") */
  DRAW.lied = (c, t, x, y) => {
    c.save(); c.translate(x, y);
    c.fillStyle = "#3a2a22"; c.fillRect(-4, -10, 8, 10); c.fillStyle = "#4a3a30"; c.fillRect(-6, -12, 12, 2.4);
    c.save(); c.translate(0, -15 + Math.sin(t * 2) * 1.2); c.rotate(-0.1);
    poly(c, [-6, -3, 0, -2, 0, 3, -6, 2], "#6a2a6a"); poly(c, [6, -3, 0, -2, 0, 3, 6, 2], "#7a3a7a"); limb(c, 0, -2, 0, 3, 0.5, "#e5b454");
    c.restore();
    for (let i = 0; i < 2; i++) { const p = (t * 0.4 + i * 0.5) % 1; c.save(); c.globalAlpha *= Math.sin(p * PI) * 0.9; const nx = -3 + i * 6 + Math.sin(p * 7 + i) * 2, ny = -20 - p * 12; circ(c, nx, ny, 0.9, "#ffd27a"); limb(c, nx + 0.8, ny, nx + 0.8, ny - 3, 0.4, "#ffd27a"); c.restore(); }
    c.restore();
  };

  /* ======================= VORGEMALTE BILDER (Sprites) ======================= */
  /* Statisches (Zelte, Hütten, Stände, Palisade, Balken, Brett, Stein) wird einmal pro Besuch/Änderung gemalt und dann
     nur noch mit drawImage gesetzt. Auflösung folgt der Bildschirmskalierung (Handheld-Stufe: gröber). */
  const SPR = new Map();
  (Z._cachesNeu = Z._cachesNeu || []).push(() => SPR.clear()); /* W22 Geist */
  const sprK = () => { const s = (Z.gfx && Z.gfx.scale) || 2; const k = lo() ? Math.min(1.5, s * 0.6) : Math.min(3, s); return Math.max(1, Math.round(k * 2) / 2); };
  function sprite(key, w, h, draw) {
    const k = sprK(), id = key + "@" + k;
    let sp = SPR.get(id); if (sp) return sp;
    const cv = document.createElement("canvas"); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k);
    const c = cv.getContext("2d"); c.scale(k, k);
    try { draw(c); } catch (err) { console.error(err); }
    sp = { cv, w, h }; if (SPR.size > 160) SPR.clear(); SPR.set(id, sp); return sp;
  }
  /* Leistung: Stände, Hütten, Palisade usw. sind mit k (≤ 3) vorgemalt und mussten jedes Bild auf die Bildschirmgröße
     (z. B. 2,86× oder 3,6×) gefiltert werden – voll ausgebaut rund 3 ms je Bild in Software-Darstellung. Jetzt wird je Sprite
     einmal mit derselben bilinearen Vergrößerung eine Fassung in Bildschirmpixeln angelegt und danach pixelgenau kopiert
     (wie G.blitLayer in bild.js; Lage auf ganze Bildschirmpixel gerundet, höchstens ½ Pixel). Gedreht/gespiegelt/Stufe 0: wie bisher. */
  const put = (c, sp, x, y) => {
    const m = c.getTransform();
    if (m.b || m.c || m.a <= 0 || Math.abs(m.d - m.a) > 1e-6 || lo()) { c.drawImage(sp.cv, x, y, sp.w, sp.h); return; }
    const W = Math.round(sp.w * m.a), H = Math.round(sp.h * m.d);
    if (W < 8 || H < 8 || W > 2400 || H > 1600) { c.drawImage(sp.cv, x, y, sp.w, sp.h); return; }
    let d = sp.dev;
    if (!d || d.width !== W || d.height !== H) {
      d = document.createElement("canvas"); d.width = W; d.height = H;
      const g = d.getContext("2d"); g.imageSmoothingEnabled = true; g.drawImage(sp.cv, 0, 0, W, H); sp.dev = d;
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(d, Math.round(m.a * x + m.e), Math.round(m.d * y + m.f)); c.setTransform(m);
  };
  const resetSprites = () => SPR.clear();
  const shadeC = (col, f) => { let h = col.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; const n = parseInt(h, 16); const ch = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))); return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, "0")).join(""); };

  /* Wappen der Bewohner: auf Bannern, Schildern und in der Lagerchronik */
  function emblem(c, kind, x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s, s);
    switch (kind) {
      case "karte": poly(c, [-5, -4, -1.6, -5, 1.6, -4, 5, -5, 5, 4, 1.6, 5, -1.6, 4, -5, 5], col || "#e8d8b0"); limb(c, -1.6, -5, -1.6, 4, 0.5, "#8a6a3a"); limb(c, 1.6, -4, 1.6, 5, 0.5, "#8a6a3a"); c.strokeStyle = "#c03a2a"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-4, 2); c.lineTo(-1, -1); c.lineTo(2, 1); c.lineTo(4, -3); c.stroke(); break;
      case "flasche": circ(c, 0, 2, 4, col || "#e0545a"); c.fillStyle = "#e8dcc0"; c.fillRect(-1.2, -5, 2.4, 4); c.fillStyle = "#8a5a2a"; c.fillRect(-1.6, -6, 3.2, 1.4); circ(c, -1.2, 1, 1, "rgba(255,255,255,.5)"); break;
      case "rune": poly(c, [0, -6, 4.4, 0, 0, 6, -4.4, 0], col || "#c890ff"); limb(c, 0, -3.6, 0, 3.6, 0.7, "#2a1a2a"); limb(c, 0, -1, 2, -3, 0.7, "#2a1a2a"); limb(c, 0, 1, -2, -1, 0.7, "#2a1a2a"); break;
      case "pfote": circ(c, 0, 1.6, 2.8, col || "#c89a6a"); circ(c, -3, -2, 1.3, col || "#c89a6a"); circ(c, -1, -3.8, 1.3, col || "#c89a6a"); circ(c, 1.4, -3.8, 1.3, col || "#c89a6a"); circ(c, 3.3, -2, 1.3, col || "#c89a6a"); break;
      case "hammer": c.save(); c.rotate(-0.6); c.fillStyle = "#8a6a3a"; c.fillRect(-0.8, -2, 1.6, 8); c.fillStyle = col || "#a8a0a0"; c.fillRect(-3.6, -5, 7.2, 3.4); c.restore(); break;
      case "note": circ(c, -2, 3, 2, col || "#ffd27a"); circ(c, 3, 2, 2, col || "#ffd27a"); limb(c, -0.3, 3, -0.3, -5, 0.8, col || "#ffd27a"); limb(c, 4.7, 2, 4.7, -6, 0.8, col || "#ffd27a"); limb(c, -0.3, -5, 4.7, -6, 1.4, col || "#ffd27a"); break;
      case "buch": poly(c, [-5, -4, 0, -3, 0, 4, -5, 3], col || "#a07a3a"); poly(c, [5, -4, 0, -3, 0, 4, 5, 3], shadeC(col || "#a07a3a", 1.25)); limb(c, 0, -3, 0, 4, 0.5, "#3a2414"); break;
      case "muenze": circ(c, 0, 0, 4.6, col || "#e5b454"); circ(c, 0, 0, 3.2, shadeC(col || "#e5b454", 0.8)); c.fillStyle = col || "#e5b454"; c.fillRect(-0.6, -2.4, 1.2, 4.8); break;
      case "pfeil": limb(c, -5, 5, 5, -5, 0.8, col || "#e8d8b0"); poly(c, [5.6, -5.6, 2, -4.8, 4.8, -2], col || "#e8d8b0"); limb(c, -5, 5, -6.4, 3, 0.7, col || "#e8d8b0"); limb(c, -5, 5, -3, 6.4, 0.7, col || "#e8d8b0"); break;
      case "faden": c.strokeStyle = col || "#c03a5a"; c.lineWidth = 1; c.beginPath(); c.moveTo(-5, 4); c.bezierCurveTo(-2, -6, 2, 6, 5, -4); c.stroke(); circ(c, 5, -4, 1, col || "#c03a5a"); break;
      default: circ(c, 0, 0, 3, col || "#e5b454");
    }
    c.restore();
  }
  /* Unterkunft je Lagerstufe: Zelt → Hütte → Haus mit Steinsockel */
  function housing(c, cx, gy, st, col, embK, seed) {
    const cD = shadeC(col, 0.62);
    if (st < 2) {
      /* Zelt aus Segeltuch mit Streifen in der Farbe des Bewohners */
      const w = 26, h = 26;
      c.strokeStyle = "#6a5a40"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(cx - w - 6, gy); c.lineTo(cx, gy - h - 2); c.lineTo(cx + w + 6, gy); c.stroke();
      poly(c, [cx - w, gy, cx, gy - h, cx + w, gy], "#b8a47a"); poly(c, [cx - w, gy, cx, gy - h, cx - 4, gy], "#9a8660");
      for (let i = -2; i <= 2; i++) { c.fillStyle = i % 2 ? col : "rgba(0,0,0,0)"; if (i % 2) poly(c, [cx + i * 7 - 2, gy, cx, gy - h, cx + i * 7 + 2, gy], cD); }
      poly(c, [cx - 6, gy, cx, gy - 14, cx + 6, gy], "#2a1e18"); poly(c, [cx, gy - 14, cx + 7, gy, cx + 2, gy], "#c8b48a");
      c.fillStyle = "#4a3422"; c.fillRect(cx - 0.8, gy - h - 4, 1.6, 6); poly(c, [cx + 0.8, gy - h - 4, cx + 7, gy - h - 2.4, cx + 0.8, gy - h - 0.8], col);
      c.fillStyle = "#3a2a1a"; c.fillRect(cx - w - 6.6, gy - 2, 1.2, 2); c.fillRect(cx + w + 5.4, gy - 2, 1.2, 2);
      return;
    }
    const stone = st >= 4, w = 46, h = stone ? 34 : 30, x0 = cx - w / 2;
    if (stone) { c.fillStyle = "#5a5050"; c.fillRect(x0 - 2, gy - 11, w + 4, 11); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#6a605c" : "#4e4646"; c.fillRect(x0 - 2 + (i % 4) * 12.5 + (i > 3 ? 6 : 0), gy - (i > 3 ? 5.5 : 11), 11.5, 5); } }
    const wy = stone ? gy - 11 : gy;
    /* Bretterwand */
    c.fillStyle = "#6a4a2e"; c.fillRect(x0, wy - (h - (stone ? 11 : 0)), w, h - (stone ? 11 : 0));
    for (let i = 0; i < w; i += 4.6) { c.fillStyle = (i / 4.6) % 2 < 1 ? "#5e4028" : "#74522f"; c.fillRect(x0 + i, wy - (h - (stone ? 11 : 0)), 4.2, h - (stone ? 11 : 0)); }
    if (stone) { c.fillStyle = "#3a2618"; c.fillRect(x0, wy - 23, w, 1.6); limb(c, x0 + 2, wy - 1, x0 + w / 2, wy - 22, 1.2, "#3a2618"); limb(c, x0 + w - 2, wy - 1, x0 + w / 2, wy - 22, 1.2, "#3a2618"); }
    /* Dach: Stroh (Hütte) oder Ziegel (Haus) */
    const ry = gy - h, roof = stone ? "#7a2a22" : "#b8964a", roofD = stone ? "#5a1c18" : "#8e7036";
    poly(c, [x0 - 6, ry + 2, cx, ry - 18, x0 + w + 6, ry + 2], roof); poly(c, [x0 - 6, ry + 2, cx, ry - 18, cx - 4, ry + 2], roofD);
    if (stone) for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) { const yy = ry - 14 + r * 4.4, half = (yy - (ry - 18)) / 20 * (w / 2 + 6); const xx = cx - half + (k + (r % 2) * 0.5) * (half * 2 / 8); if (xx < cx + half - 2) { c.fillStyle = "rgba(40,10,8,.35)"; c.fillRect(xx, yy, 1, 2.6); } }
    else { c.strokeStyle = "rgba(90,60,20,.5)"; c.lineWidth = 0.5; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(cx - 2 + (k - 4) * 1.2, ry - 16); c.lineTo(x0 - 6 + k * (w + 12) / 8, ry + 2); c.stroke(); } }
    /* Tür und Fenster */
    c.fillStyle = "#2a1a10"; c.beginPath(); c.moveTo(cx - 6 - 7, wy); c.lineTo(cx - 6 - 7, wy - 15); c.quadraticCurveTo(cx - 6, wy - 21, cx - 6 + 7, wy - 15); c.lineTo(cx - 6 + 7, wy); c.fill();
    c.fillStyle = "#4a3020"; c.fillRect(cx - 12.4, wy - 14.5, 12.8, 14.5); c.fillStyle = "#3a2414"; for (let k = 0; k < 3; k++) c.fillRect(cx - 12 + k * 4.3, wy - 14, 0.7, 14); circ(c, cx - 1.8, wy - 7, 0.8, "#c8a060");
    c.fillStyle = "#2a1a10"; c.fillRect(cx + 7, wy - 19, 10, 8); c.fillStyle = "#ffcf7a"; c.fillRect(cx + 8, wy - 18, 8, 6); c.fillStyle = "#e89a3a"; c.fillRect(cx + 8, wy - 15, 8, 3); c.fillStyle = "#2a1a10"; c.fillRect(cx + 11.6, wy - 18, 0.8, 6); c.fillRect(cx + 8, wy - 15.4, 8, 0.8);
    c.fillStyle = "#5a3a22"; c.fillRect(cx + 6, wy - 11, 12, 1.6);
    if (stone) { c.fillStyle = "#4a4040"; c.fillRect(x0 + w - 12, ry - 22, 6, 14); c.fillStyle = "#5a5050"; c.fillRect(x0 + w - 13, ry - 24, 8, 2.4); }
    /* Schild mit Wappen */
    c.fillStyle = "#3a2418"; c.fillRect(x0 - 3, wy - 22, 8, 1.2); c.fillStyle = col; c.fillRect(x0 - 3, wy - 21, 7, 9); poly(c, [x0 - 3, wy - 12, x0 + 0.5, wy - 9.5, x0 + 4, wy - 12], col);
    emblem(c, embK, x0 + 0.5, wy - 16.6, 0.55, "#f0e0b8");
  }
  /* Stände der Bewohner – wachsen mit ihrer Stufe */
  const STALL = {
    edda: (c, x, gy, L) => {
      c.fillStyle = "#5a3a22"; c.fillRect(x - 12, gy - 11, 24, 2.4); c.fillRect(x - 10, gy - 9, 1.8, 9); c.fillRect(x + 8, gy - 9, 1.8, 9);
      c.save(); c.translate(x, gy - 12); c.rotate(-0.05); poly(c, [-10, -1, 10, -1.5, 10.5, 0.5, -10, 0.8], "#e8d8b0"); c.restore();
      if (L >= 1) { c.fillStyle = "#4a3020"; c.fillRect(x - 22, gy - 30, 1.6, 30); c.fillRect(x - 31, gy - 30, 18, 1.6); c.fillStyle = "#e8d8b0"; c.fillRect(x - 30, gy - 28.4, 16, 12); c.strokeStyle = "#8a5a2a"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x - 28, gy - 20); c.lineTo(x - 24, gy - 25); c.lineTo(x - 19, gy - 22); c.lineTo(x - 16, gy - 26); c.stroke(); circ(c, x - 19, gy - 22, 0.8, "#c03a2a"); }
      if (L >= 2) { c.fillStyle = "#6a4a2a"; limb(c, x + 15, gy, x + 19, gy - 24, 1.2, "#6a4a2a"); limb(c, x + 23, gy, x + 19, gy - 24, 1.2, "#6a4a2a"); c.fillStyle = "#e0d0a8"; c.fillRect(x + 12.5, gy - 26, 13, 15); c.strokeStyle = "#8a5a2a"; c.lineWidth = 0.45; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + 14, gy - 23 + i * 3); c.lineTo(x + 24, gy - 22.5 + i * 3 + (i % 2 ? 1 : -1)); c.stroke(); } emblem(c, "karte", x + 19, gy - 31, 0.4, "#c8902a"); }
      if (L >= 3) { c.fillStyle = "#7a5a2a"; c.fillRect(x - 2, gy - 18, 1.2, 6); c.save(); c.translate(x - 1, gy - 18); c.rotate(-0.5); c.fillStyle = "#c8902a"; c.fillRect(-1, -9, 2.4, 9); c.fillStyle = "#8a6a2a"; c.fillRect(-1.4, -10, 3.2, 2); c.restore(); }
      c.fillStyle = "#c8a060"; c.fillRect(x + 4, gy - 13.6, 4, 1.2); c.fillStyle = "#3a2414"; c.fillRect(x - 6, gy - 13, 1, 1);
    },
    quirin: (c, x, gy, L) => {
      /* Kessel auf drei Füßen */
      c.fillStyle = "#2a2020"; c.fillRect(x - 9, gy - 3, 2, 3); c.fillRect(x + 7, gy - 3, 2, 3); ell(c, x, gy - 8, 9, 7, "#2e2626"); ell(c, x, gy - 12.6, 8.4, 2, "#3a3030"); ell(c, x, gy - 12.4, 7, 1.4, "#5a8a2a");
      c.fillStyle = "#2a1a10"; c.fillRect(x - 6, gy - 2, 12, 2);
      if (L >= 1) { c.fillStyle = "#5a3a22"; c.fillRect(x - 30, gy - 30, 18, 1.6); c.fillRect(x - 30, gy - 20, 18, 1.6); c.fillRect(x - 30, gy - 30, 1.4, 30); c.fillRect(x - 13.4, gy - 30, 1.4, 30); for (let i = 0; i < 5; i++) { emblem(c, "flasche", x - 27 + i * 3.4, gy - 23.6, 0.32, ["#e0545a", "#9ad04a", "#c890ff", "#ffb040", "#e0545a"][i]); emblem(c, "flasche", x - 27 + i * 3.4, gy - 33.4, 0.3, ["#c890ff", "#ffb040", "#e0545a", "#9ad04a", "#ffd27a"][i]); } }
      if (L >= 2) { c.fillStyle = "#5a3a22"; c.fillRect(x + 12, gy - 12, 16, 2); c.fillRect(x + 13, gy - 10, 1.6, 10); c.fillRect(x + 25, gy - 10, 1.6, 10); ell(c, x + 17, gy - 16, 3.6, 3.6, "#c87a3a"); c.strokeStyle = "#c87a3a"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 17, gy - 19); c.quadraticCurveTo(x + 22, gy - 26, x + 25, gy - 16); c.stroke(); emblem(c, "flasche", x + 25, gy - 14, 0.35, "#e0545a"); }
      if (L >= 3) { c.fillStyle = "#a0602a"; c.fillRect(x + 2, gy - 34, 2, 20); c.strokeStyle = "#c87a3a"; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(x - 3, gy - 30 + i * 3); c.lineTo(x + 9, gy - 29 + i * 3); } c.stroke(); }
    },
    sigrun: (c, x, gy, L) => {
      ell(c, x, gy - 3, 8, 3, "#5a3a22"); c.fillStyle = "#4a2a20"; c.fillRect(x - 8, gy - 3, 16, 3); ell(c, x, gy - 6, 9, 2.4, "#6a2a4a");
      for (let i = 0; i < 4; i++) { const rx = x - 5 + i * 3.3; poly(c, [rx - 1.2, gy - 6.4, rx, gy - 8.2, rx + 1.2, gy - 6.4, rx, gy - 5.4], "#d8d0c8"); }
      const stoneR = (sx, h) => { poly(c, [sx - 4, gy, sx - 3, gy - h, sx, gy - h - 2, sx + 3.4, gy - h + 1, sx + 4, gy], "#6a6260"); poly(c, [sx - 4, gy, sx - 3, gy - h, sx, gy - h - 2, sx - 1, gy], "#544c4a"); c.strokeStyle = "#c890ff"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(sx, gy - h + 3); c.lineTo(sx, gy - 4); c.moveTo(sx, gy - h + 6); c.lineTo(sx + 2, gy - h + 4); c.moveTo(sx, gy - h + 9); c.lineTo(sx - 2, gy - h + 7); c.stroke(); };
      if (L >= 1) stoneR(x - 22, 20);
      if (L >= 2) stoneR(x + 20, 16);
      if (L >= 3) { stoneR(x - 32, 13); stoneR(x + 30, 11); }
    },
    wendel: (c, x, gy, L) => {
      /* Hundehütte */
      poly(c, [x - 30, gy, x - 30, gy - 12, x - 22, gy - 19, x - 14, gy - 12, x - 14, gy], "#7a5232"); poly(c, [x - 31.5, gy - 11, x - 22, gy - 20.5, x - 12.5, gy - 11, x - 14, gy - 11, x - 22, gy - 18.4, x - 30, gy - 11], "#8a2a22");
      c.fillStyle = "#1a1210"; c.beginPath(); c.moveTo(x - 26, gy); c.lineTo(x - 26, gy - 6); c.quadraticCurveTo(x - 22, gy - 11, x - 18, gy - 6); c.lineTo(x - 18, gy); c.fill();
      c.fillStyle = "#e8d8b0"; c.fillRect(x - 25, gy - 16, 6, 2.4); c.fillStyle = "#6a3a1a"; c.font = "700 2.2px sans-serif"; c.textAlign = "center"; c.fillText("REX", x - 22, gy - 14.1);
      ell(c, x - 8, gy - 1, 3.4, 1.2, "#8a6a4a"); ell(c, x - 8, gy - 1.6, 2.6, 0.7, "#c8a070");
      if (L >= 1) { c.fillStyle = "#5a3a22"; c.fillRect(x + 16, gy - 4, 1.6, 4); c.fillRect(x + 28, gy - 4, 1.6, 4); c.fillRect(x + 21.6, gy - 9, 1.6, 9); c.strokeStyle = "#c8402a"; c.lineWidth = 1.6; c.beginPath(); c.arc(x + 22.4, gy - 17, 7, 0, TAU); c.stroke(); c.strokeStyle = "#ffd27a"; c.lineWidth = 0.6; c.setLineDash([1.4, 1.4]); c.beginPath(); c.arc(x + 22.4, gy - 17, 7, 0, TAU); c.stroke(); c.setLineDash([]); }
      if (L >= 2) { c.fillStyle = "#6a4a2a"; c.fillRect(x + 34, gy - 10, 1.4, 10); c.fillRect(x + 44, gy - 10, 1.4, 10); c.fillStyle = "#c8902a"; c.fillRect(x + 33, gy - 9, 13, 1.4); }
      if (L >= 3) { for (let i = 0; i < 3; i++) { c.fillStyle = ["#e5b454", "#c8c0b8", "#c87a3a"][i]; circ(c, x - 28 + i * 6, gy - 25, 1.6, c.fillStyle); limb(c, x - 28 + i * 6, gy - 23.6, x - 28.6 + i * 6, gy - 21, 0.8, "#c03a2a"); limb(c, x - 28 + i * 6, gy - 23.6, x - 27.4 + i * 6, gy - 21, 0.8, "#c03a2a"); } }
    },
    lied: (c, x, gy, L) => {
      /* kleine Bühne mit Vorhang */
      c.fillStyle = "#5a3a22"; c.fillRect(x - 24, gy - 6, 48, 6); c.fillStyle = "#6e4a2c"; c.fillRect(x - 24, gy - 7, 48, 1.4);
      for (let i = 0; i < 6; i++) { c.fillStyle = "#4a3020"; c.fillRect(x - 22 + i * 8.6, gy - 5, 0.6, 5); }
      c.fillStyle = "#3a2418"; c.fillRect(x - 24, gy - 46, 2, 40); c.fillRect(x + 22, gy - 46, 2, 40); c.fillRect(x - 26, gy - 48, 52, 3);
      const cur = L >= 3 ? "#c8902a" : "#8a1e2a", curD = shadeC(cur, 0.7);
      poly(c, [x - 22, gy - 45, x - 9, gy - 45, x - 14, gy - 30, x - 22, gy - 7], cur); poly(c, [x + 22, gy - 45, x + 9, gy - 45, x + 14, gy - 30, x + 22, gy - 7], cur);
      for (let i = 0; i < 3; i++) { limb(c, x - 20 + i * 3, gy - 44, x - 21 + i * 0.6, gy - 9, 0.5, curD); limb(c, x + 20 - i * 3, gy - 44, x + 21 - i * 0.6, gy - 9, 0.5, curD); }
      poly(c, [x - 24, gy - 46, x + 24, gy - 46, x + 20, gy - 40, x - 20, gy - 40], curD);
      if (L >= 1) { ell(c, x + 30, gy - 5, 5, 5, "#8a3a2a"); ell(c, x + 30, gy - 9.6, 5, 1.6, "#e8d8b0"); limb(c, x + 27, gy - 14, x + 30, gy - 10, 0.5, "#e8d8b0"); }
      if (L >= 2) { c.strokeStyle = "#e5b454"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 24, gy - 40); c.quadraticCurveTo(x, gy - 32, x + 24, gy - 40); c.stroke(); for (let i = 1; i < 8; i++) { const k = i / 8, px = x - 24 + 48 * k, py = gy - 40 + Math.sin(k * PI) * 8 * 0.5 + 3; poly(c, [px - 1.6, py - 1, px + 1.6, py - 1, px, py + 2.4], ["#c03a2a", "#e5b454", "#8a3a8a"][i % 3]); } }
      emblem(c, "note", x, gy - 51, 0.45, "#ffd27a");
    },
    alwin: (c, x, gy, L) => {
      /* Lesepult mit dicker Chronik */
      c.fillStyle = "#4a3020"; c.fillRect(x - 1.4, gy - 14, 2.8, 14); c.fillRect(x - 5, gy - 1.6, 10, 1.6);
      c.save(); c.translate(x, gy - 15); c.rotate(-0.25); c.fillStyle = "#5a3a24"; c.fillRect(-9, -1, 18, 3); poly(c, [-8, -1.4, 0, -2.4, 0, -0.4, -8, 0], "#f0e6cc"); poly(c, [8, -1.4, 0, -2.4, 0, -0.4, 8, 0], "#e0d4b4"); c.restore();
      for (let i = 0; i < 4; i++) { c.fillStyle = ["#6a2a2a", "#3a4a2a", "#8a6a2a", "#4a2a3a"][i]; c.fillRect(x + 12, gy - 3 - i * 3, 9 - (i % 2), 3); }
      if (L >= 1) { c.fillStyle = "#4a3020"; c.fillRect(x - 32, gy - 32, 1.6, 32); c.fillRect(x - 14, gy - 32, 1.6, 32); for (let s = 0; s < 3; s++) { c.fillStyle = "#5a3a22"; c.fillRect(x - 32, gy - 32 + s * 10, 19.6, 1.4); for (let i = 0; i < 6; i++) { c.fillStyle = ["#6a2a2a", "#3a4a2a", "#8a6a2a", "#4a2a3a", "#7a4a2a", "#2a2a2a"][(i + s) % 6]; c.fillRect(x - 30.4 + i * 2.8, gy - 39 + s * 10, 2.2, 7 - (i % 3)); } } }
      if (L >= 2) { c.fillStyle = "#4a3020"; c.fillRect(x + 26, gy - 26, 1.4, 26); c.fillRect(x + 23, gy - 26, 8, 1.4); for (let i = 0; i < 3; i++) { c.fillStyle = "#e8d8b0"; c.fillRect(x + 24 + i * 2, gy - 24, 1.6, 10 + i * 2); } }
      if (L >= 3) { c.fillStyle = "#6a1e1e"; c.fillRect(x - 10, gy - 40, 20, 18); c.fillStyle = "#c8902a"; c.fillRect(x - 10, gy - 40, 20, 1.2); c.fillRect(x - 10, gy - 23, 20, 1.2); emblem(c, "buch", x, gy - 31, 0.6, "#e5b454"); }
    },
    lotte: (c, x, gy, L) => {
      /* Karren mit gestreifter Plane */
      c.fillStyle = "#5a3a22"; c.fillRect(x - 18, gy - 14, 32, 8); c.strokeStyle = "#3a2a1a"; c.lineWidth = 1.4; c.beginPath(); c.arc(x - 10, gy - 5, 5, 0, TAU); c.stroke(); c.beginPath(); c.arc(x + 6, gy - 5, 5, 0, TAU); c.stroke();
      limb(c, x + 14, gy - 10, x + 24, gy - 4, 1.2, "#4a3020");
      c.fillStyle = "#3a2418"; c.fillRect(x - 17, gy - 34, 1.6, 20); c.fillRect(x + 11.6, gy - 34, 1.6, 20);
      for (let i = 0; i < 6; i++) { poly(c, [x - 20 + i * 5.6, gy - 36, x - 14.4 + i * 5.6, gy - 36, x - 14.4 + i * 5.6, gy - 30, x - 20 + i * 5.6, gy - 30], i % 2 ? "#e8dcc0" : "#a82a22"); }
      for (let i = 0; i < 6; i++) poly(c, [x - 20 + i * 5.6, gy - 30, x - 14.4 + i * 5.6, gy - 30, x - 17.2 + i * 5.6, gy - 27.4], i % 2 ? "#e8dcc0" : "#a82a22");
      for (let i = 0; i < 3; i++) emblem(c, ["flasche", "muenze", "flasche"][i], x - 10 + i * 8, gy - 17.4, 0.4, ["#e0545a", "#e5b454", "#9ad04a"][i]);
      if (L >= 1) { c.fillStyle = "#6a4a2a"; c.fillRect(x + 18, gy - 9, 9, 9); c.fillRect(x + 20, gy - 16, 7, 7); c.strokeStyle = "#4a3018"; c.lineWidth = 0.6; c.strokeRect(x + 18.3, gy - 8.7, 8.4, 8.4); c.strokeRect(x + 20.3, gy - 15.7, 6.4, 6.4); }
      if (L >= 2) { c.fillStyle = "#c8902a"; c.fillRect(x - 28, gy - 22, 1, 10); limb(c, x - 32, gy - 22, x - 24, gy - 22, 0.8, "#c8902a"); ell(c, x - 32, gy - 17, 3, 0.8, "#c8902a"); ell(c, x - 24, gy - 17, 3, 0.8, "#c8902a"); limb(c, x - 32, gy - 22, x - 32, gy - 17, 0.3, "#8a6a2a"); limb(c, x - 24, gy - 22, x - 24, gy - 17, 0.3, "#8a6a2a"); c.fillStyle = "#4a3020"; c.fillRect(x - 30, gy - 12, 6, 12); }
      if (L >= 3) { for (let i = 0; i < 4; i++) { c.fillStyle = "#3a2418"; c.fillRect(x - 16 + i * 8, gy - 38, 0.6, 4); emblem(c, i % 2 ? "muenze" : "flasche", x - 15.7 + i * 8, gy - 33, 0.3, i % 2 ? "#e5b454" : "#c890ff"); } }
    },
    mira: (c, x, gy, L) => {
      /* Kartentisch mit Nadeln und roten Fäden */
      c.fillStyle = "#5a3a22"; c.fillRect(x - 14, gy - 12, 28, 2.4); c.fillRect(x - 12, gy - 10, 2, 10); c.fillRect(x + 10, gy - 10, 2, 10);
      poly(c, [x - 13, gy - 12.6, x + 13, gy - 13, x + 13.4, gy - 11.6, x - 13, gy - 11.4], "#e8d8b0");
      c.fillStyle = "#3a2a22"; c.fillRect(x - 30, gy - 40, 1.6, 40); c.fillRect(x - 12, gy - 40, 1.6, 40);
      c.fillStyle = "#e0d0a8"; c.fillRect(x - 29, gy - 38, 18, 16);
      const pins = [[-26, -34], [-17, -30], [-23, -26], [-14, -35]];
      c.strokeStyle = "#c03a5a"; c.lineWidth = 0.5; c.beginPath(); pins.forEach(([px, py], i) => (i ? c.lineTo(x + px, gy + py) : c.moveTo(x + px, gy + py))); c.stroke();
      pins.forEach(([px, py]) => circ(c, x + px, gy + py, 0.8, "#c03a5a"));
      if (L >= 1) { for (let i = 0; i < 3; i++) { c.strokeStyle = ["#c03a5a", "#e5b454", "#d8d0c8"][i]; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 10 + i * 4, gy - 44); c.quadraticCurveTo(x - 9 + i * 4, gy - 36, x - 10 + i * 4 + 1, gy - 30); c.stroke(); } c.fillStyle = "#4a3020"; c.fillRect(x - 12, gy - 44.6, 14, 1.2); }
      if (L >= 2) { c.strokeStyle = "#c8902a"; c.lineWidth = 0.8; c.beginPath(); c.arc(x + 20, gy - 20, 6, 0, TAU); c.stroke(); limb(c, x + 20, gy - 25, x + 20, gy - 15, 0.5, "#c03a5a"); limb(c, x + 15, gy - 20, x + 25, gy - 20, 0.5, "#c8902a"); c.fillStyle = "#4a3020"; c.fillRect(x + 19.4, gy - 14, 1.2, 14); }
    }
  };
  function plotSprite(p, st) {
    const R = RES[p.id], L = lvl(p.id), w = p.w * T, h = 96;
    return sprite("plot:" + p.id + ":" + st + ":" + L + ":" + p.w, w, h, c => {
      /* Boden: festgetretene Erde, ein paar Steine */
      c.fillStyle = "rgba(60,40,24,.55)"; ell(c, w / 2, h - 0.6, w / 2 - 6, 2.2, "rgba(60,40,24,.5)");
      for (let i = 0; i < 6; i++) { const r = hash(i, p.x0 | 0); ell(c, 8 + r * (w - 16), h - 1, 1.6 + r, 0.8, "rgba(120,100,80,.6)"); }
      housing(c, w * 0.27, h, st, R.col, R.emb, p.x0);
      if (STALL[p.id]) STALL[p.id](c, w * 0.58, h, L);
      /* Lagerstufe Banner: Fahne auf eigenem Mast */
      if (st >= 4) { c.fillStyle = "#3a2418"; c.fillRect(w - 6, h - 58, 1.6, 58); const col = R.col; poly(c, [w - 4.4, h - 57, w + 6, h - 55, w + 3, h - 50, w + 6, h - 45, w - 4.4, h - 46], col); emblem(c, R.emb, w + 0.4, h - 51, 0.4, "#f0e0b8"); circ(c, w - 5.2, h - 58.6, 1.2, "#e5b454"); }
    });
  }
  function bauSprite(p) {
    const w = p.w * T, h = 60;
    return sprite("bau:" + p.w, w, h, c => {
      for (const sx of [12, w - 14]) { c.fillStyle = "#6a4a2a"; c.fillRect(sx, h - 12, 2, 12); poly(c, [sx, h - 12, sx + 1, h - 14, sx + 2, h - 12], "#7a5a3a"); }
      c.strokeStyle = "#c8b080"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(13, h - 10); c.quadraticCurveTo(w / 2, h - 6, w - 13, h - 10); c.stroke();
      for (let i = 1; i < 6; i++) { const px = 13 + (w - 26) * i / 6; poly(c, [px - 1.4, h - 8.4, px + 1.4, h - 8.4, px, h - 5.4], i % 2 ? "#c03a2a" : "#e8dcc0"); }
      /* Schild */
      const sx = w / 2; c.fillStyle = "#4a3020"; c.fillRect(sx - 0.8, h - 22, 1.6, 22); c.fillStyle = "#7a5634"; c.fillRect(sx - 10, h - 26, 20, 10); c.strokeStyle = "#3a2414"; c.lineWidth = 0.6; c.strokeRect(sx - 9.7, h - 25.7, 19.4, 9.4);
      c.fillStyle = "#f0dcb0"; c.font = "700 7px 'IM Fell English SC',serif"; c.textAlign = "center"; c.fillText("?", sx, h - 18.4);
      /* Holzstapel und Werkzeug */
      for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? "#7a5232" : "#6a4428"; c.fillRect(w - 40 + i * 1.5, h - 3 - i * 2.6, 18, 2.4); circ(c, w - 40 + i * 1.5, h - 1.8 - i * 2.6, 1.2, "#a07a4a"); }
      c.save(); c.translate(26, h - 2); c.rotate(-1.1); c.fillStyle = "#6a4a2a"; c.fillRect(0, -0.6, 12, 1.2); c.fillStyle = "#8a8288"; c.fillRect(10, -2.4, 3, 4.8); c.restore();
    });
  }
  /* Galerie-Vorräte: je Abschnitt eine andere Mischung */
  function terrSprite(k, w) {
    const W2 = w * T, H = 40;
    return sprite("terr:" + (k % 3) + ":" + w, W2, H, c => {
      const crate = (x, s) => { c.fillStyle = "#6a4a2a"; c.fillRect(x, H - s, s, s); c.strokeStyle = "#4a3018"; c.lineWidth = 0.6; c.strokeRect(x + 0.3, H - s + 0.3, s - 0.6, s - 0.6); limb(c, x + 0.6, H - 0.6, x + s - 0.6, H - s + 0.6, 0.6, "#4a3018"); };
      const barrel = x => { ell(c, x, H - 7, 6, 7.5, "#5a3a22"); c.fillStyle = "#3a2a1a"; c.fillRect(x - 6, H - 11, 12, 1.4); c.fillRect(x - 6, H - 4, 12, 1.4); };
      const pot = (x, col) => { poly(c, [x - 3.4, H - 6, x + 3.4, H - 6, x + 2.4, H, x - 2.4, H], "#a0522d"); for (let i = 0; i < 4; i++) limb(c, x, H - 6, x + (i - 1.5) * 2.4, H - 12 - (i % 2) * 2, 0.8, col); };
      if (k % 3 === 0) {
        crate(10, 12); crate(14, 9 - 0); crate(24, 10); barrel(W2 - 30);
        /* Wäscheleine */
        c.fillStyle = "#4a3220"; c.fillRect(W2 - 60, H - 26, 1.4, 26); c.fillRect(W2 - 12, H - 26, 1.4, 26);
        c.strokeStyle = "#a08a6a"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(W2 - 59, H - 25); c.quadraticCurveTo(W2 - 36, H - 20, W2 - 11, H - 25); c.stroke();
        [["#e8dcc0", 8], ["#8a2a2a", 6], ["#c8902a", 7], ["#6a5a3a", 9]].forEach(([col, h], i) => { const x = W2 - 54 + i * 11, y = H - 23.4 + Math.sin((i + 0.5) / 4 * PI) * 2.4; poly(c, [x, y, x + 7, y, x + 6.4, y + h, x + 0.6, y + h], col); });
      } else if (k % 3 === 1) {
        for (let i = 0; i < 4; i++) pot(12 + i * 9, ["#5a7a2a", "#7a8a2a", "#c8402a", "#6a8a3a"][i]);
        c.fillStyle = "#5a3a22"; c.fillRect(W2 - 44, H - 10, 28, 2); c.fillRect(W2 - 42, H - 8, 1.6, 8); c.fillRect(W2 - 19.6, H - 8, 1.6, 8);
        ell(c, W2 - 36, H - 12, 3, 2, "#c8a060"); ell(c, W2 - 26, H - 12.4, 2.4, 2.4, "#e5b454");
        crate(W2 - 14, 10);
      } else {
        barrel(14); barrel(28); crate(36, 11);
        /* Brennholz */
        for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? "#7a5232" : "#6a4428"; c.fillRect(W2 - 44 + i * 1.5, H - 3 - i * 2.6, 22, 2.4); circ(c, W2 - 44 + i * 1.5, H - 1.8 - i * 2.6, 1.2, "#a07a4a"); }
        c.fillStyle = "#3a2418"; c.fillRect(W2 - 14, H - 24, 1.4, 24); poly(c, [W2 - 12.6, H - 24, W2 - 2, H - 22, W2 - 12.6, H - 18], "#8a2a2a");
      }
    });
  }
  /* Palisade im Westen und Wachturm (ab Stufe 3 / 4) */
  function palisadeSprite(st, H) {
    return sprite("pal:" + st + ":" + H, 48, H, c => {
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 7.4, h = H - 6 - (i % 2) * 6 - hash(i, 3) * 6;
        poly(c, [x, H, x, H - h, x + 3, H - h - 6, x + 6, H - h, x + 6, H], i % 2 ? "#6a4a2e" : "#5a3e26");
        poly(c, [x, H, x, H - h, x + 3, H - h - 6, x + 2, H], "#4a3220");
        c.fillStyle = "#3a2618"; c.fillRect(x, H - h * 0.35, 6, 1.4); c.fillRect(x, H - h * 0.75, 6, 1.4);
      }
    });
  }
  function towerSprite(st) {
    return sprite("tower:" + st, 40, 120, c => {
      const H = 120;
      for (const lx of [6, 30]) { c.fillStyle = "#5a3e26"; c.fillRect(lx, H - 86, 3.4, 86); }
      for (let i = 0; i < 4; i++) { limb(c, 7, H - 6 - i * 20, 31, H - 22 - i * 20, 1.2, "#4a3220"); limb(c, 31, H - 6 - i * 20, 7, H - 22 - i * 20, 1.2, "#4a3220"); }
      c.fillStyle = "#6a4a2e"; c.fillRect(0, H - 90, 40, 6); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#5a3e26" : "#6e4e30"; c.fillRect(1 + i * 6.4, H - 104, 5.4, 14); }
      poly(c, [-4, H - 104, 20, H - 120, 44, H - 104], st >= 5 ? "#7a2a22" : "#8e7036");
      c.fillStyle = "#3a2418"; c.fillRect(19, H - 134, 1.4, 16); poly(c, [20.4, H - 134, 32, H - 131, 20.4, H - 127], "#a82a22");
    });
  }
  /* Bossfarben ohne Blau: Blau- und Türkistöne werden ins Violette bzw. Grüne gedreht */
  function noBlue(col) {
    if (typeof col !== "string" || col[0] !== "#") return col;
    let h = col.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16); if (isNaN(n)) return col;
    let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (d < 0.04) return col;
    const sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hue *= 60; if (hue < 0) hue += 360;
    if (hue < 165 || hue > 255) return col;
    hue = hue < 195 ? 130 : 285;
    const C = (1 - Math.abs(2 * l - 1)) * sat, X2 = C * (1 - Math.abs((hue / 60) % 2 - 1)), m0 = l - C / 2;
    const [r1, g1, b1] = hue < 180 ? [0, C, X2] : [X2, 0, C];
    return "#" + [r1, g1, b1].map(v => Math.round((v + m0) * 255).toString(16).padStart(2, "0")).join("");
  }
  /* Trophäenbalken über dem Waffenständer: je besiegter Boss eine Trophäe (Schädel, Banner, gekreuzte Waffen, Horn) */
  function trophySprite(ids, won, w) {
    return sprite("troph:" + won.join(",") + ":" + w, w, 40, c => {
      c.fillStyle = "#3a2418"; c.fillRect(2, 30, 2.4, 10); c.fillRect(w - 4.4, 30, 2.4, 10);
      c.fillStyle = "#5e3c24"; c.fillRect(0, 26, w, 4); c.fillStyle = "#7a5232"; c.fillRect(0, 26, w, 1); c.fillStyle = "#3a2418"; c.fillRect(0, 29.4, w, 0.6);
      const n = ids.length, step = (w - 10) / Math.max(1, n);
      ids.forEach((id, i) => {
        const x = 5 + step * (i + 0.5), d = Z.BOSSDEF[id] || {}, got = won.includes(id), col = noBlue(d.c || "#6a5a50"), acc = noBlue(d.t || "#ffd27a");
        c.fillStyle = "#2a1a10"; c.fillRect(x - 0.4, 22, 0.8, 4);
        if (!got) { c.strokeStyle = "rgba(200,170,120,.35)"; c.lineWidth = 0.5; c.setLineDash([1, 1]); c.strokeRect(x - 4, 12, 8, 10); c.setLineDash([]); return; }
        const k = i % 4;
        if (k === 0) { /* Schädel auf Schild */ poly(c, [x - 5, 10, x + 5, 10, x + 5, 18, x, 23, x - 5, 18], col); poly(c, [x - 5, 10, x, 10, x, 23, x - 5, 18], shadeC(col, 0.75)); circ(c, x, 15, 3, "#e8dcc8"); c.fillStyle = "#1a1010"; c.fillRect(x - 1.8, 14.2, 1.3, 1.3); c.fillRect(x + 0.5, 14.2, 1.3, 1.3); c.fillRect(x - 1.2, 17, 2.4, 0.8); }
        else if (k === 1) { /* Banner */ poly(c, [x - 4.6, 6, x + 4.6, 6, x + 4.6, 22, x, 19, x - 4.6, 22], col); limb(c, x - 5.6, 6, x + 5.6, 6, 1, "#c8a060"); circ(c, x, 12, 2.4, acc); poly(c, [x - 4.6, 6, x - 1.6, 6, x - 1.6, 20.6, x - 4.6, 22], shadeC(col, 0.75)); }
        else if (k === 2) { /* gekreuzte Klingen hinter Wappen */ limb(c, x - 6, 22, x + 6, 6, 1, "#c8c0b8"); limb(c, x + 6, 22, x - 6, 6, 1, "#c8c0b8"); circ(c, x, 14, 3.6, col); circ(c, x, 14, 1.6, acc); }
        else { /* Horn / Klaue */ c.fillStyle = acc; c.beginPath(); c.moveTo(x - 4, 20); c.quadraticCurveTo(x - 6, 10, x + 3, 6); c.quadraticCurveTo(x - 1, 12, x + 1, 20); c.fill(); ell(c, x - 1.5, 20.5, 3, 1.4, col); }
      });
    });
  }
  /* Gedenkstein: Stein mit eingeritzten Strichen (Läufe), ab Stufe 4 auf Sockel mit Kerzen */
  function stoneSprite(st) {
    return sprite("stone:" + st, 40, 44, c => {
      const H = 44, x = 20;
      if (st >= 4) { c.fillStyle = "#5a5050"; c.fillRect(x - 15, H - 5, 30, 5); c.fillStyle = "#6a605c"; c.fillRect(x - 15, H - 5, 30, 1); }
      const b = st >= 4 ? 5 : 0;
      poly(c, [x - 10, H - b, x - 11, H - b - 20, x - 6, H - b - 30, x + 4, H - b - 32, x + 10, H - b - 24, x + 11, H - b], "#6e6664");
      poly(c, [x - 10, H - b, x - 11, H - b - 20, x - 6, H - b - 30, x - 3, H - b - 31, x - 4, H - b], "#5a5250");
      c.fillStyle = "rgba(40,30,30,.5)"; c.fillRect(x - 6, H - b - 24, 12, 0.8);
      for (let i = 0; i < 3; i++) { c.fillStyle = "rgba(60,80,40,.6)"; ell(c, x - 9 + i * 8, H - b - 1, 3, 1.2, "rgba(70,90,40,.7)"); }
      if (st >= 2) { ell(c, x + 13, H - 1, 3, 1, "#5a3a22"); c.fillStyle = "#e8dcc0"; c.fillRect(x + 12, H - 6, 2, 5); }
    });
  }
  /* Brett für Steckbriefe */
  function boardSprite(list) {
    const key = "board:" + list.map(w => (w.id || "") + (w.defeated ? "x" : "") + (w.level || "")).join(",");
    return sprite(key, 44, 46, c => {
      const H = 46;
      c.fillStyle = "#4a3020"; c.fillRect(4, H - 46, 2.4, 46); c.fillRect(37.6, H - 46, 2.4, 46);
      c.fillStyle = "#6a4a2e"; c.fillRect(2, H - 42, 40, 26); c.fillStyle = "#5a3e26"; for (let i = 0; i < 5; i++) c.fillRect(2, H - 42 + i * 5.4, 40, 0.6);
      poly(c, [0, H - 42, 22, H - 50, 44, H - 42], "#5a2a22");
      c.fillStyle = "#e8dcc0"; c.font = "700 4px 'IM Fell English SC',serif"; c.textAlign = "center"; c.fillText(L(["GESUCHT", "WANTED"]), 22, H - 43.4);
      const n = Math.min(6, list.length);
      for (let i = 0; i < n; i++) {
        const w = list[i], px = 5 + (i % 3) * 12.4, py = H - 40 + Math.floor(i / 3) * 12.6, rot = (hash(i, 7) - 0.5) * 0.2;
        c.save(); c.translate(px + 5, py + 6); c.rotate(rot);
        c.fillStyle = "#e8dcb8"; c.fillRect(-5, -6, 10, 12); c.fillStyle = "rgba(120,80,30,.25)"; c.fillRect(-5, 4, 10, 2);
        const col = w.col || "#6a2a2a";
        if (typeof w.draw === "function") { try { c.save(); c.beginPath(); c.rect(-4, -5, 8, 7); c.clip(); w.draw(c, 0, -1.5, 8, 7); c.restore(); } catch (_) {} }
        else { circ(c, 0, -2.4, 2.4, col); poly(c, [-3.6, 2, -2.6, -0.4, 2.6, -0.4, 3.6, 2], col); c.fillStyle = "#1a1010"; c.fillRect(-1.2, -3, 0.8, 0.8); c.fillRect(0.6, -3, 0.8, 0.8); }
        c.fillStyle = "#3a2414"; c.fillRect(-3.6, 3.2, 7.2, 0.5);
        if (w.defeated) { c.strokeStyle = "#a01a1a"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-4, -5); c.lineTo(4, 5); c.moveTo(4, -5); c.lineTo(-4, 5); c.stroke(); }
        circ(c, 0, -5.4, 0.7, "#8a8288");
        c.restore();
      }
      if (!n) { c.fillStyle = "rgba(240,220,180,.55)"; c.font = "italic 4px 'Alegreya Sans',sans-serif"; c.fillText(L(["– noch leer –", "– still empty –"]), 22, H - 28); }
    });
  }
  /* Wegweiser „Schnellweg zum Tor" */
  function signSprite() {
    return sprite("sign", 34, 30, c => {
      const H = 30; c.fillStyle = "#4a3020"; c.fillRect(15.4, 2, 2.2, H - 2); c.fillStyle = "#3a2618"; c.fillRect(13, H - 2, 7, 2);
      poly(c, [4, 4, 28, 4, 33, 8.5, 28, 13, 4, 13], "#7a5634"); c.strokeStyle = "#3a2414"; c.lineWidth = 0.6; c.stroke();
      c.fillStyle = "#f0dcb0"; c.font = "700 5px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(L(["Zum Tor", "To the gate"]), 17, 8.8);
      poly(c, [26, 16, 6, 16, 2, 19.5, 6, 23, 26, 23], "#6a4a2c"); c.fillStyle = "#e8d0a0"; c.font = "700 4px 'Alegreya Sans',sans-serif"; c.fillText(L(["Lager", "Camp"]), 15, 19.8);
    });
  }
  /* Stand-Position und Blickrichtung je Bewohner (Anteil der Platzbreite) */
  const FX_AT = { edda: 0.7, quirin: 0.66, sigrun: 0.74, wendel: 0.88, lied: 0.8, alwin: 0.66, lotte: 0.82, mira: 0.72 };

  /* ======================= LAGERBESUCH ======================= */
  const load0 = Z.loadArea;
  Z.loadArea = function (id) {
    const r = load0.apply(this, arguments);
    try { const lv = Z.level; if (lv && lv.hub) setupCamp(lv); else { camp = null; areaFresh = true; if (id === "passage") LM().lgFar = true; } } catch (err) { console.error(err); }
    return r;
  };
  let areaFresh = false;
  function setupCamp(lv) {
    const m = LM(), st = lv.lstage != null ? lv.lstage : stage(), T2 = T / 2;
    m.visits = (m.visits | 0) + 1;
    /* W9 (Abuse-Bot): Angebote (Lotte, Sigrun-Runen, Barradins Lieder) wurden mit jedem Lagerbesuch neu gewürfelt – Lauf sofort
       aufgeben = beliebig oft neu würfeln. Neue Saat jetzt nur, wenn der letzte Lauf mindestens einen Durchgang erreicht hat. */
    if (m.lgFar || m.offerN == null) { m.offerN = (m.offerN | 0) + 1; m.lgFar = false; }
    resetSprites();
    try { autoWanted(); } catch (_) {}
    camp = { lv, st, t: 0, res: [], hens: [], folk: [], chatT: 6, trickT: 8, gravLeft: lvl("sigrun") >= 3 ? 2 : lvl("sigrun") >= 1 ? 1 : 0, seed: ((m.offerN | 0) * 7919) >>> 0, offers: null, songOffer: null, said: {} };
    const add = o => { (Z.interacts = Z.interacts || []).push(o); return o; };
    /* Bewohner auf ihren Plätzen */
    for (const p of lv.plots) {
      if (p.bau) { add({ x: (p.x0 + p.w / 2) * T, y: (p.gy + 1) * T, r: 30, h: 34, label: () => L(["Bauplatz", "Building plot"]), use: () => rumorSay(p) }); continue; }
      const R = RES[p.id], x = (p.x0 + p.w * (FX_AT[p.id] || 0.74)) * T, y = (p.gy + 1) * T;
      const o = { id: p.id, p, x, y, face: -1, t: Math.random() * 9, new: !(m.res[p.id] && m.res[p.id].met) };
      camp.res.push(o);
      add({ x, y, r: 24, h: 34, lagerRes: p.id, label: () => (p.id === "lied" ? L(["Barradins Bühne · Lied wählen", "Barradin's stage · choose a song"]) : R.n + " · " + L(R.r)) + (o.new ? " · " + L(["neu!", "new!"]) : ""), use: () => talk(p.id) });
    }
    /* Jori steht am Waffenständer */
    if (has("jori")) {
      const x = lv.lcore.jori * T + T2, y = 12 * T, o = { id: "jori", x, y, face: 1, t: 0, new: !m.res.jori.met };
      camp.res.push(o);
      add({ x, y, r: 16, h: 32, lagerRes: "jori", label: () => "Jori · " + L(RES.jori.r) + (o.new ? " · " + L(["neu!", "new!"]) : ""), use: () => talk("jori") });
    }
    /* Gedenkstein, Steckbriefe, Wegweiser */
    add({ x: lv.lcore.stone * T + T2, y: 12 * T, r: 22, h: 40, label: () => L(["Gedenkstein · Lagerchronik", "Memorial stone · camp chronicle"]), use: () => chronicle() });
    if (st >= 2 || wantedList.length) add({ x: lv.lcore.board * T + T2, y: 12 * T, r: 20, h: 50, label: () => L(["Steckbriefe", "Wanted posters"]) + (wantedList.length ? " (" + wantedList.length + ")" : ""), use: () => wantedOpen() });
    for (const sx of [lv.lcore.sign]) if (sx != null) add({ x: sx * T, y: 12 * T, r: 22, h: 34, label: () => L(["Schnellweg zum Tor", "Shortcut to the gate"]), use: () => fastTravel() });
    if (lv.lcore.signT != null && lv.terrace) add({ x: lv.lcore.signT * T, y: lv.terrace.y * T, r: 22, h: 34, label: () => L(["Schnellweg zum Tor", "Shortcut to the gate"]), use: () => fastTravel() });
    /* zusätzliche Stationen anderer Module */
    placeStations(lv, add);
    /* Leben: Hühner, Gefolge, Ziege, Wache */
    const ox = lv.ox || 0, wx0 = 3 * T, wx1 = (ox + 34) * T;
    const nh = lo() ? Math.min(1, st) : st >= 1 ? 2 + (st >= 3 ? 2 : 0) : 0;
    for (let i = 0; i < nh; i++) camp.hens.push({ x: wx0 + Math.random() * (wx1 - wx0), vx: 0, t: Math.random() * 9, st: 0, face: 1, col: i % 2 ? "#e8dcc8" : "#a0603a" });
    if (!lo() && st >= 2) { const nf = st >= 4 ? 3 : 1; for (let i = 0; i < nf; i++) camp.folk.push({ x: wx0 + Math.random() * (wx1 - wx0), tx: 0, t: Math.random() * 9, wait: Math.random() * 3, face: 1, walk: 0, kind: i % 3, col: ["#6a5a3a", "#7a3a2a", "#4a5a2a"][i % 3] }); }
    const wp = lv.plots.find(p => p.id === "wendel" && !p.lvl);
    camp.goat = !lo() && st >= 3 ? { x: wp ? (wp.x0 + 1.2) * T : (ox + 6) * T, t: 0 } : null;
    camp.guard = !lo() && st >= 4 && ox >= 12;
    /* Lichterketten: Masten an den Platzgrenzen und im Kern */
    camp.poles = [];
    if (st >= 1) { for (const p of lv.plots) if (!p.lvl) camp.poles.push(p.x0 * T + 4); camp.poles.push((ox + 2) * T, (ox + 21) * T, (ox + 33) * T); camp.poles.sort((a, b) => a - b); }
    /* Neuigkeiten beim Ankommen */
    const fresh = camp.res.filter(o => o.new).map(o => RES[o.id].n === "Barradin" ? L(RES[o.id].obj) : RES[o.id].n);
    const stUp = st > (m.stageSeen | 0);
    later(() => {
      if (!camp || camp.lv !== lv) return;
      if (stUp) { m.stageSeen = st; save(); ui().banner && ui().banner(L(["Das Lager wächst", "The camp grows"]) + " · " + L(STAGES[st].n), L(STAGES[st].d), 4200); A.play("bell", { vol: 0.4 }); }
      if (fresh.length) notify("🏕 <b>" + L(["Neu im Lager: ", "New at camp: "]) + esc(fresh.join(", ")) + "</b><br><small>" + L(["Sprich mit ihnen – sie haben etwas für dich.", "Talk to them – they have something for you."]) + "</small>", 4200);
    }, stUp ? 3400 : 2600);
    save();
  }
  const later = (fn, ms) => window.setTimeout(fn, ms);
  function rumorSay(p) {
    const miss = Object.keys(RES).filter(id => !has(id));
    if (!miss.length) return ui().say((p.x0 + p.w / 2) * T, (p.gy + 1) * T - 30, "", L(["Alle sind da. Der Platz bleibt frei – für den, der als Nächstes zurückkommt.", "Everyone is here. The plot stays free – for whoever comes back next."]), 4200);
    const id = miss[(camp.said.bau = ((camp.said.bau | 0) + 1)) % miss.length];
    ui().say((p.x0 + p.w / 2) * T, (p.gy + 1) * T - 30, L(["Gerücht am Feuer", "Fireside rumour"]), L(RES[id].rumor), 6200);
  }
  function fastTravel() {
    const lv = Z.level; if (!lv || !lv.hub) return;
    A.play("door", { vol: 0.4, rate: 1.4 });
    ui().fade(() => { const P = Z.player; if (!P || !Z.level || !Z.level.hub) return; P.x = lv.start.x * T + T / 2 - P.w / 2; P.y = (lv.start.y + 1) * T - P.h; P.vx = P.vy = 0; P.climbing = false; Z.cam.snap(P.x + P.w / 2, P.y); });
  }

  /* ======================= LEBEN IM LAGER (pro Schritt) ======================= */
  Z.lagerTick = function (dt) {
    const lv = Z.level; if (!lv) return;
    if (lv.hub) { if (camp && camp.lv === lv) campTick(dt); return; }
    runTick(dt);
  };
  function campTick(dt) {
    const P = Z.player; camp.t += dt;
    const px = P ? P.x + P.w / 2 : 0, py = P ? P.y + P.h : 0;
    for (const o of camp.res) { o.t += dt; const near = P && Math.abs(px - o.x) < 70 && Math.abs(py - o.y) < 30; o.face = near ? (px > o.x ? 1 : -1) : o.id === "jori" ? 1 : -1; }
    /* Plaudern, wenn man in der Nähe herumsteht */
    camp.chatT -= dt;
    if (camp.chatT <= 0 && P && !ui().modalOpen) {
      camp.chatT = 11 + Math.random() * 8;
      const o = camp.res.find(o => !o.new && Math.abs(px - o.x) < 90 && Math.abs(py - o.y) < 40 && o.id !== "lied");
      if (o) ui().say(o.x, o.y - 32, RES[o.id].n, L(Z.R.pick(RES[o.id].idle)), 3800);
    }
    /* Hühner picken, laufen ein Stück, picken wieder */
    for (const h of camp.hens) {
      h.t += dt; h.st -= dt;
      if (h.st <= 0) { h.st = 1 + Math.random() * 3; h.vx = Math.random() < 0.45 ? (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 14) : 0; if (h.vx) h.face = Math.sign(h.vx); }
      if (P && Math.abs(px - h.x) < 26 && Math.abs(py - 12 * T) < 20) { h.vx = Math.sign(h.x - px || 1) * 70; h.face = Math.sign(h.vx); h.st = 0.6; if (Math.random() < dt * 3) A.play("bird", { vol: 0.15, rate: 1.6 }); }
      h.x = clamp(h.x + h.vx * dt, 3 * T, (lv0().W - 3) * T);
    }
    /* Gefolge trägt Kisten und Holz zwischen den Plätzen hin und her */
    for (const f of camp.folk) {
      f.t += dt;
      if (f.wait > 0) { f.wait -= dt; if (f.wait <= 0) { const ps = camp.lv.plots.filter(p => !p.lvl); f.tx = ps.length && Math.random() < 0.7 ? (Z.R.pick(ps).x0 + 2 + Math.random() * 6) * T : ((camp.lv.ox || 0) + 4 + Math.random() * 30) * T; } continue; }
      const d = f.tx - f.x; f.face = Math.sign(d) || f.face;
      if (Math.abs(d) < 3) { f.wait = 2 + Math.random() * 4; f.walk = 0; continue; }
      f.x += Math.sign(d) * Math.min(Math.abs(d), 38 * dt); f.walk += dt * 2.6;
    }
    if (camp.goat) { camp.goat.t += dt; }
    rexTricks(dt);
  }
  const lv0 = () => Z.level;
  /* Wendel bringt Rex Kunststücke bei – je Stufe eines mehr */
  function rexTricks(dt) {
    const L0 = lvl("wendel"); if (!L0) return;
    const w = camp.res.find(o => o.id === "wendel"); if (!w) return;
    const rex = Z.allies.find(a => a.kind === "campRex"); if (!rex) return;
    const P = Z.player, tr = camp.trick;
    if (!tr) {
      camp.trickT -= dt;
      if (camp.trickT > 0 || !P || Math.abs(P.x - w.x) > 300) return;
      camp.trickT = 16 + Math.random() * 12;
      const p = w.p, hoop = p.x0 * T + p.w * T * 0.58 + 22.4;
      camp.trick = { k: Math.floor(Math.random() * L0), ph: 0, t: 0, x0: hoop - 46, hoop, end: hoop + 30 };
      rex.lock = 30; rex.drawFn = drawTrickRex; rex.trick = camp.trick;
      return;
    }
    tr.t += dt; rex.lock = 30;
    const run = (tx, sp) => { const d = tx - (rex.x + rex.w / 2); rex.face = Math.sign(d) || rex.face; rex.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); rex.run = (rex.run || 0) + sp * dt / 12; return Math.abs(d) < 2; };
    if (tr.ph === 0) { if (run(tr.x0, 120) || tr.t > 6) { tr.ph = 1; tr.t = 0; } }
    else if (tr.ph === 1) { rex.face = 1; w.cmd = true; if (tr.t > 0.9) { tr.ph = 2; tr.t = 0; A.play("bark", { x: rex.x, vol: 0.35 }); } }
    else if (tr.ph === 2) {
      const dur = tr.k === 0 ? 1.1 : 1.4;
      if (tr.k === 0) { run(tr.end, 105); tr.jy = -Math.max(0, Math.sin(clamp(((rex.x + rex.w / 2) - tr.x0) / (tr.end - tr.x0), 0, 1) * PI)) * 22; }
      if (tr.t > dur) { tr.ph = 3; tr.t = 0; w.cmd = false; tr.jy = 0; FX.text(w.x, w.y - 36, L(["Braver Hund!", "Good dog!"]), "#ffd27a"); for (let i = 0; i < 6; i++) FX.p({ x: rex.x + rex.w / 2, y: rex.y, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 30, life: 0.6, size: 1.4, col: "#ffd27a", kind: "spark", add: true }); }
    } else if (tr.t > 1.2) { rex.lock = 0; rex.drawFn = null; rex.trick = null; camp.trick = null; rex.st = 0; }
  }
  function drawTrickRex(c, a, t) {
    const tr = a.trick, x = a.x + a.w / 2, y = a.y + a.h;
    if (!tr || tr.ph !== 2) return Z.drawRex(c, x, y, a.face, t, tr && tr.ph === 0 ? a.run : 0, !tr || tr.ph !== 0);
    if (tr.k === 0) return Z.drawRex(c, x, y + (tr.jy || 0), a.face, t, a.run, false);
    if (tr.k === 1) { /* rollt sich über den Rücken */ const k = clamp(tr.t / 1.2, 0, 1); c.save(); c.translate(x, y - 6); c.rotate(k * TAU * a.face); Z.drawRex(c, 0, 6, a.face, t, 0, false); c.restore(); return; }
    /* Männchen machen und Pfote geben */
    c.save(); c.translate(x, y); c.rotate(-0.9 * a.face); Z.drawRex(c, 0, 0, a.face, t, 0, true); c.restore();
  }

  /* ======================= ZEICHNEN IM LAGER ======================= */
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    const lv = Z.level;
    try { if (lv && lv.hub && camp && camp.lv === lv) drawCampBack(c, cam, t); } catch (err) { if (!drawErr) { drawErr = 1; console.error(err); } }
  };
  let drawErr = 0;
  const vis = (cam, x0, x1) => x1 > cam.x - 40 && x0 < cam.x + cam.w + 40;
  function drawCampBack(c, cam, t) {
    const lv = camp.lv, st = camp.st, ox = lv.ox || 0, G = 12 * T;
    /* Palisade und Wachturm im Westen */
    if (st >= 3 && ox >= 12 && vis(cam, 0, 120)) { put(c, palisadeSprite(st, 80), T * 0.6, G - 80); if (st >= 4) put(c, towerSprite(st), 2 * T, G - 120); }
    /* Galerie: Pfosten und Geländer der zweiten Ebene */
    if (lv.terrace) {
      const tr = lv.terrace, y = tr.y * T, xa = tr.x0 * T, xb = (tr.x1 + 1) * T;
      if (vis(cam, xa, xb)) {
        c.fillStyle = "#4a3220"; for (let x = xa + 6; x < xb; x += 5 * T) { c.fillRect(x, y + 3, 2.6, G - y - 3); limb(c, x + 1, y + 16, x + 22, y + 3, 1.2, "#4a3220"); }
        c.fillStyle = "#5e3c24"; c.fillRect(xa, y - 11, xb - xa, 1.6); for (let x = xa + 3; x < xb; x += 9) c.fillRect(x, y - 11, 1.2, 11);
      }
    }
    if (lv.coreHut != null) { const x = lv.coreHut * T + 8; if (vis(cam, x - 40, x + 40)) put(c, sprite("hut:G:" + st, 64, 70, c2 => housing(c2, 32, 70, st, "#4a6a2a", "pfeil", 1)), x - 32, G - 70); }
    for (const f of lv.terrFree || []) { const x0 = f.x0 * T; if (vis(cam, x0, x0 + f.w * T)) put(c, terrSprite(f.k, f.w), x0, (f.gy + 1) * T - 40); }
    /* Plätze */
    for (const p of lv.plots) {
      const x0 = p.x0 * T, gy = (p.gy + 1) * T; if (!vis(cam, x0, x0 + p.w * T)) continue;
      if (p.bau) { put(c, bauSprite(p), x0, gy - 60); continue; }
      put(c, plotSprite(p, st), x0, gy - 96);
      stallLive(c, p, x0 + p.w * T * 0.58, gy, t);
    }
    /* Feuerbecken an den Platzgrenzen */
    if (st >= 1) for (const d of lv.lights) if (d.kind === "brazier") { const x = d.x * T + 2, y = (d.y + 1) * T; if (!vis(cam, x - 10, x + 10)) continue; c.fillStyle = "#2a2020"; c.fillRect(x - 1, y - 9, 2, 9); c.fillRect(x - 4, y - 1.4, 8, 1.4); poly(c, [x - 6, y - 12, x + 6, y - 12, x + 4, y - 8, x - 4, y - 8], "#3a3030"); Z.flame && Z.flame(c, x, y - 12, 1.1, "#ff8a2a"); }
    /* Lichterketten */
    if (st >= 1 && camp.poles.length > 1) drawLights(c, cam, t);
    /* Kern: Trophäenbalken, Gedenkstein, Steckbriefe, Wegweiser */
    const won = trophies(), ids = bossIds();
    if (won.length) {
      const bx0 = lv.lcore.beam[0] * T, bx1 = lv.lcore.beam[1] * T, w = bx1 - bx0;
      if (vis(cam, bx0, bx1)) { c.fillStyle = "#3a2418"; c.fillRect(bx0 + 2, G - 84, 2.4, 84); c.fillRect(bx1 - 4.4, G - 84, 2.4, 84); put(c, trophySprite(ids, won, w), bx0, G - 112); }
    }
    { const x = lv.lcore.stone * T + 8; if (vis(cam, x - 30, x + 30)) { put(c, stoneSprite(st), x - 20, G - 44); stoneText(c, x, G - (st >= 4 ? 5 : 0), t, st); } }
    if (st >= 2 || wantedList.length) { const x = lv.lcore.board * T + 8; if (vis(cam, x - 30, x + 30)) put(c, boardSprite(wantedList), x - 22, G - 46); }
    for (const sx of [lv.lcore.sign]) if (sx != null && vis(cam, sx * T - 20, sx * T + 20)) put(c, signSprite(), sx * T - 17, G - 30);
    if (lv.lcore.signT != null && lv.terrace) { const sx = lv.lcore.signT * T; put(c, signSprite(), sx - 17, lv.terrace.y * T - 30); }
    for (const s of stations) if (s.placed && s.draw && vis(cam, s.x - 30, s.x + 30)) { try { s.draw(c, s.x, s.y, t); } catch (_) {} }
  }
  /* Zahlen auf dem Gedenkstein (lebendig, damit nichts neu gemalt werden muss) */
  /* Text und Stufenrauten als kleines Bild zwischenspeichern (5 px je Welteinheit) – Schrift je Bild ist auf Handhelds teuer */
  let stoneTx = null;
  (Z._cachesNeu = Z._cachesNeu || []).push(() => { stoneTx = null; }); /* W22 Geist */
  function stoneText(c, x, gy, t, st) {
    const M = Z.meta, key = (M.runs || 0) + "|" + (M.deaths || 0) + "|" + st + "|" + L(["Läufe", "runs"]) + "|" + (document.fonts ? document.fonts.status : "");
    if (!stoneTx || stoneTx.key !== key) {
      const K = 5, cv = stoneTx && stoneTx.cv || document.createElement("canvas"); cv.width = 24 * K; cv.height = 26 * K;
      const g = cv.getContext("2d"); g.setTransform(K, 0, 0, K, 0, 0); g.clearRect(0, 0, 24, 26);
      stoneTextRaw(g, 12, 28, st); stoneTx = { key, cv };
    }
    c.drawImage(stoneTx.cv, x - 12, gy - 28, 24, 26);
    if (st >= 2 && !lo()) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x + 13, gy - 7, 6 + Math.sin(t * 7) * 0.8, "rgba(255,190,100,.45)"); c.restore(); Z.flame && Z.flame(c, x + 13, gy - 6, 0.35, "#ffb060"); }
  }
  function stoneTextRaw(c, x, gy, st) {
    const M = Z.meta;
    c.save(); c.textAlign = "center"; c.font = "700 4.6px 'IM Fell English SC',serif"; c.fillStyle = "rgba(230,214,190,.85)";
    c.fillText(String(M.runs || 0), x, gy - 22); c.font = "700 2.8px 'Alegreya Sans',sans-serif"; c.fillStyle = "rgba(220,200,180,.7)"; c.fillText(L(["Läufe", "runs"]), x, gy - 19);
    c.font = "700 3.8px 'IM Fell English SC',serif"; c.fillStyle = "rgba(230,180,170,.8)"; c.fillText("† " + (M.deaths || 0), x, gy - 13.4);
    for (let i = 0; i < STAGES.length; i++) { const on = i <= st; poly(c, [x - 7.5 + i * 3, gy - 9.6, x - 6.5 + i * 3, gy - 8.6, x - 7.5 + i * 3, gy - 7.6, x - 8.5 + i * 3, gy - 8.6], on ? "#e5b454" : "rgba(40,30,30,.6)"); }
    c.restore();
  }
  function drawLights(c, cam, t) {
    const poles = camp.poles, y0 = 12 * T - 58, low = lo();
    c.save();
    for (let i = 0; i < poles.length; i++) { const x = poles[i]; if (!vis(cam, x - 4, x + 4)) continue; c.fillStyle = "#4a3220"; c.fillRect(x - 1, y0 - 2, 2, 12 * T - y0 + 2); circ(c, x, y0 - 2, 1.4, "#6a4a2e"); }
    const cols = ["#ffcf7a", "#ff8a5a", "#e5b454", "#ff9ad0", "#ffe0a0"];
    for (let i = 0; i < poles.length - 1; i++) {
      const a = poles[i], b = poles[i + 1]; if (b - a > 16 * T || b - a < 3 * T || !vis(cam, a, b)) continue;
      const sag = 10 + (b - a) * 0.04, sw = Math.sin(t * 0.9 + i) * 0.8;
      c.strokeStyle = "rgba(40,28,20,.9)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(a, y0); c.quadraticCurveTo((a + b) / 2, y0 + sag * 2 + sw, b, y0); c.stroke();
      const n = Math.max(3, Math.round((b - a) / 14));
      for (let k = 1; k < n; k++) {
        const u = k / n, x = a + (b - a) * u, y = y0 + 4 * sag * u * (1 - u) + sw * Math.sin(u * PI) + 1.6, col = cols[(k + i) % cols.length];
        const fl = 0.75 + 0.25 * Math.sin(t * 2.3 + k * 1.7 + i);
        if (!low) { c.globalCompositeOperation = "lighter"; glow(c, x, y, 5, col, 0.35 * fl); c.globalCompositeOperation = "source-over"; }
        circ(c, x, y, 1.1, col);
      }
    }
    c.restore();
  }
  /* bewegte Teile der Stände */
  function stallLive(c, p, x, gy, t) {
    const L0 = lvl(p.id), low = lo();
    if (p.id === "quirin") {
      Z.flame && Z.flame(c, x, gy - 2, 0.7, "#ff8a2a");
      for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; c.save(); c.globalAlpha = (1 - k) * 0.8; circ(c, x - 4 + i * 4 + Math.sin(k * 6 + i) * 1.4, gy - 13 - k * 3, 0.8 + k * 0.6, ["#9ad04a", "#c8e070", "#e0f0a0"][i]); c.restore(); }
      if (!low && Math.random() < 0.06) FX.p({ x: x + (Math.random() - 0.5) * 8, y: gy - 14, vx: (Math.random() - 0.5) * 6, vy: -12 - Math.random() * 8, life: 2, size: 3, col: ["#c890ff", "#9ad04a", "#ff9a8a"][(Math.random() * 3) | 0], kind: "smoke" });
    } else if (p.id === "sigrun" && L0 && !low) {
      c.save(); c.globalCompositeOperation = "lighter"; const g = 0.5 + 0.5 * Math.sin(t * 1.5);
      glow(c, x - 22, gy - 12, 9 + g * 3, "rgba(200,140,255," + (0.18 + 0.2 * g).toFixed(2) + ")"); if (L0 >= 2) glow(c, x + 20, gy - 10, 8 + g * 3, "rgba(200,140,255," + (0.18 + 0.2 * (1 - g)).toFixed(2) + ")");
      c.restore();
    } else if (p.id === "lied" && L0 >= 3 && !low) {
      for (const sx of [-24, 24]) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x + sx, gy - 46, 7, "rgba(255,200,110,.45)"); c.restore(); circ(c, x + sx, gy - 46, 1.4, "#ffd890"); }
    } else if (p.id === "mira" && !low) {
      for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 1.4 + i) * 1.2; c.strokeStyle = ["#c03a5a", "#e5b454", "#d8d0c8"][i]; c.lineWidth = 0.5; if (L0 >= 1) { c.beginPath(); c.moveTo(x - 10 + i * 4, gy - 44); c.quadraticCurveTo(x - 9 + i * 4 + sw, gy - 36, x - 9 + i * 4 + sw * 1.4, gy - 30); c.stroke(); } }
    }
  }
  /* Figuren, Gefolge und Hinweise – vor den Ständen */
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (wp0) wp0.apply(this, arguments);
    const lv = Z.level;
    try {
      if (lv && lv.hub && camp && camp.lv === lv) drawCampFront(c, t);
      else if (lv && !lv.hub) drawCaptives(c, t);
    } catch (err) { if (!drawErr) { drawErr = 1; console.error(err); } }
  };
  function drawCampFront(c, t) {
    const cam = Z.cam, P = Z.player, M = Z.meta;
    if (camp.guard) { const x = 2 * T + 21, y = 12 * T - 90; c.save(); c.translate(x, y); human(c, t, { ph: 9, legs: "#3a2a22", coat: "#5a2a22", coatD: "#3a1a16", belt: "#2a1a10", skin: "#d8a888", head: c2 => poly(c2, [-3.6, -0.6, -3, -4, 3, -4, 3.8, -0.6], "#6a6260"), arms: c2 => { limb(c2, 2, -19, 4, -13, 1.8, "#5a2a22"); limb(c2, 4, -30, 4, 2, 0.8, "#6a4a2a"); poly(c2, [3, -30, 4, -34, 5, -30], "#c8c0b8"); } }); c.restore(); }
    for (const h of camp.hens) if (vis(cam, h.x - 10, h.x + 10)) drawHen(c, h, t);
    if (camp.goat && vis(cam, camp.goat.x - 20, camp.goat.x + 20)) drawGoat(c, camp.goat.x, 12 * T, t);
    for (const f of camp.folk) if (vis(cam, f.x - 10, f.x + 10)) drawFolk(c, f, t);
    for (const o of camp.res) {
      if (!vis(cam, o.x - 30, o.x + 30)) continue;
      if (o.id === "jori") drawGrind(c, o.x + 9, o.y, t);
      if (o.id !== "lied" && DRAW[o.id]) DRAW[o.id](c, o.t, o.x, o.y, o.face, false, o.id === "wendel" && o.cmd);
      if (o.id === "wendel") { const w = camp.res.find(r => r.id === "wendel"); if (w) w.cmd = !!(camp.trick && camp.trick.ph >= 1 && camp.trick.ph <= 2); }
      /* Hinweis über dem Kopf: „!“ für Neue, Raute, wenn eine Stufe bezahlbar ist, sonst die Stufen-Pips */
      const hy = o.y - 34 + Math.sin(t * 3 + o.x) * 1.2, R = RES[o.id], L0 = lvl(o.id), nx = R.ups[L0], cost = nx ? COST[o.id][L0] : 0;
      const target = Z.interactTarget && Z.interactTarget.type === "obj" && Z.interactTarget.o.lagerRes === o.id;
      if (o.new) { c.save(); c.font = "700 11px 'IM Fell English SC',serif"; c.textAlign = "center"; c.fillStyle = "#1a1010"; c.fillText("!", o.x + 0.5, hy + 0.5); c.fillStyle = "#ffd27a"; c.fillText("!", o.x, hy); c.restore(); }
      else if (nx && M.shards >= cost) { poly(c, [o.x, hy - 5, o.x + 3, hy - 2, o.x, hy + 1, o.x - 3, hy - 2], "#ffd27a"); if (!lo()) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, o.x, hy - 2, 7, "rgba(255,200,100,.35)"); c.restore(); } }
      if (!o.new && (target || (P && Math.abs(P.x + P.w / 2 - o.x) < 50 && Math.abs(P.y + P.h - o.y) < 30))) {
        const n = R.ups.length; for (let i = 0; i < n; i++) circ(c, o.x - (n - 1) * 2.2 + i * 4.4, o.y - 28, 1.2, i < L0 ? "#e5b454" : "rgba(30,20,20,.75)");
      }
    }
  }
  function drawGrind(c, x, gy, t) {
    c.fillStyle = "#4a3020"; c.fillRect(x - 6, gy - 7, 12, 2); c.fillRect(x - 5, gy - 5, 1.6, 5); c.fillRect(x + 3.4, gy - 5, 1.6, 5);
    c.save(); c.translate(x, gy - 11); c.rotate(t * 6); circ(c, 0, 0, 4.4, "#8a8070"); circ(c, 0, 0, 1, "#4a3020"); c.fillStyle = "#6a6050"; c.fillRect(-4.4, -0.4, 8.8, 0.8); c.restore();
    if (!lo() && Math.random() < 0.35) FX.p({ x: x - 3, y: gy - 13, vx: -30 - Math.random() * 30, vy: -20 - Math.random() * 30, life: 0.3, size: 1, col: "#ffd27a", kind: "spark", add: true });
  }
  function drawHen(c, h, t) {
    const x = h.x, y = 12 * T, peck = h.vx === 0 ? Math.max(0, Math.sin(h.t * 5)) : 0, b = h.vx ? Math.abs(Math.sin(h.t * 14)) * 0.8 : 0;
    c.save(); c.translate(x, y - b); c.scale(h.face, 1);
    limb(c, -1, -3, -1.4, 0, 0.6, "#e8a040"); limb(c, 1, -3, 1.4, 0, 0.6, "#e8a040");
    ell(c, 0, -5, 4, 3, h.col); poly(c, [-3.6, -6, -6, -9, -4.4, -4], h.col);
    c.save(); c.translate(3, -7 + peck * 4); c.rotate(peck * 0.8); circ(c, 0, -1, 1.8, h.col); poly(c, [-0.6, -3.4, 0.6, -3.8, 1, -2.6], "#c8302a"); poly(c, [1.4, -1.4, 3.2, -0.8, 1.4, -0.2], "#e8a040"); c.fillStyle = "#1a1010"; c.fillRect(0.6, -1.8, 0.7, 0.7); c.restore();
    c.restore();
  }
  function drawGoat(c, x, y, t) {
    const chew = Math.sin(t * 6) * 0.4;
    c.save(); c.translate(x, y);
    for (const lx of [-5, -3, 3, 5]) limb(c, lx, -6, lx, 0, 1, "#5a4a3a");
    ell(c, 0, -8, 7, 3.6, "#c8bca8"); ell(c, -1, -9.4, 5, 1.8, "#d8ccb8");
    c.save(); c.translate(7, -11); circ(c, 0, 0, 2.6, "#c8bca8"); poly(c, [1, 1, 4.4, 2.4 + chew, 1.4, 2.6], "#b8ac98"); limb(c, -1, -2, -3, -5, 0.8, "#6a5a4a"); limb(c, 0.6, -2, 0, -5.4, 0.8, "#6a5a4a"); poly(c, [2.6, 2.6, 3.4, 5, 2, 3], "#e8e0d0"); c.fillStyle = "#1a1010"; c.fillRect(0.8, -0.6, 0.8, 0.8); c.restore();
    limb(c, -7, -9, -9, -11 + Math.sin(t * 4) * 0.6, 0.8, "#c8bca8");
    c.strokeStyle = "rgba(160,140,100,.7)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(8, -9); c.quadraticCurveTo(14, -2, 20, 0); c.stroke(); c.fillStyle = "#4a3020"; c.fillRect(19.4, -4, 1.2, 4);
    c.restore();
  }
  function drawFolk(c, f, t) {
    c.save(); c.translate(f.x, 12 * T); c.scale(f.face, 1); c.scale(0.86, 0.86);
    human(c, t + f.t, { ph: f.kind, legs: "#3a2a22", coat: f.col, coatD: shadeC(f.col, 0.7), belt: "#2a1a10", skin: f.kind === 1 ? "#c8946a" : "#e0b890", walk: f.wait > 0 ? 0 : f.walk,
      head: c2 => poly(c2, [-3.6, 0.4, -3.2, -3.4, 3, -3.6, 3.6, -1.6, 0, -2.4], ["#4a2a14", "#2a1a10", "#a0602a"][f.kind]),
      arms: c2 => { limb(c2, 1, -19, 4.6, -16, 1.7, f.col); limb(c2, -1, -19, 3, -16, 1.7, shadeC(f.col, 0.7)); if (f.kind === 2) { for (let i = 0; i < 3; i++) { c2.fillStyle = i % 2 ? "#7a5232" : "#6a4428"; c2.fillRect(1 + i * 0.4, -20 - i * 2, 9, 2); } } else { c2.fillStyle = "#6a4a2a"; c2.fillRect(2, -22, 8, 7); c2.strokeStyle = "#4a3018"; c2.lineWidth = 0.5; c2.strokeRect(2.3, -21.7, 7.4, 6.4); } } });
    c.restore();
  }
  /* ======================= GESPRÄCHE & MENÜS ======================= */
  function resAt(id) { const o = camp && camp.res.find(r => r.id === id); return o || { x: Z.player ? Z.player.x : 0, y: Z.player ? Z.player.y + Z.player.h : 0 }; }
  let introTimer = 0;
  function sayLines(id, lines, done) {
    const o = resAt(id), R = RES[id]; let i = 0; clearTimeout(introTimer);
    const lv = Z.level;
    const step = () => {
      if (Z.level !== lv || !camp) return;
      if (i >= lines.length) { if (done) done(); return; }
      const txt = L(lines[i++]), ms = 2400 + txt.length * 38;
      ui().say(o.x, o.y - 32, R.n, txt, ms); introTimer = setTimeout(step, ms + 150);
    };
    step();
  }
  function talk(id) {
    const m = LM(), r = m.res[id], R = RES[id]; if (!r) return;
    const o = camp && camp.res.find(x => x.id === id);
    if (!r.met) {
      r.met = 1; if (o) o.new = false; save();
      A.play(id === "lied" ? "holy" : "ui", { vol: 0.4 });
      sayLines(id, R.intro, () => { if (id === "mira") miraStory(); });
      return;
    }
    if (!ui().modalOpen) { const at = resAt(id); ui().say(at.x, at.y - 32, R.n, L(Z.R.pick(R.idle)), 2200); }
    const lv = Z.level; setTimeout(() => { if (!ui().modalOpen && Z.level === lv && lv.hub) openMenu(id); }, 450);
  }
  function miraStory() {
    ui().open('<div class="tagebuch"><p class="tb-kopf">' + L(["Mira", "Mira"]) + '</p><h2>' + esc(L([MIRA_STORY[0], MIRA_STORY[1]])) + '</h2><p class="tb-text">' + L([MIRA_STORY[2], MIRA_STORY[3]]) + '</p><div class="knoepfe"><button data-act="close" autofocus>' + L(["Weiter", "Continue"]) + "</button></div></div>", { cls: "schmal" });
  }
  let menuId = null;
  function portrait(cv, id) {
    const c = cv.getContext("2d"), W = cv.width, H = cv.height;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3a2a22"); g.addColorStop(1, "#1a1210"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = "lighter"; const rg = c.createRadialGradient(W / 2, H * 0.62, 4, W / 2, H * 0.62, W * 0.7); rg.addColorStop(0, "rgba(255,150,70,.35)"); rg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = rg; c.fillRect(0, 0, W, H); c.restore();
    c.save(); c.scale(W / 30, W / 30);
    if (id === "lied") Z.drawNPC(c, "B", 15, H / (W / 30) - 3, performance.now() / 1000, 1);
    else if (DRAW[id]) DRAW[id](c, performance.now() / 1000, 15, H / (W / 30) - 3, 1, false);
    c.restore();
    c.strokeStyle = "#8a6a2a"; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, H - 3);
  }
  function rowHTML(id, i, name, desc, have, cost, can, act, arg) {
    const st = have ? "hat" : can ? "naechste" : "zu";
    return '<div class="lg-stufe ' + st + '"><i class="lg-pip' + (have ? " an" : "") + '"></i><div class="lg-txt"><b>' + esc(name) + "</b><small>" + esc(desc) + '</small></div><div class="lg-preis kauf">' +
      (have ? '<span class="lg-ok">✓</span>' : '<button data-act="' + act + '" data-arg="' + esc(arg) + '"' + (can && Z.meta.shards >= cost ? "" : " disabled") + ">" + cost + " ◆</button>") + "</div></div>";
  }
  function openMenu(id, keepFocus) {
    const R = RES[id], m = LM(), L0 = lvl(id), M = Z.meta; menuId = id;
    let h = '<div class="lg-kopf"><canvas class="lg-bild" width="120" height="140" data-res="' + id + '"></canvas><div class="lg-kopftxt"><h2>' + esc(id === "lied" ? L(["Barradins Bühne", "Barradin's Stage"]) : R.n) + " <small>" + esc(id === "lied" ? L(["Lieder für den Weg", "Songs for the road"]) : L(R.r)) + '</small></h2><p class="lg-zitat">' + L(["„", "“"]) + esc(L(Z.R.pick(R.idle))) + L(["“", "”"]) + '</p></div><span class="bank">' + U.fmt(M.shards) + " ◆</span></div>";
    h += '<div class="lg-liste">';
    R.ups.forEach((u, i) => { h += rowHTML(id, i, L(u.n), L(u.d), i < L0, COST[id][i], i === L0, "lgUp", id); });
    for (const k in EXTRA[id] || {}) {
      const d = EXTRA[id][k], l = m.up[id + "." + k] | 0, ok = !d.req || d.req();
      if (l >= d.max) h += rowHTML(id, 0, L(d.n) + " " + "●".repeat(l), typeof d.d === "function" ? d.d(l) : L(d.d), true, 0, false, "", "");
      else h += rowHTML(id, 0, L(d.n) + (d.max > 1 ? " " + "●".repeat(l) + "○".repeat(d.max - l) : ""), (typeof d.d === "function" ? d.d(l) : L(d.d)) + (ok ? "" : " " + L(["(noch gesperrt)", "(still locked)"])), false, d.cost[l], ok, "lgUpX", id + "|" + k);
    }
    h += "</div>" + actionHTML(id);
    h += '<div class="knoepfe"><button data-act="close">' + L(["Zurück", "Back"]) + "</button></div>";
    ui().open(h, { cls: "lager" });
    const cv = document.querySelector('#modal canvas[data-res="' + id + '"]'); if (cv) portrait(cv, id);
    if (keepFocus) setTimeout(() => { const b = document.querySelector('#modal [data-act="' + keepFocus + '"]:not([disabled])') || document.querySelector('#modal .lg-liste button:not([disabled])') || document.querySelector('#modal [data-act="close"]'); if (b) b.focus({ preventScroll: true }); }, 40);
  }
  /* Aktionen direkt am Stand: Gravur (Sigrun), Lied (Barradin), Ware (Lotte) */
  function actionHTML(id) {
    const P = Z.player, L0 = lvl(id), kb = i => (inp.device === "keys" && !ui().touchOn ? "<kbd>" + i + "</kbd> " : "");
    if (id === "sigrun" && L0 >= 1) {
      let h = '<h3>' + L(["Gravur", "Engraving"]) + ' <small class="lg-rest">' + (camp && camp.gravLeft > 0 ? camp.gravLeft + L([" übrig bei diesem Besuch", " left this visit"]) : L(["für diesen Besuch erledigt", "done for this visit"])) + "</small></h3>";
      const hands = ["a1", "a2"].filter(s => P && P.slots[s] && P.slots[s].type === "weapon" && Z.WEAPONS[P.slots[s].id]);
      if (!hands.length) return h + '<p class="hinweis">' + L(["Nimm erst eine Waffe vom Ständer – dann ritzt Sigrun ihr eine Rune ein.", "Take a weapon from the rack first – then Sigrun carves a rune into it."]) + "</p>";
      let n = 0;
      h += '<div class="lg-wahl">';
      for (const s of hands) {
        const it = P.slots[s], offers = runeOffers(it, s), full = (it.runes || []).length >= 2, swap = full && L0 >= 2;
        h += '<div class="lg-hand"><b>' + (s === "a1" ? L(["Hand 1", "Hand 1"]) : L(["Hand 2", "Hand 2"])) + ": " + esc(Z.itemTitle ? Z.itemTitle(it) : L(Z.itemDef(it).n)) + "</b>" + ((it.runes || []).length ? ' <small class="lg-runen">' + it.runes.map(k => '<span style="color:' + Z.RUNES[k].col + '">' + Z.RUNES[k].ico + " " + esc(L(Z.RUNES[k].n)) + "</span>").join(" ") + "</small>" : "") + '<div class="lg-runenwahl">';
        for (const k of offers) { n++; const r = Z.RUNES[k]; h += '<button data-act="lgGrav" data-arg="' + s + "|" + k + '" data-key="' + n + '" style="--c:' + r.col + '"' + (!camp || camp.gravLeft <= 0 || (full && !swap) ? " disabled" : "") + "><b>" + kb(n) + r.ico + " " + esc(L(r.n)) + "</b><small>" + esc(L(r.d)) + (swap ? " " + L(["(ersetzt " + L(Z.RUNES[it.runes[0]].n) + ")", "(replaces " + L(Z.RUNES[it.runes[0]].n) + ")"]) : "") + "</small></button>"; }
        h += "</div></div>";
      }
      return h + "</div>";
    }
    if (id === "lied" && L0 >= 1) {
      const offers = songOffers(), cur = LM().song;
      let h = '<h3>' + L(["Ein Lied für den Weg", "A song for the road"]) + "</h3>" + '<div class="lg-wahl lg-lieder">';
      offers.forEach((b, i) => { const d = Z.BLESS[b]; h += '<button data-act="lgSong" data-arg="' + b + '" data-key="' + (i + 1) + '" class="' + (cur === b ? "an" : "") + '"><b>' + kb(i + 1) + "♪ " + esc(L(songTitle(b))) + "</b><small>" + esc(L(d.n)) + " – " + esc(L(d.d)) + "</small></button>"; });
      return h + "</div>" + (cur ? '<p class="hinweis">' + L(["Gewählt: ", "Chosen: "]) + "<b>" + esc(L(songTitle(cur))) + "</b>" + L([" – Barradin stimmt es an, sobald du durchs Tor gehst.", " – Barradin strikes it up as soon as you pass the gate."]) + "</p>" : "");
    }
    if (id === "lotte" && L0 >= 2) {
      const offers = lotteOffers();
      let h = '<h3>' + L(["Lottes Ware", "Lotte's wares"]) + "</h3>";
      if (!offers.length) return h + '<p class="hinweis">' + L(["Ausverkauft. Komm nach dem nächsten Lauf wieder.", "Sold out. Come back after the next run."]) + "</p>";
      h += '<div class="lg-wahl">';
      offers.forEach((o, i) => { if (o.sold) return; const d = Z.itemDef(o.it), rar = Z.RARITY[o.it.rar]; h += '<button data-act="lgBuy" data-arg="' + i + '" data-key="' + (i + 1) + '" style="--c:' + rar.col + '"' + (Z.meta.shards < o.price ? " disabled" : "") + "><b>" + kb(i + 1) + esc(L(d.n)) + " · " + o.price + " ◆</b><small>" + esc(L(rar.n)) + " · " + esc(L(d.d)) + "</small></button>"; });
      return h + "</div>";
    }
    if (id === "jori" && L0 >= 1) return '<p class="hinweis">' + L(["Joris Fundstücke hängen links am Waffenständer – jedes Mal andere.", "Jori's found pieces hang on the left of the weapon rack – different ones every time."]) + "</p>";
    return "";
  }
  /* ---------- Sigrun: Runenangebot je Besuch und Hand ---------- */
  function runeOffers(it, s) {
    const d = Z.itemDef(it), have = it.runes || [], n = lvl("sigrun") >= 2 ? 3 : 2;
    /* Schildrunen nur, wenn die Waffe ein Schild ist oder eine Hand einen Schild trägt (wie Z.runePool in runen.js) */
    const P = Z.player, shDef = x => { const dd = x && Z.itemDef(x); return !!(dd && dd.kind === "shield"); };
    const shield = (d && d.kind === "shield") || !!(P && P.slots && ["a1", "a2"].some(k => shDef(P.slots[k])));
    const pool = Object.keys(Z.RUNES || {}).filter(k => !have.includes(k) && !(d && d.kind === "shield" && Z.RUNES[k].noShield) && !(Z.RUNES[k].needShield && !shield));
    /* getragene Familie (und Familien der Runen auf diesem Stück) dreifach gewichtet – je Besuch und Hand fest (Saat) */
    const fams = {}; for (const k of have) if (Z.RUNES[k] && Z.RUNES[k].fam) fams[Z.RUNES[k].fam] = 1;
    try { const a = Z.runeActive && Z.runeActive(); if (a && a.fam) for (const f in a.fam) if (a.fam[f]) fams[f] = 1; } catch (_) {}
    const R = Z.Rng((camp ? camp.seed : 1) + strHash(it.id + s)), out = [];
    while (out.length < n && pool.length) {
      let sum = 0; const w = pool.map(k => { const v = fams[Z.RUNES[k].fam] ? 3 : 1; sum += v; return v; });
      let x = R() * sum, i = 0; for (; i < pool.length - 1; i++) { x -= w[i]; if (x <= 0) break; }
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }
  /* ---------- Barradin: Liedtitel zu den Segen ---------- */
  const SONGS = {
    glas: [["Ballade vom zerbrochenen Krug", "Ballad of the Broken Jug"], ["Der Zerstörer tanzt", "The Destroyer Dances"], ["Glas und Galle", "Glass and Gall"]],
    tank: [["Vom Felsen, der nicht wich", "Of the Rock That Would Not Yield"], ["Dickes Fell", "Thick Hide"], ["„Noch nicht“, sprach der Goliath", "'Not Yet', Said the Goliath"]],
    cc: [["Spottlied auf die Weberin", "Mocking Song for the Weaver"], ["Knoten im Faden", "Knots in the Thread"], ["Bleib stehen, Kobold!", "Stand Still, Imp!"]],
    heil: [["Wiegenlied für Narben", "Lullaby for Scars"], ["Das rote Lied", "The Red Song"], ["Am Feuer von Phandalin", "By the Fire of Phandalin"]],
    nutz: [["Echos Goldgesang", "Echo's Gold Chant"], ["Der Hund, der Rex hieß", "The Dog Called Rex"], ["Pfeifenrauch und Würfelglück", "Pipe Smoke and Dice Luck"]]
  };
  const songTitle = b => { const d = Z.BLESS[b], list = SONGS[d && d.k] || SONGS.nutz; return list[strHash(b) % list.length]; };
  function songOffers() {
    if (!camp) return [];
    if (!camp.songOffer) { const R = Z.Rng(camp.seed + 77), ids = Object.keys(Z.BLESS || {}); camp.songOffer = R.shuffle(ids).slice(0, lvl("lied") >= 2 ? 3 : 2); }
    const cur = LM().song; if (cur && Z.BLESS[cur] && !camp.songOffer.includes(cur)) camp.songOffer.unshift(cur);
    return camp.songOffer;
  }
  /* ---------- Lotte: Waren aus dem Fundbuch ---------- */
  function lotteOffers() {
    if (!camp) return [];
    if (!camp.offers) {
      const R = Z.Rng(camp.seed + 911), M = Z.meta, n = lvl("lotte") >= 3 ? 2 : 1;
      const pool = Object.keys(M.found || {}).filter(id => { const d = (Z.WEAPONS[id] || Z.SKILLS[id]); return d && d.find && !d.legendaryOnly; });
      camp.offers = R.shuffle(pool).slice(0, n).map(id => { const rar = R() < 0.35 ? 2 : 1, it = Z.makeItem(id, 0, rar, R); return { it, price: rar === 2 ? 55 : 30, sold: false }; });
      const lm = LM(); if (lm.lgSoldN === lm.offerN) for (const i of lm.lgSold || []) if (camp.offers[i]) camp.offers[i].sold = true; /* W9: gekauft bleibt gekauft, bis zur nächsten Saat */
    }
    return camp.offers;
  }

  /* ---------- Gedenkstein: Lagerchronik mit Stufe, Bewohnern und Rekorden ---------- */
  function chronicle() {
    const M = Z.meta, m = LM(), st = stage(), r = ruhm(), nx = STAGES[st + 1];
    let h = "<h2>" + L(["Gedenkstein", "Memorial Stone"]) + ' <span class="bank">' + L(["Stufe ", "Stage "]) + (st + 1) + " · " + esc(L(STAGES[st].n)) + "</span></h2>";
    h += '<p class="lg-zitat">' + L(["„Hier ruhen ", "\"Here rest "]) /* W38 Text: EN begann mit „ */ + (M.deaths || 0) + L([" Versuche. Ezekiel ist jedes Mal wieder aufgestanden.“", " attempts. Ezekiel got up every single time.\""]) + "</p>";
    h += '<div class="lg-band">' + STAGES.map((s, i) => '<span class="' + (i <= st ? "an" : "") + '" title="' + esc(L(s.d)) + '">' + esc(L(s.n)) + "</span>").join("") + "</div>";
    if (nx) { const k = clamp((r - STAGES[st].at) / (nx.at - STAGES[st].at), 0, 1); h += '<div class="lg-fort"><i style="width:' + Math.round(k * 100) + '%"></i></div><p class="hinweis lg-klein">' + L(["Ruhm ", "Renown "]) + r + " / " + nx.at + L([" bis „", " until '"]) + esc(L(nx.n)) + L(["“ – Gerettete, ihre Stufen, besiegte Bosse und Enden zählen.", "' – the rescued, their stages, defeated bosses and endings count."]) + "</p>"; }
    h += '<div class="lg-leute">';
    for (const id of Object.keys(RES)) {
      const R = RES[id], got = has(id), L0 = lvl(id);
      h += '<div class="lg-person' + (got ? "" : " fehlt") + '"><canvas width="28" height="28" data-emb="' + R.emb + '" data-col="' + (got ? R.col : "#4a3a34") + '"></canvas><div><b>' + (got ? esc(id === "lied" ? L(R.obj) : R.n) : "???") + "</b> <small>" + esc(got ? (id === "lied" ? L(["Bühne", "Stage"]) : L(R.r)) + " · " + "●".repeat(L0) + "○".repeat(R.ups.length - L0) : L(R.r)) + "</small>" + (got ? "" : '<small class="lg-geruecht">' + esc(L(R.rumor)) + "</small>") + "</div></div>";
    }
    h += "</div>";
    if (lvl("alwin") >= 1) {
      const k = m.rek, row = (a, b) => "<tr><th>" + a + "</th><td>" + b + "</td></tr>";
      h += '<h3>' + L(["Alwins Rekorde", "Alwin's records"]) + '</h3><table class="lg-rek">' + row(L(["Meiste Gebiete", "Most areas"]), k.areas || 0) + row(L(["Tiefste Stufe", "Deepest tier"]), k.tier || 0) + row(L(["Meiste Kills", "Most kills"]), Math.max(k.kills || 0, (M.best && M.best.kills) || 0)) + row(L(["Meistes Gold", "Most gold"]), k.gold || 0) + row(L(["Bosse in einem Lauf", "Bosses in one run"]), k.bosses || 0) + row(L(["Längster Lauf", "Longest run"]), fmtT(k.time || 0)) + "</table>";
    } else h += '<p class="hinweis lg-klein">' + L(["Ein Chronist könnte hier deine Rekorde festhalten …", "A chronicler could record your feats here…"]) + "</p>";
    h += '<div class="knoepfe"><button data-act="close" autofocus>' + L(["Zurück", "Back"]) + "</button></div>";
    ui().open(h, { cls: "lager breit" });
    document.querySelectorAll("#modal canvas[data-emb]").forEach(cv => { const c = cv.getContext("2d"); c.fillStyle = "#2a1e1a"; c.fillRect(0, 0, 28, 28); emblem(c, cv.dataset.emb, 14, 14, 1.8, cv.dataset.col); });
  }
  const fmtT = s => { s = Math.round(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  /* ---------- Steckbriefe (für nemesis.js) ---------- */
  let wantedList = [], wantedOpts = {};
  /* Ohne eigene Liste von nemesis.js: die lebenden Nemeses aus Z.nemesis.list() aushängen */
  const RANK_COL = ["#6a3a2a", "#7a2a1a", "#8a2a4a", "#a01a1a", "#c8902a"];
  function autoWanted() {
    if (wantedOpts.manual) return;
    const NM = Z.nemesis; if (!NM || typeof NM.list !== "function") return;
    let l = []; try { l = NM.list() || []; } catch (_) { return; }
    wantedList = l.slice(0, 6).map(r => {
      const E = Z.ENEMIES[r.type], rk = clamp(r.rank | 0, 1, 5);
      return { id: r.id, n: typeof r.name === "string" ? r.name : L(r.name || ["?", "?"]), title: E ? E.n : "", col: RANK_COL[rk - 1], level: rk,
        reward: L(["Rang ", "Rank "]) + rk + (r.kills ? " · " + L(["hat dich ", "killed you "]) + r.kills + L(["× getötet", "×"]) : "") };
    });
  }
  function wantedOpen() {
    if (typeof wantedOpts.open === "function") { try { return wantedOpts.open(); } catch (err) { console.error(err); } }
    const st = Z.level && Z.level.lcore, x = st ? st.board * T + 8 : 0;
    if (!wantedList.length) return ui().say(x, 12 * T - 50, "", L(["Das Brett ist leer. Noch hat sich niemand in der Feste einen Namen bei dir gemacht.", "The board is empty. Nobody in the keep has made a name for themselves with you yet."]), 4200);
    let h = "<h2>" + L(["Gesucht", "Wanted"]) + '</h2><div class="lg-liste">';
    for (const w of wantedList.slice(0, 6)) h += '<div class="lg-stufe' + (w.defeated ? " hat" : "") + '"><i class="lg-pip' + (w.defeated ? " an" : "") + '" style="--pc:' + (w.col || "#6a2a2a") + '"></i><div class="lg-txt"><b>' + esc(typeof w.n === "string" ? w.n : L(w.n || ["?", "?"])) + "</b><small>" + esc(typeof w.title === "string" ? w.title : w.title ? L(w.title) : "") + (w.reward ? " · " + esc(String(w.reward)) : "") + "</small></div></div>";
    ui().open(h + '</div><div class="knoepfe"><button data-act="close" autofocus>' + L(["Zurück", "Back"]) + "</button></div>", { cls: "lager schmal" });
  }

  /* ---------- Stationen anderer Module ---------- */
  const stations = [];
  const EXTRA = {};
  function placeStations(lv, add) {
    let free = 0;
    for (const s of stations) {
      s.placed = false;
      if (s.ok && !s.ok()) continue;
      const near = s.near && camp.res.find(o => o.id === s.near);
      if (near) { s.x = near.x + (s.dx != null ? s.dx : -2.6) * T; s.y = near.y; }
      else { s.x = ((lv.ox || 0) + 2 + free * 2.2) * T + 8; s.y = 12 * T; free++; }
      s.placed = true;
      if (s.use) add({ x: s.x, y: s.y, r: s.r || 22, h: s.h || 34, lagerStation: s.id, label: () => (s.label ? s.label() : L(s.n || ["Station", "Station"])), use: () => s.use() });
    }
  }

  /* ---------- Kaufen ---------- */
  function celebrate(id) {
    const o = resAt(id);
    FX.burst(o.x, o.y - 16, 24, { col: ["#ffd27a", "#fff0c0", RES[id].col], sp: 90, up: 60, life: 0.8, size: 2, kind: "glow", add: true });
    A.play(id === "lied" ? "holy" : "anvil", { vol: 0.6 });
  }
  function buyUp(id) {
    const M = Z.meta, m = LM(), R = RES[id], L0 = lvl(id); if (!has(id) || L0 >= R.ups.length) return;
    const c = COST[id][L0]; if (M.shards < c) return;
    M.shards -= c; m.res[id].lvl = L0 + 1; save(); resetSprites(); celebrate(id);
    afterUp(id);
    ui().close();
    const at = resAt(id); ui().say(at.x, at.y - 32, R.n, L(Z.R.pick(R.buy)), 3000);
    emit("upgrade", { res: id, level: L0 + 1 });
    stageCheck();
    setTimeout(() => { if (Z.level && Z.level.hub && !ui().modalOpen) openMenu(id, "lgUp"); }, 900);
  }
  function buyX(arg) {
    const [id, k] = String(arg).split("|"), d = EXTRA[id] && EXTRA[id][k]; if (!d) return;
    const M = Z.meta, m = LM(), key = id + "." + k, l = m.up[key] | 0; if (l >= d.max || (d.req && !d.req())) return;
    const c = d.cost[l]; if (M.shards < c) return;
    M.shards -= c; m.up[key] = l + 1; save(); celebrate(id);
    try { d.onBuy && d.onBuy(l + 1); } catch (err) { console.error(err); }
    emit("upgrade", { res: id, id: k, level: l + 1 });
    stageCheck(); openMenu(id, "lgUpX");
  }
  function afterUp(id) {
    if (id === "jori" && Z.level && Z.level.hub && Z.setupRack) { for (let i = Z.pickups.length - 1; i >= 0; i--) if (Z.pickups[i].rack) Z.pickups.splice(i, 1); Z.setupRack(Z.level); }
    if (id === "sigrun" && camp) camp.gravLeft = Math.max(camp.gravLeft, lvl("sigrun") >= 3 ? 2 : 1);
    if (id === "lotte" && camp) camp.offers = null;
    if (id === "lied" && camp) camp.songOffer = null;
  }
  function stageCheck() {
    const m = LM(), st = stage();
    if (camp) camp.st = st;
    if (st > (m.stageSeen | 0)) {
      m.stageSeen = st; save(); resetSprites();
      setTimeout(() => { ui().banner && ui().banner(L(["Das Lager wächst", "The camp grows"]) + " · " + L(STAGES[st].n), L(STAGES[st].d), 4200); A.play("bell", { vol: 0.45 }); }, 1200);
      emit("stage", { stage: st });
    }
  }
  function engrave(arg) {
    const [s, k] = String(arg).split("|"), P = Z.player; if (!P || !camp || camp.gravLeft <= 0) return;
    const it = P.slots[s]; if (!it || !Z.RUNES[k]) return;
    it.runes = it.runes || [];
    if (it.runes.includes(k)) return;
    if (it.runes.length >= 2) { if (lvl("sigrun") < 2) return; it.runes[0] = k; } else it.runes.push(k);
    camp.gravLeft--;
    const o = resAt("sigrun"); FX.burst(P.x + P.w / 2, P.y + 6, 22, { col: [Z.RUNES[k].col, "#fff0c0"], sp: 90, up: 40, life: 0.8, size: 2, kind: "glow", add: true }); A.play("magic", { vol: 0.5, rate: 1.2 });
    FX.text(P.x + P.w / 2, P.y - 16, Z.RUNES[k].ico + " " + L(Z.RUNES[k].n), Z.RUNES[k].col, true);
    ui().close(); ui().say(o.x, o.y - 32, "Sigrun", L(["Sie hat jetzt einen Namen. Pass auf, dass sie ihn sich verdient.", "It has a name now. Make sure it earns it."]), 3200);
    Z.ui.refreshHud && Z.ui.refreshHud();
  }
  function chooseSong(b) {
    if (!Z.BLESS[b]) return; LM().song = b; save();
    const o = resAt("lied"); ui().close();
    A.play("holy", { vol: 0.35, rate: 1.3 });
    ui().say(o.x, o.y - 34, "Barradin", L(["„" + L(songTitle(b)) + "“ – gute Wahl. Ich hätte dasselbe gewählt. Ich habe es ja geschrieben.", "'" + L(songTitle(b)) + "' – good choice. I'd have chosen the same. I did write it."]), 3600);
    for (let i = 0; i < 5; i++) FX.p({ x: o.x + (Math.random() - 0.5) * 12, y: o.y - 24, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 20, life: 1.4, size: 1.8, col: "#ffd27a", kind: "glow", add: true });
  }
  function lotteBuy(i) {
    const offers = lotteOffers(), o = offers[+i], M = Z.meta; if (!o || o.sold || M.shards < o.price) return;
    M.shards -= o.price; o.sold = true; { const lm = LM(); if (lm.lgSoldN !== lm.offerN) { lm.lgSoldN = lm.offerN; lm.lgSold = []; } lm.lgSold.push(+i); } save(); A.play("coin", { vol: 0.6 });
    const at = resAt("lotte"); Z.spawnPickup("item", at.x - 14, at.y, { it: o.it, vx: 0, vy: -140, float: true });
    ui().close(); ui().say(at.x, at.y - 32, "Lotte", L(Z.R.pick(RES.lotte.buy)), 2800);
  }
  /* ======================= IN DER FESTE: Gefangene und Verirrte ======================= */
  let caps = [];
  function runTick(dt) {
    const lv = Z.level, P = Z.player; if (!P) return;
    if (areaFresh) { areaFresh = false; try { onAreaStart(lv); } catch (err) { console.error(err); } }
    if (P.lgSud > 0) P.lgSud -= dt;
    for (const k of caps) {
      k.t += dt;
      if (k.freed) continue;
      if (k.auto && k.t > k.auto) freeCaptive(k, true);
    }
    if (digs.length) for (const d of digs) { d.t += dt; if (!d.done && d.t > d.at) { d.done = true; digDrop(d); } }
  }
  function onAreaStart(lv) {
    caps = []; digs = [];
    if (!Z.run || !lv || lv.hub) return;
    if (lv.passage) { if (Z.run.lgSong && lvl("lied") >= 3) { const P = Z.player; Z.healPlayer(P.hpMax * 0.2); FX.text(P.x + P.w / 2, P.y - 16, "♪ " + L(["Refrain", "Chorus"]), "#ffd27a", true); for (let i = 0; i < 8; i++) FX.p({ x: P.x + P.w / 2 + (Math.random() - 0.5) * 20, y: P.y, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 30, life: 1.4, size: 1.8, col: "#ffd27a", kind: "glow", add: true }); } return; }
    if (lv.biome === "torhof" && Z.run.lgSong && !Z.run.lgSongSaid) { Z.run.lgSongSaid = true; const b = Z.run.lgSong; later(() => notify("♪ <b>" + esc(L(songTitle(b))) + "</b><br><small>" + L(["Barradins Lied begleitet dich: ", "Barradin's song goes with you: "]) + esc(L(Z.BLESS[b].n)) + "</small>", 3600), 1600); }
    if (!lv.arena) { eddaReveal(lv); rexDig(lv); placeCaptive(lv); }
  }
  /* Platz suchen: steht fest, Platz links/rechts, nicht an Türen, Belohnungen oder anderen Fundstellen */
  function spotNear(lv, tx, ty, rad, pred) {
    const out = [];
    for (let y = Math.max(2, ty - rad); y <= Math.min(lv.H - 3, ty + rad); y++) for (let x = Math.max(2, tx - rad); x <= Math.min(lv.W - 3, tx + rad); x++) {
      if (!Z.standable(lv, x, y, 3) || !Z.standable(lv, x - 1, y, 2) || !Z.standable(lv, x + 1, y, 2)) continue;
      if (lv.reach && !lv.reach[y * lv.W + x]) continue;
      if ((lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3)) continue;
      if ((lv.rewards || []).some(r => Math.abs(r.x - x) < 2 && Math.abs(r.y - y) < 2)) continue;
      if (pred && !pred(x, y)) continue;
      out.push([x, y, Math.abs(x - tx) + Math.abs(y - ty)]);
    }
    out.sort((a, b) => a[2] - b[2]);
    return out[0] || null;
  }
  const busy = (lv, x, y) => {
    const pg = Z.tagebuch && Z.tagebuch.page && Z.tagebuch.page(); if (pg && Math.abs(pg.x - x) < 6 && Math.abs(pg.y - y) < 4) return true;
    if ((Z.abEvents || []).some(e => Math.abs(e.x / T - x) < 5 && Math.abs(e.y / T - y) < 3)) return true;
    if ((Z.tagebuch && Z.tagebuch.scouts ? Z.tagebuch.scouts() : []).some(s => Math.abs(s.x - x) < 6 && Math.abs(s.y - y) < 3)) return true;
    return false;
  };
  function placeCaptive(lv) {
    const run = Z.run, m = LM(); if (!lv.cells) return;
    run.lgCap = run.lgCap | 0; if (run.lgCap >= 2) return;
    const tier = (Z.BIOMES[lv.biome] || {}).tier || 0;
    const cand = Object.keys(RES).filter(id => !has(id) && (RES[id].where === "side" || RES[id].where === "vault") && tier >= RES[id].min);
    if (!cand.length) return;
    const pref = cand.filter(id => RES[id].bio.includes(lv.biome)), pool = pref.length ? pref : m.pity >= 3 ? cand : [];
    if (!pool.length) { m.pity++; return; }
    const first = !m.order.length, chance = first ? (m.pity >= 1 ? 1 : 0.55) : Math.min(0.6, 0.16 + 0.09 * m.pity);
    if (Z.R() >= chance) { m.pity++; return; }
    const id = Z.R.pick(pool), R = RES[id];
    /* bevorzugt am Ende eines Nebenzweigs bzw. in der Schatzkammer */
    const st = lv.start || { x: 0, y: 0 }, far = r => Math.abs(r.x - st.x) + Math.abs(r.y - st.y) > 24;
    /* nie hinter einer Runensperre: Runenkammern (Belohnungen mit r.rune, lv.runeGates) meiden */
    const runeCells = new Set(); for (const r of lv.rewards || []) if (r.rune && r.cell) runeCells.add(r.cell); for (const g of lv.runeGates || []) if (g && g.cell) runeCells.add(typeof g.cell === "string" ? g.cell : g.cell.x + "," + g.cell.y);
    const okAt = (x, y) => !busy(lv, x, y) && !runeCells.has(Math.floor(x / Z.CW) + "," + Math.floor(y / Z.CH));
    const free = r => !r.rune && !(r.cell && runeCells.has(r.cell));
    let rs = (lv.rewards || []).filter(r => free(r) && far(r) && (R.where === "vault" ? r.vault : !r.vault && (r.tier || 0) >= 1));
    if (!rs.length) rs = (lv.rewards || []).filter(r => free(r) && far(r));
    let spot = null;
    for (const r of Z.R.shuffle(rs.slice())) { spot = spotNear(lv, r.x, r.y, 6, okAt); if (spot) break; }
    if (!spot) { const cells = Object.values(lv.cells).filter(c => c !== lv.startCell && (c.kind === "side" || c.kind === "secret" || c.dead) && !runeCells.has(c.x + "," + c.y)); for (const c of Z.R.shuffle(cells)) { spot = spotNear(lv, c.x * Z.CW + (Z.CW >> 1), c.y * Z.CH + (Z.CH >> 1), 8, okAt); if (spot) break; } }
    if (!spot) { m.pity++; return; }
    m.pity = 0; run.lgCap++; save();
    addCaptive(id, spot[0] * T + 8, (spot[1] + 1) * T, tier >= 1);
  }
  function addCaptive(id, x, y, guard, auto) {
    const k = { id, x, y, t: 0, freed: false, guard: null, auto: auto || 0, wall: Z.R() < 0.5 ? -1 : 1 };
    caps.push(k);
    if (guard && !auto) k.guard = spawnGuard(x, y);
    (Z.interacts = Z.interacts || []).push({ x, y, r: 28, h: 38, lagerCap: k, ok: () => !k.freed,
      label: () => (id === "lied" ? L(["Aufheben", "Pick up"]) + ": " + L(RES[id].obj) : L(["Befreien", "Free"]) + ": " + RES[id].n + " · " + L(RES[id].r)),
      use: () => tryFree(k) });
    return k;
  }
  function spawnGuard(x, y) {
    const lv = Z.level, B = Z.BIOMES[lv.biome]; if (!B || !Z.spawnEnemy) return null;
    const ids = Object.keys(B.foes || {}).filter(k => Z.ENEMIES[k] && !Z.ENEMIES[k].fly && !Z.ENEMIES[k].group && Z.ENEMIES[k].ai !== "turret");
    if (!ids.length) return null;
    ids.sort((a, b) => (Z.ENEMIES[b].hp || 0) - (Z.ENEMIES[a].hp || 0));
    const tx = Math.floor(x / T), ty = Math.floor(y / T) - 1;
    /* Wache steht ein paar Schritte neben dem Pfahl – erst die nahe Seite, dann weiter weg */
    const sg = Z.R() < 0.5 ? -1 : 1; let sp = null;
    for (const d of [4, 6, 8, 11]) { for (const s of [sg, -sg]) { sp = spotNear(lv, tx + s * d, ty, 2, sx => Math.abs(sx - tx) >= 3); if (sp) break; } if (sp) break; }
    if (!sp) return null;
    const e = Z.spawnEnemy(ids[0], sp[0] * T + 8, (sp[1] + 1) * T, { elite: true });
    if (e) { e.lgGuard = true; e.spawnT = 0; }
    return e;
  }
  function tryFree(k) {
    if (k.freed) return;
    const g = k.guard, P = Z.player;
    if (g && !g.dead && Z.enemies.includes(g) && Math.abs(g.x - k.x) < 200 && Math.abs(g.y - k.y) < 120) {
      ui().say(k.x, k.y - 30, k.id === "lied" ? "" : RES[k.id].n, k.id === "lied" ? L(["Der Wächter lässt dich nicht an das Buch.", "The guard won't let you near the book."]) : L(["Erst der Wächter! Hinter dir!", "The guard first! Behind you!"]), 2200);
      A.play("chain", { vol: 0.4 }); g.aware = true; return;
    }
    freeCaptive(k, false);
    void P;
  }
  function freeCaptive(k, auto) {
    if (k.freed) return; k.freed = true; k.t = 0;
    const R = RES[k.id];
    A.play(k.id === "lied" ? "scroll" : "chain", { vol: 0.8 }); A.play("holy", { vol: 0.45 });
    FX.burst(k.x, k.y - 12, 22, { col: k.id === "mira" ? ["#e8e0e8", "#c03a5a"] : ["#9a8a7a", "#ffd27a"], sp: 110, up: 50, life: 0.7, size: 2.2, kind: k.id === "mira" ? "glow" : "shard", g: k.id === "mira" ? 0 : 500, add: k.id === "mira" });
    ui().say(k.x, k.y - 30, k.id === "lied" ? "" : R.n, L(Z.R.pick(R.rescue)), 4600);
    rescue(k.id);
    if (Z.dropShards && !auto) Z.dropShards(k.x, k.y - 8, 20);
    if (Z.stats) Z.stats.lgBefreit = (Z.stats.lgBefreit || 0) + 1;
    later(() => notify("🏕 <b>" + esc(k.id === "lied" ? L(R.obj) : R.n) + L([" zieht ins Lager", " moves to the camp"]) + "</b><br><small>" + esc(k.id === "lied" ? L(["Barradin wird sich freuen. Laut.", "Barradin will be pleased. Loudly."]) : L(R.r) + L([" – du findest sie im Lager vor der Feste.", " – you'll find them at the camp before the keep."])) + "</small>", 4200), auto ? 400 : 1500);
  }
  function rescue(id) {
    const m = LM(); if (!RES[id] || m.res[id]) return false;
    m.res[id] = { lvl: 0, t: Date.now(), met: 0 }; m.order.push(id); save();
    emit("rescue", { res: id });
    return true;
  }
  /* Nach Bossen: Alwin sitzt zwischen den Trümmern; nach den letzten Kämpfen fällt Mira im Kokon herab */
  function bossHook(b) {
    const lv = Z.level; if (!Z.run || !lv || !b) return;
    const A2 = lv.arena && Z.ARENAS[lv.arena], x = b.x + b.w / 2, P = Z.player;
    const pages = Z.tagebuch && Z.tagebuch.count ? Z.tagebuch.count() : 0;
    if (A2 && A2.final) {
      /* Miras letzte Seite liegt im Sturm: nach der Turmspitze immer, nach den anderen Enden nur, wer (fast) alle Seiten kennt */
      if (!has("mira") && (lv.arena === "venomfang" || pages >= 13)) {
        const tx = Math.floor((P ? P.x + P.w / 2 : x) / T) + 4, sp = spotNear(lv, tx, Math.floor((P ? P.y + P.h : b.y + b.h) / T) - 1, 8);
        if (sp) later(() => { if (Z.level === lv) { const k = addCaptive("mira", sp[0] * T + 8, (sp[1] + 1) * T, false, 2.2); k.drop = 1; A.play("web", { vol: 0.5 }); } }, 700);
      }
      return;
    }
    if (!has("alwin") && (lv.arena ? Z.R() < 0.55 : b.warden && Z.R() < 0.18)) {
      const tx = Math.floor(x / T), sp = spotNear(lv, tx + 5, Math.floor((b.y + b.h) / T) - 1, 8) || spotNear(lv, tx - 5, Math.floor((b.y + b.h) / T) - 1, 8);
      if (sp) later(() => { if (Z.level === lv) { addCaptive("alwin", sp[0] * T + 8, (sp[1] + 1) * T, false); notify("📜 " + L(["Zwischen den Trümmern sitzt jemand und schreibt …", "Someone is sitting among the rubble, writing…"]), 3000); } }, 1800);
    }
  }
  function drawCaptives(c, t) {
    const cam = Z.cam;
    for (const k of caps) {
      const x = k.x, y = k.y;
      /* nur im Bild (Faden des Kokons reicht weit nach oben) */
      if (x < cam.x - 200 || x > cam.x + cam.w + 200 || y + 40 < cam.y || y - 300 > cam.y + cam.h) continue;
      if (k.freed) {
        if (k.id === "lied" || k.t > 3.2) continue;
        const a = 1 - k.t / 3.2, dir = Z.player && Z.player.x > x ? -1 : 1;
        c.save(); c.globalAlpha = a; DRAW[k.id](c, t, x + dir * k.t * 46, y, dir, false); c.restore(); continue;
      }
      if (k.id === "lied") { /* Buch in kleinem Käfig auf einem Sockel */
        DRAW.lied(c, t, x, y); c.strokeStyle = "#5a5056"; c.lineWidth = 0.8; for (let i = -7; i <= 7; i += 3.5) { c.beginPath(); c.moveTo(x + i, y - 10); c.lineTo(x + i, y - 26); c.stroke(); } ell(c, x, y - 26, 8, 2, "#4a4046");
      } else if (k.id === "mira") { /* Seidenkokon, der herabsinkt und aufreißt */
        const drop = k.drop ? clamp(k.t / 1.2, 0, 1) : 1, cy = y - 14 - (1 - drop) * 80;
        c.strokeStyle = "rgba(230,220,230,.7)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, cy - 14 - 200); c.lineTo(x, cy - 14); c.stroke();
        ell(c, x, cy, 7, 14, "#e8e0e0"); ell(c, x - 2, cy - 2, 4, 10, "#f4f0ee"); c.strokeStyle = "rgba(190,170,180,.7)"; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x - 7, cy + i * 5); c.quadraticCurveTo(x, cy + i * 5 + 3, x + 7, cy + i * 5 - 1); c.stroke(); }
        if (!lo()) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, cy, 18, "rgba(200,60,110,.3)"); c.restore(); }
      } else {
        /* Pfahl mit Ketten, die Gestalt kniet */
        const f = k.wall, px = x + f * 9;
        c.fillStyle = "#4a3020"; c.fillRect(px - 1.6, y - 30, 3.2, 30); c.fillStyle = "#3a2418"; c.fillRect(px - 3, y - 2, 6, 2);
        c.strokeStyle = "#6a625c"; c.lineWidth = 0.8; c.setLineDash([1.5, 1]); c.beginPath(); c.moveTo(px, y - 18); c.quadraticCurveTo(x + f * 4, y - 8, x + f * 1.5, y - 13); c.stroke(); c.setLineDash([]);
        c.save(); c.translate(x, y + 5); c.scale(1, 0.82); DRAW[k.id](c, t, 0, 0, -f, true); c.restore();
        if (Math.sin(t * 0.8 + x) > 0.93) { c.save(); c.font = "italic 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "rgba(232,216,200,.85)"; c.fillText(L(["Hier! Hilfe!", "Over here! Help!"]), x, y - 30); c.restore(); }
      }
      /* Leuchtfaden nach oben: in der Ferne sichtbar */
      if (!lo()) { c.save(); c.globalCompositeOperation = "lighter"; const g = 0.5 + 0.5 * Math.sin(t * 2 + x); glow(c, x, y - 18, 16 + g * 4, "rgba(255,200,110," + (0.18 + 0.12 * g).toFixed(2) + ")"); c.restore(); }
    }
  }

  /* ======================= WIRKUNGEN ======================= */
  /* Edda: Eingangsbereich aufdecken */
  function eddaReveal(lv) {
    const L0 = lvl("edda"); if (!L0 || !Z.explored || !lv.start) return;
    const rx = L0 >= 3 ? 44 : 26, ry = L0 >= 3 ? 20 : 12, s = lv.start;
    for (let y = Math.max(0, s.y - ry); y <= Math.min(lv.H - 1, s.y + ry); y++) for (let x = Math.max(0, s.x - rx); x <= Math.min(lv.W - 1, s.x + rx); x++) Z.explored[y * lv.W + x] = 1;
    /* W9 R14 (Vorschlag Karten-Agent): zusätzlich die Ausgangsräume aufdecken */
    for (const d of lv.doors || []) if (d.kind === "exit") { for (let y = Math.max(0, d.y - 6); y <= Math.min(lv.H - 1, d.y + 4); y++) for (let x = Math.max(0, d.x - 10); x <= Math.min(lv.W - 1, d.x + 10); x++) Z.explored[y * lv.W + x] = 1; if (Z.fogSeen) Z.fogSeen().add(Math.floor(d.x / Z.CW) + "," + Math.floor(d.y / Z.CH)); }
    if (Z.fogSeen && lv.cells) { const sc = lv.startCell; if (sc) for (const key in lv.cells) { const c2 = lv.cells[key]; if (Math.abs(c2.x - sc.x) + Math.abs(c2.y - sc.y) <= (L0 >= 3 ? 2 : 1)) Z.fogSeen().add(key); } }
  }
  /* Wendel: Rex gräbt am Eingang etwas aus */
  let digs = [];
  function rexDig(lv) {
    if (lvl("wendel") < 2 || !Z.player || !Z.spawnAlly) return;
    const P = Z.player, sp = spotNear(lv, Math.floor((P.x + P.w / 2) / T) + 4, Math.floor((P.y + P.h) / T) - 1, 4);
    if (!sp) return;
    const x = sp[0] * T + 8, y = (sp[1] + 1) * T;
    digs.push({ x, y, t: 0, at: 2.4, done: false });
    later(() => { if (Z.level !== lv || !Z.player) return; const a = Z.spawnAlly("rex", x - 30, y - 13, { dmg: 6, life: 3.2 }); if (a) a.lgDig = true; A.play("bark", { vol: 0.35 }); }, 900);
  }
  function digDrop(d) {
    const r = Z.R(); FX.burst(d.x, d.y - 2, 12, { col: ["#6a5040", "#8a6a4a"], sp: 70, up: 40, life: 0.5, size: 2.2, kind: "smoke" });
    FX.text(d.x, d.y - 20, L(["Wuff! Ausgegraben!", "Woof! Dug up!"]), "#ffd27a");
    if (!Z.spawnReward) return;
    if (r < 0.5) Z.spawnReward("gold", d.x, d.y, { n: 22 }); else if (r < 0.8) Z.spawnReward("heil", d.x, d.y, { drop: true }); else Z.spawnReward("glut", d.x, d.y, { n: 1 });
  }
  /* Laufstart: Lottes Reisekasse, Quirins Extra-Trank, Barradins Lied */
  function onNewRun() {
    const P = Z.player, run = Z.run, m = LM(); if (!P || !run) return;
    const lo2 = lvl("lotte"); if (lo2) P.gold = (P.gold || 0) + (lo2 >= 3 ? 120 : 70); /* W9 R14: 50 → 70 (80 wäre gleich der erste Amboss-Schlag) */
    if (lvl("quirin") >= 3) { P.potMax = (P.potMax || 2) + 1; P.potions = P.potMax; }
    if (m.song && Z.BLESS[m.song] && lvl("lied") >= 1) { if (!P.bless.includes(m.song)) P.bless.push(m.song); run.lgSong = m.song; m.song = null; Z.recalcPlayer && Z.recalcPlayer(); save(); }
    run.lgMira = 0;
  }
  /* Alwin: Rekorde am Ende eines Laufs */
  function records(why) {
    const run = Z.run, S2 = Z.stats || {}, m = LM(), k = m.rek; if (!run || run.lgRec || run.gnade /* W9: Barmherzigkeit wertet keine Rekorde */) return; run.lgRec = 1;
    const tiers = (run.route || []).map(a => (Z.BIOMES[a] ? Z.BIOMES[a].tier : Z.ARENAS[a] ? Z.ARENAS[a].tier : 0) || 0);
    const now = { areas: (run.route || []).length, tier: Math.max(0, ...tiers), kills: S2.kills || 0, gold: S2.gold || 0, bosses: (run.bossesBeaten || []).length, time: Math.round(run.time || 0) };
    const N = { areas: ["Gebiete", "areas"], tier: ["Tiefe", "depth"], kills: ["Kills", "kills"], gold: ["Gold", "gold"], bosses: ["Bosse", "bosses"], time: ["Dauer", "duration"] };
    const neu = [];
    for (const key in now) if (now[key] > (k[key] || 0)) { if ((k[key] || 0) > 0) neu.push(L(N[key])); k[key] = now[key]; }
    if (neu.length && lvl("alwin") >= 1) {
      const bonus = lvl("alwin") >= 3 ? 30 * Math.min(3, neu.length) : 0; if (bonus) Z.meta.shards += bonus;
      later(() => notify("📜 <b>" + L(["Alwin notiert neue Rekorde", "Alwin notes new records"]) + "</b><br><small>" + esc(neu.join(", ")) + (bonus ? " · +" + bonus + " ◆" : "") + "</small>", 4200), why === "end" ? 600 : 2600);
    }
    save();
  }
  function wireEffects() {
    /* Laufstart */
    const nr0 = Z.newRun; Z.newRun = function () { const r = nr0.apply(this, arguments); try { onNewRun(); } catch (err) { console.error(err); } return r; };
    /* Quirin: Trank-Ende erkennen */
    const up0 = Z.updatePlayer;
    Z.updatePlayer = function (P) {
      const before = P && P.drinkT > 0;
      const r = up0.apply(this, arguments);
      if (before && P.drinkT <= 0 && Z.run && !P.dead) {
        const L0 = lvl("quirin");
        if (L0 >= 1) { Z.healPlayer(P.hpMax * 0.15); }
        if (L0 >= 2) { P.lgSud = 4; FX.ring && FX.ring(P.x + P.w / 2, P.y + 12, 16, "#9ad04a", 0.4, 2); FX.text(P.x + P.w / 2, P.y - 18, L(["Nachglühen", "Afterglow"]), "#c8e070"); }
      }
      return r;
    };
    /* Quirin (Schaden mindern), Wendel (Rex hilft), Mira (Faden) */
    const hurt0 = Z.hurtPlayer;
    Z.hurtPlayer = function (dmg, o) {
      const P = Z.player;
      if (P && P.lgSud > 0 && typeof dmg === "number") dmg *= 0.65;
      const r = hurt0.call(this, dmg, o);
      if (r && P && !P.dead && Z.run && P.hp > 0 && P.hp <= P.hpMax * 0.3 && lvl("wendel") >= 3 && Z.level && !Z.level.lgRex && Z.spawnAlly) {
        Z.level.lgRex = true; Z.spawnAlly("rex", P.x, P.y + P.h - 14, { dmg: 10, life: 10 }); A.play("bark"); FX.text(P.x + P.w / 2, P.y - 20, L(["Rex!", "Rex!"]), "#ffd27a", true);
      }
      return r;
    };
    const death0 = Z.onPlayerDeath;
    Z.onPlayerDeath = function (o) {
      const P = Z.player, L0 = lvl("mira");
      if (P && !P.dead && Z.run && L0 >= 1 && !Z.run.lgMira) {
        Z.run.lgMira = 1;
        P.hp = Math.round(P.hpMax * (L0 >= 2 ? 0.7 : 0.4)); P.iframe = Math.max(P.iframe || 0, 2.5);
        FX.flashScreen("#c03a5a", 0.5); A.play("holy", { vol: 0.7 }); A.play("web", { vol: 0.5 });
        FX.text(P.x + P.w / 2, P.y - 18, L(["Miras Faden hält.", "Mira's thread holds."]), "#ff9ab0", true);
        FX.burst(P.x + P.w / 2, P.y + 10, 26, { col: ["#c03a5a", "#e8e0e8", "#ffd27a"], sp: 120, life: 0.9, size: 2, kind: "glow", add: true });
        if (L0 >= 2) for (const e of Z.enemies) if (!e.dead && Math.abs(e.x - P.x) < 120 && Math.abs(e.y - P.y) < 80) { e.vx = Math.sign(e.x - P.x || 1) * 280; e.vy = -160; if (Z.addStatus) Z.addStatus(e, "stun", 1.2); }
        return;
      }
      const r = death0.apply(this, arguments);
      try { records("death"); } catch (err) { console.error(err); }
      return r;
    };
    if (Z.ui && Z.ui.ending) { const end0 = Z.ui.ending; Z.ui.ending = function () { try { records("end"); } catch (_) {} return end0.apply(this, arguments); }; }
    /* Alwin: Kenne deinen Feind */
    const hit0 = Z.hitEnemy;
    Z.hitEnemy = function (e, dmg, o) {
      const L0 = lvl("alwin");
      if (L0 && e && !e.dummy && Z.run && typeof dmg === "number") {
        const n = (Z.meta.seen || {})[e.id] || 0; let f = 1;
        if (e.def && e.def.boss) { const b = (Z.meta.bosses || {})[e.id]; if (L0 >= 2 && b && b.won > 0) f = 1.08; }
        else if (L0 >= 2) f = n >= 100 ? 1.15 : n >= 30 ? 1.1 : 1; else f = n >= 15 ? 1.08 : 1; /* W9 R14: Stufe 1 war kaum spürbar (+6 % ab 30) */
        dmg *= f;
      }
      return hit0.call(this, e, dmg, o);
    };
    /* Wendel: Rex! beißt stärker */
    const ally0 = Z.spawnAlly;
    if (ally0) Z.spawnAlly = function (kind, x, y, o) { const a = ally0.apply(this, arguments); if (a && kind === "rex" && lvl("wendel") >= 1 && !a.lgDig) { a.dmg = (a.dmg || 10) * 1.5; a.life = (a.life || 10) + 4; } return a; };
    /* Bosse */
    const bd0 = Z.onBossDown;
    Z.onBossDown = function (b) { const r = bd0 ? bd0.apply(this, arguments) : undefined; try { bossHook(b); } catch (err) { console.error(err); } return r; };
    /* Jori: Waffenständer – Versatz des Kerns und Fundstücke */
    if (Z.setupRack) {
      const rk0 = Z.setupRack;
      Z.setupRack = function (lv) {
        const n0 = Z.pickups.length;
        const r = rk0.apply(this, arguments);
        try { rackExtend(lv, Z.pickups.slice(n0)); } catch (err) { console.error(err); }
        return r;
      };
    }
  }
  function rackExtend(lv, fresh) {
    const R = lv && lv.rack; if (!R) return;
    const ox = (lv.ox || 0) * T;
    if (ox) { R.x0 += ox; R.x1 += ox; R.spots = R.spots.map(x => x + ox); for (const p of fresh) if (p.rack) p.x += ox; }
    const L0 = lvl("jori"), n = L0 >= 2 ? 2 : L0 >= 1 ? 1 : 0;
    if (!n) return;
    const have = new Set(fresh.filter(p => p.rack && p.it).map(p => p.it.id));
    const pool = Object.keys(Z.meta.found || {}).filter(id => Z.WEAPONS[id] && Z.WEAPONS[id].find && !Z.WEAPONS[id].legendaryOnly && !have.has(id) && (Z.WEAPONS[id].tier || 0) <= 2);
    const Rr = Z.Rng(((LM().visits | 0) * 104729 + 17) >>> 0);
    const ids = Rr.shuffle(pool).slice(0, n), extra = [];
    for (const id of ids) {
      const it = Z.rackItem ? Z.rackItem(id) : Z.makeItem(id, 0, 1);
      if (L0 >= 3) { const d = Z.itemDef(it), rk = Object.keys(Z.RUNES || {}).filter(k => !(d && d.kind === "shield" && Z.RUNES[k].noShield)); if (rk.length) it.runes = [Rr.pick(rk)]; }
      extra.push(Z.spawnPickup("item", R.x0, R.y, { it, vx: 0, vy: 0, float: true, rack: true, lgJori: true }));
    }
    /* alle Stücke gleichmäßig über den Ständer verteilen, Joris Funde links – der Ständer wird dafür etwas länger */
    R.x0 -= extra.length * 0.9 * T;
    const all = extra.concat(fresh.filter(p => p.rack)), k = all.length;
    R.spots = [];
    all.forEach((p, i) => { const x = R.x0 + (k > 1 ? (R.x1 - R.x0) * i / (k - 1) : 0); p.x = x; R.spots.push(x); });
  }

  /* ======================= MINIKARTE: Eddas Zeichen ======================= */
  function mapMarks() {
    const mm = document.getElementById("minimap"), lv = Z.level, P = Z.player, L0 = lvl("edda");
    if (!mm || !lv || !P || lv.hub || lv.passage || L0 < 2 || !Z.explored) return;
    const big = mm.classList.contains("gross"), scale = big ? Math.min(innerWidth * 0.8 / lv.W, innerHeight * 0.7 / lv.H) : 2;
    const vw = big ? lv.W : 70, vh = big ? lv.H : 40;
    const ox = big ? 0 : U.clamp(Math.floor((P.x + P.w / 2) / T) - vw / 2, 0, Math.max(0, lv.W - vw)), oy = big ? 0 : U.clamp(Math.floor((P.y + P.h / 2) / T) - vh / 2, 0, Math.max(0, lv.H - vh));
    const c = mm.getContext("2d"), pts = [];
    const cellC = key => { const cc = lv.cells && lv.cells[key]; return cc ? [cc.x * Z.CW + Z.CW / 2, cc.y * Z.CH + Z.CH / 2] : null; };
    const E = Z.erkundung && Z.erkundung();
    for (const s of lv.secretsList || []) { if (!s.cell) continue; if (E && E.found && E.found.has(s.k === "vault" ? "vault" : s.k === "trial" ? "trial" : "x")) continue; const p = cellC(s.cell); if (p) pts.push([p[0], p[1], s.k === "secret" ? "#c890ff" : "#ffd27a", 0]); }
    if (E && E.keys) for (const k of E.keys) if (!k.got) pts.push([k.x / T, k.y / T - 1, "#ffd27a", 1]);
    if (L0 >= 3) {
      const pg = Z.tagebuch && Z.tagebuch.page && Z.tagebuch.page(); if (pg && !pg.got) pts.push([pg.x + 0.5, pg.y, "#f0e0b0", 2]);
      for (const ev of Z.abEvents || []) if (ev.k === "rune" && !ev.done) pts.push([ev.x / T, ev.y / T - 1, "#e8e0ff", 2]);
      for (const k of caps) if (!k.freed) pts.push([k.x / T, k.y / T - 1, "#ff9a5a", 2]);
    }
    for (const [x, y, col, kind] of pts) {
      const sx = (x - ox) * scale, sy = (y - oy) * scale; if (sx < -4 || sy < -4 || sx > mm.width + 4 || sy > mm.height + 4) continue;
      const r = Math.max(2.2, scale * (kind === 0 ? 1.6 : 1.3));
      c.fillStyle = "#140c0e"; c.beginPath(); c.moveTo(sx, sy - r - 1); c.lineTo(sx + r + 1, sy); c.lineTo(sx, sy + r + 1); c.lineTo(sx - r - 1, sy); c.closePath(); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(sx, sy - r); c.lineTo(sx + r, sy); c.lineTo(sx, sy + r); c.lineTo(sx - r, sy); c.closePath(); c.fill();
    }
  }
  function wireMap() {
    const mm = document.getElementById("minimap"); if (!mm || !window.MutationObserver) return;
    new MutationObserver(() => { try { mapMarks(); } catch (_) {} }).observe(mm, { attributes: true, attributeFilter: ["width", "height"] });
  }

  /* ======================= SCHNITTSTELLE ======================= */
  const listeners = {};
  function emit(evt, data) { for (const fn of listeners[evt] || []) { try { fn(data); } catch (err) { console.error(err); } } }
  Z.lager = {
    RES, STAGES,
    stage, ruhm, has, level: (res, id) => (id ? (LM().up[res + "." + id] | 0) : lvl(res)),
    residents: () => LM().order.slice(),
    rescue: id => { const ok = rescue(id); if (ok && Z.level && Z.level.hub) notify("🏕 <b>" + esc(RES[id].n) + "</b> " + L(["zieht beim nächsten Besuch ein.", "moves in on your next visit."])); return ok; },
    /* weitere Freischaltlinie bei einem Bewohner, z. B. Z.lager.addUpgrade("sigrun", "bewegung", { n:[de,en], d:[de,en] | (lvl)=>text, max:1, cost:[120], req:()=>bool, onBuy:(lvl)=>{} }) */
    addUpgrade(res, id, def) { if (!RES[res] || !def) return false; (EXTRA[res] = EXTRA[res] || {})[id] = Object.assign({ max: 1, cost: [100] }, def); return true; },
    /* freie Station im Lager: { n:[de,en], near:"sigrun", dx:-2.6, ok:()=>bool, label:()=>text, use:()=>{}, draw:(c,x,y,t)=>{} } */
    station(id, opts) { const i = stations.findIndex(s => s.id === id); const s = Object.assign({ id }, opts || {}); if (i >= 0) stations[i] = s; else stations.push(s); return s; },
    /* Steckbriefe: list = [{ id, n:"Name"|[de,en], title, col, reward, defeated, level, draw:(c,x,y,w,h)=>{} }], opts.open = () => eigenes Fenster */
    wanted(list, opts) { wantedList = Array.isArray(list) ? list.slice(0, 6) : []; wantedOpts = Object.assign({}, opts || wantedOpts, { manual: true }); resetSprites(); return wantedList.length; },
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    open: id => (has(id) ? openMenu(id) : null),
    portrait: (cv, id) => portrait(cv, id), /* W28 Lager: Bildnis für das Auftragsfenster (auftraege.js) */
    chronicle: () => chronicle(),
    /* Tests */
    _caps: () => caps, _camp: () => camp,
    _captive: (id, dx) => { const P = Z.player, lv = Z.level; if (!P || !lv) return null; const sp = spotNear(lv, Math.floor((P.x + P.w / 2) / T) + (dx || 3), Math.floor((P.y + P.h) / T) - 1, 6); return sp ? addCaptive(id, sp[0] * T + 8, (sp[1] + 1) * T, false) : null; }
  };

  /* ======================= GESTALTUNG: Pergament & Schmiedeeisen ======================= */
  const css = document.createElement("style");
  css.textContent = [
    /* Fenster: Samt im Eisenrahmen (.mbox aus zerstoerer.html) – Erzählendes (Zitat, Rekorde) auf Pergament */
    ".mbox.lager{width:min(660px,96vw)}.mbox.lager.breit{width:min(880px,96vw)}.mbox.lager.schmal{width:min(520px,96vw)}",
    ".lager .lg-kopf{display:flex;gap:var(--sp3,12px);align-items:center;margin-bottom:var(--sp1,4px)}.lager .lg-kopftxt{flex:1;min-width:0}.lager .lg-kopf h2{margin-bottom:4px}",
    ".lager canvas.lg-bild{width:60px;height:70px;border-radius:4px;flex:none;box-shadow:0 0 0 1px var(--eisen3,#3b2e28),0 0 0 2px #000,0 4px 10px rgba(0,0,0,.5)}",
    ".lager .lg-zitat{font-family:var(--fb);font-style:italic;color:var(--tinte,#2a1810);background:linear-gradient(170deg,var(--perg,#ecdcb4),var(--perg2,#d3b986));border:1px solid #8a6a3a;border-radius:4px;padding:5px 10px;margin:2px 0;font-size:var(--fs-s,13px);line-height:1.35;box-shadow:inset 0 0 18px rgba(120,80,30,.3)}",
    ".lager .lg-liste{display:flex;flex-direction:column;gap:5px}",
    ".lager .lg-stufe{display:flex;gap:10px;align-items:center;padding:6px 9px;border:1px solid #33241f;border-radius:6px;background:rgba(255,235,200,.03)}",
    ".lager .lg-stufe.hat{border-color:var(--gold3,#8a6420);background:rgba(229,180,84,.06)}.lager .lg-stufe.zu{opacity:.78;filter:saturate(.5)}",
    ".lager .lg-stufe.naechste{border-color:var(--gold,#e5b454);box-shadow:0 0 12px rgba(229,180,84,.14)}",
    ".lager .lg-txt{flex:1;min-width:0}.lager .lg-txt b{color:var(--text,#f0e6d4);font-size:var(--fs-m,15px)}.lager .lg-stufe.hat .lg-txt b{color:var(--gold,#e5b454)}.lager .lg-txt small{display:block;color:var(--mute,#ab9c8c);font-size:12.5px;line-height:1.3}",
    ".lager .lg-pip{width:11px;height:11px;flex:none;transform:rotate(45deg);border:1px solid #5e4a3c;background:#241a16}.lager .lg-pip.an{background:var(--pc,var(--gold,#e5b454));border-color:var(--gold2,#ffd27a);box-shadow:0 0 6px rgba(229,180,84,.6)}",
    ".lager .lg-preis{flex:none}.lager .lg-ok{color:var(--gold,#e5b454);font-weight:800;font-size:18px;padding:0 12px}.lager .lg-preis button{min-width:86px;font-variant-numeric:tabular-nums}",
    ".lager h3 .lg-rest{font-size:var(--fs-xs,11px);color:var(--mute,#ab9c8c);font-weight:700;margin-left:6px}",
    ".lager .lg-wahl{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:6px}",
    ".lager .lg-wahl button,.lager .lg-runenwahl button{display:flex;flex-direction:column;gap:2px;text-align:left;background:linear-gradient(#2a1a1e,#1a1014);border:1px solid var(--c,#5e4a3c);border-left-width:4px;border-radius:7px;padding:7px 10px;box-shadow:0 2px 0 rgba(0,0,0,.45);color:var(--text,#f0e6d4)}",
    ".lager .lg-wahl button b,.lager .lg-runenwahl button b{color:var(--c,var(--gold,#e5b454))}.lager .lg-wahl button small,.lager .lg-runenwahl button small{color:var(--mute,#ab9c8c);font-size:12.5px;line-height:1.25}",
    ".lager .lg-wahl button:not(:disabled):hover,.lager .lg-wahl button:focus,.lager .lg-runenwahl button:not(:disabled):hover,.lager .lg-runenwahl button:focus{box-shadow:0 0 0 1px var(--c,var(--gold,#e5b454)),0 0 16px rgba(229,180,84,.18);filter:brightness(1.1)}",
    ".lager .lg-wahl button.an{box-shadow:0 0 0 2px var(--gold,#e5b454),0 0 16px rgba(229,180,84,.35)}.lager .lg-lieder button{--c:#e5b454}",
    ".lager .lg-hand{grid-column:1/-1}.lager .lg-hand>b{color:var(--text,#f0e6d4)}.lager .lg-runen span{margin-right:6px;font-weight:800}.lager .lg-runenwahl{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px;margin-top:4px}",
    ".lager .lg-band{display:flex;gap:3px;margin:6px 0 4px;flex-wrap:wrap}.lager .lg-band span{flex:1;min-width:84px;text-align:center;font-size:var(--fs-xs,11px);font-weight:800;padding:3px 4px;border-radius:4px;background:#1a1014;color:var(--mute2,#7d6f63);border:1px solid #33241f}.lager .lg-band span.an{background:linear-gradient(#4a3220,#2a1a10);color:var(--gold2,#ffd27a);border-color:var(--gold3,#8a6420)}",
    ".lager .lg-fort{height:6px;background:#1a1014;border:1px solid #33241f;border-radius:3px;overflow:hidden}.lager .lg-fort i{display:block;height:100%;background:linear-gradient(90deg,var(--blut2,#7a1418),var(--gold,#e5b454))}",
    ".lager .lg-klein{font-size:12.5px;margin:3px 0}",
    ".lager .lg-leute{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:6px}.lager .lg-person{display:flex;gap:7px;align-items:flex-start;padding:5px 7px;border:1px solid #33241f;border-radius:6px;background:rgba(255,235,200,.03);font-size:12.5px;line-height:1.25}",
    ".lager .lg-person canvas{width:22px;height:22px;flex:none;border-radius:3px;box-shadow:0 0 0 1px var(--eisen3,#3b2e28)}.lager .lg-person b{color:var(--gold,#e5b454)}.lager .lg-person small{color:var(--mute,#ab9c8c)}",
    ".lager .lg-person.fehlt b{color:var(--mute,#ab9c8c)}.lager .lg-geruecht{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-style:italic;font-size:12px;color:var(--mute2,#9a8b7b)!important}",
    ".lager .lg-rek{border-collapse:collapse;font-size:12.5px;width:100%;color:var(--tinte,#2a1810);background:linear-gradient(170deg,var(--perg,#ecdcb4),var(--perg2,#d3b986));border:1px solid #8a6a3a;border-radius:4px;display:block;padding:4px 8px}",
    ".lager .lg-rek tbody{display:flex;flex-wrap:wrap}.lager .lg-rek tr{display:flex;width:50%;justify-content:space-between;padding:1px 10px 1px 0}.lager .lg-rek th{text-align:left;font-weight:700;color:var(--tinte2,#5a3a24)}.lager .lg-rek td{font-weight:800;font-variant-numeric:tabular-nums}",
    "@media (max-width:640px){.lager .lg-leute{grid-template-columns:repeat(2,1fr)}.lager .lg-rek tr{width:100%}}",
    "@media (max-height:600px){.lager canvas.lg-bild{width:44px;height:52px}.lager .lg-stufe{padding:3px 7px}.lager .lg-txt small{font-size:12px}.lager .lg-leute{gap:3px}.lager .lg-person{padding:3px 6px}}"
  ].join("\n");
  document.head.appendChild(css);

  /* ======================= VERKABELUNG (nachdem alle Module geladen sind) ======================= */
  /* erst nach dem Laden aller Skripte: spätere Module (schmiede.js) setzen Hooks wie Z.onBossDown neu statt sie zu verketten */
  let wired = false;
  function wire() {
    if (wired) return;
    if (document.readyState !== "complete" || !Z.ui || !Z.ui.actions) return setTimeout(wire, 30);
    wired = true;
    const act = Z.ui.actions;
    act.lgUp = id => buyUp(id); act.lgUpX = arg => buyX(arg); act.lgGrav = arg => engrave(arg); act.lgSong = b => chooseSong(b); act.lgBuy = i => lotteBuy(i);
    wireEffects(); wireMap();
    LM();
  }
  setTimeout(wire, 0);
})();
