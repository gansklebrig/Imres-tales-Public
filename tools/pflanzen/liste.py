# Erzeugt arten.json: id|deutsch|wissenschaftlich|kapitel
L = """
rotbuche|Rotbuche|Fagus sylvatica|baum
stieleiche|Stieleiche|Quercus robur|baum
traubeneiche|Traubeneiche|Quercus petraea|baum
hainbuche|Hainbuche|Carpinus betulus|baum
bergahorn|Bergahorn|Acer pseudoplatanus|baum
spitzahorn|Spitzahorn|Acer platanoides|baum
feldahorn|Feldahorn|Acer campestre|baum
esche|Gemeine Esche|Fraxinus excelsior|baum
winterlinde|Winterlinde|Tilia cordata|baum
sommerlinde|Sommerlinde|Tilia platyphyllos|baum
haengebirke|Hängebirke|Betula pendula|baum
schwarzerle|Schwarzerle|Alnus glutinosa|baum
bergulme|Bergulme|Ulmus glabra|baum
vogelkirsche|Vogelkirsche|Prunus avium|baum
traubenkirsche|Traubenkirsche|Prunus padus|baum
eberesche|Eberesche|Sorbus aucuparia|baum
mehlbeere|Echte Mehlbeere|Sorbus aria|baum
elsbeere|Elsbeere|Sorbus torminalis|baum
wildapfel|Holzapfel|Malus sylvestris|baum
wildbirne|Wildbirne|Pyrus pyraster|baum
walnuss|Echte Walnuss|Juglans regia|baum
edelkastanie|Edelkastanie|Castanea sativa|baum
rosskastanie|Gewöhnliche Rosskastanie|Aesculus hippocastanum|baum
silberweide|Silberweide|Salix alba|baum
salweide|Salweide|Salix caprea|baum
zitterpappel|Zitterpappel|Populus tremula|baum
robinie|Robinie|Robinia pseudoacacia|baum
fichte|Gemeine Fichte|Picea abies|baum
weisstanne|Weißtanne|Abies alba|baum
waldkiefer|Waldkiefer|Pinus sylvestris|baum
laerche|Europäische Lärche|Larix decidua|baum
zirbe|Zirbelkiefer|Pinus cembra|baum
latsche|Latschenkiefer|Pinus mugo|baum
eibe|Europäische Eibe|Taxus baccata|baum
wacholder|Gemeiner Wacholder|Juniperus communis|strauch
hasel|Gemeine Hasel|Corylus avellana|strauch
holunder|Schwarzer Holunder|Sambucus nigra|strauch
roterholunder|Roter Holunder|Sambucus racemosa|strauch
schlehe|Schlehdorn|Prunus spinosa|strauch
weissdorn|Eingriffeliger Weißdorn|Crataegus monogyna|strauch
hundsrose|Hunds-Rose|Rosa canina|strauch
kornelkirsche|Kornelkirsche|Cornus mas|strauch
hartriegel|Roter Hartriegel|Cornus sanguinea|strauch
berberitze|Gewöhnliche Berberitze|Berberis vulgaris|strauch
sanddorn|Sanddorn|Hippophae rhamnoides|strauch
felsenbirne|Gewöhnliche Felsenbirne|Amelanchier ovalis|strauch
schneeball|Gewöhnlicher Schneeball|Viburnum opulus|strauch
pfaffenhuetchen|Pfaffenhütchen|Euonymus europaeus|strauch
liguster|Gewöhnlicher Liguster|Ligustrum vulgare|strauch
faulbaum|Faulbaum|Frangula alnus|strauch
heckenkirsche|Rote Heckenkirsche|Lonicera xylosteum|strauch
seidelbast|Echter Seidelbast|Daphne mezereum|strauch
stechpalme|Europäische Stechpalme|Ilex aquifolium|strauch
waldrebe|Gewöhnliche Waldrebe|Clematis vitalba|strauch
efeu|Gemeiner Efeu|Hedera helix|strauch
hopfen|Echter Hopfen|Humulus lupulus|strauch
heidelbeere|Heidelbeere|Vaccinium myrtillus|beere
preiselbeere|Preiselbeere|Vaccinium vitis-idaea|beere
himbeere|Himbeere|Rubus idaeus|beere
brombeere|Brombeere|Rubus fruticosus|beere
walderdbeere|Wald-Erdbeere|Fragaria vesca|beere
stachelbeere|Stachelbeere|Ribes uva-crispa|beere
tollkirsche|Schwarze Tollkirsche|Atropa belladonna|beere
einbeere|Einbeere|Paris quadrifolia|beere
nachtschatten|Bittersüßer Nachtschatten|Solanum dulcamara|beere
baerlauch|Bärlauch|Allium ursinum|kraut
maigloeckchen|Maiglöckchen|Convallaria majalis|kraut
herbstzeitlose|Herbstzeitlose|Colchicum autumnale|kraut
aronstab|Gefleckter Aronstab|Arum maculatum|kraut
brennnessel|Große Brennnessel|Urtica dioica|kraut
loewenzahn|Gewöhnlicher Löwenzahn|Taraxacum officinale|kraut
giersch|Giersch|Aegopodium podagraria|kraut
gaensebluemchen|Gänseblümchen|Bellis perennis|kraut
spitzwegerich|Spitzwegerich|Plantago lanceolata|kraut
breitwegerich|Breitwegerich|Plantago major|kraut
sauerampfer|Wiesen-Sauerampfer|Rumex acetosa|kraut
sauerklee|Wald-Sauerklee|Oxalis acetosella|kraut
gundermann|Gundermann|Glechoma hederacea|kraut
knoblauchsrauke|Knoblauchsrauke|Alliaria petiolata|kraut
vogelmiere|Vogelmiere|Stellaria media|kraut
wiesenschaumkraut|Wiesenschaumkraut|Cardamine pratensis|kraut
scharbockskraut|Scharbockskraut|Ficaria verna|kraut
brunnenkresse|Echte Brunnenkresse|Nasturtium officinale|kraut
waldmeister|Waldmeister|Galium odoratum|kraut
taubnessel|Weiße Taubnessel|Lamium album|kraut
schafgarbe|Gemeine Schafgarbe|Achillea millefolium|kraut
wiesenknopf|Kleiner Wiesenknopf|Sanguisorba minor|kraut
maedesuess|Echtes Mädesüß|Filipendula ulmaria|kraut
kamille|Echte Kamille|Matricaria chamomilla|kraut
johanniskraut|Echtes Johanniskraut|Hypericum perforatum|kraut
huflattich|Huflattich|Tussilago farfara|kraut
rotklee|Rotklee|Trifolium pratense|kraut
thymian|Arznei-Thymian|Thymus pulegioides|kraut
dost|Wilder Dost|Origanum vulgare|kraut
wasserminze|Wasserminze|Mentha aquatica|kraut
lungenkraut|Echtes Lungenkraut|Pulmonaria officinalis|kraut
beinwell|Echter Beinwell|Symphytum officinale|kraut
hirtentaeschel|Hirtentäschel|Capsella bursa-pastoris|kraut
wegwarte|Gemeine Wegwarte|Cichorium intybus|kraut
malve|Wilde Malve|Malva sylvestris|kraut
frauenmantel|Gewöhnlicher Frauenmantel|Alchemilla vulgaris|kraut
guterheinrich|Guter Heinrich|Blitum bonus-henricus|kraut
wiesenkerbel|Wiesen-Kerbel|Anthriscus sylvestris|kraut
wildemoehre|Wilde Möhre|Daucus carota|kraut
baerenklau|Wiesen-Bärenklau|Heracleum sphondylium|kraut
riesenbaerenklau|Riesen-Bärenklau|Heracleum mantegazzianum|kraut
schierling|Gefleckter Schierling|Conium maculatum|kraut
hundspetersilie|Hundspetersilie|Aethusa cynapium|kraut
wiesensalbei|Wiesen-Salbei|Salvia pratensis|kraut
klatschmohn|Klatschmohn|Papaver rhoeas|kraut
buschwindroeschen|Buschwindröschen|Anemone nemorosa|blume
leberbluemchen|Leberblümchen|Hepatica nobilis|blume
schluesselblume|Echte Schlüsselblume|Primula veris|blume
maerzenbecher|Märzenbecher|Leucojum vernum|blume
schneegloeckchen|Kleines Schneeglöckchen|Galanthus nivalis|blume
sumpfdotterblume|Sumpfdotterblume|Caltha palustris|blume
trollblume|Trollblume|Trollius europaeus|blume
tuerkenbund|Türkenbund-Lilie|Lilium martagon|blume
frauenschuh|Gelber Frauenschuh|Cypripedium calceolus|blume
edelweiss|Edelweiß|Leontopodium nivale subsp. alpinum|blume
enzian|Kochscher Enzian|Gentiana acaulis|blume
alpenrose|Rostblättrige Alpenrose|Rhododendron ferrugineum|blume
fingerhut|Roter Fingerhut|Digitalis purpurea|blume
eisenhut|Blauer Eisenhut|Aconitum napellus|blume
arnika|Arnika|Arnica montana|blume
adlerfarn|Adlerfarn|Pteridium aquilinum|farn
wurmfarn|Gewöhnlicher Wurmfarn|Dryopteris filix-mas|farn
schachtelhalm|Acker-Schachtelhalm|Equisetum arvense|farn
baerlapp|Keulen-Bärlapp|Lycopodium clavatum|farn
torfmoos|Torfmoose|Sphagnum|farn
haarmuetzenmoos|Goldenes Frauenhaarmoos|Polytrichum commune|farn
bartflechte|Bartflechten|Usnea|farn
rentierflechte|Echte Rentierflechte|Cladonia rangiferina|farn
steinpilz|Fichten-Steinpilz|Boletus edulis|pilz
marone|Maronen-Röhrling|Imleria badia|pilz
birkenpilz|Gemeiner Birkenpilz|Leccinum scabrum|pilz
rotkappe|Birken-Rotkappe|Leccinum versipelle|pilz
gallenroehrling|Gallenröhrling|Tylopilus felleus|pilz
hexenroehrling|Flockenstieliger Hexen-Röhrling|Neoboletus erythropus|pilz
satanspilz|Satans-Röhrling|Rubroboletus satanas|pilz
pfifferling|Echter Pfifferling|Cantharellus cibarius|pilz
falscherpfifferling|Falscher Pfifferling|Hygrophoropsis aurantiaca|pilz
trompetenpfifferling|Trompeten-Pfifferling|Craterellus tubaeformis|pilz
herbsttrompete|Herbsttrompete|Craterellus cornucopioides|pilz
semmelstoppel|Semmel-Stoppelpilz|Hydnum repandum|pilz
parasol|Parasol|Macrolepiota procera|pilz
riesenbovist|Riesenbovist|Calvatia gigantea|pilz
flaschenstaeubling|Flaschen-Stäubling|Lycoperdon perlatum|pilz
kartoffelbovist|Dickschaliger Kartoffelbovist|Scleroderma citrinum|pilz
hallimasch|Honiggelber Hallimasch|Armillaria mellea|pilz
glucke|Krause Glucke|Sparassis crispa|pilz
schwefelporling|Gemeiner Schwefelporling|Laetiporus sulphureus|pilz
austernseitling|Austern-Seitling|Pleurotus ostreatus|pilz
morchel|Speise-Morchel|Morchella esculenta|pilz
lorchel|Frühjahrs-Giftlorchel|Gyromitra esculenta|pilz
wiesenchampignon|Wiesen-Champignon|Agaricus campestris|pilz
karbolchampignon|Karbol-Champignon|Agaricus xanthodermus|pilz
gruenerknollenblaetterpilz|Grüner Knollenblätterpilz|Amanita phalloides|pilz
weisserknollenblaetterpilz|Kegelhütiger Knollenblätterpilz|Amanita virosa|pilz
fliegenpilz|Fliegenpilz|Amanita muscaria|pilz
pantherpilz|Pantherpilz|Amanita pantherina|pilz
perlpilz|Perlpilz|Amanita rubescens|pilz
frauentaeubling|Frauen-Täubling|Russula cyanoxantha|pilz
speitaeubling|Kirschroter Spei-Täubling|Russula emetica|pilz
fichtenreizker|Fichten-Reizker|Lactarius deterrimus|pilz
schopftintling|Schopf-Tintling|Coprinus comatus|pilz
stockschwamm|Gemeines Stockschwämmchen|Kuehneromyces mutabilis|pilz
gifthaeubling|Gift-Häubling|Galerina marginata|pilz
schwefelkopf|Grünblättriger Schwefelkopf|Hypholoma fasciculare|pilz
zunderschwamm|Zunderschwamm|Fomes fomentarius|pilz
birkenporling|Birkenporling|Fomitopsis betulina|pilz
judasohr|Judasohr|Auricularia auricula-judae|pilz
samtfussruebling|Gemeiner Samtfußrübling|Flammulina velutipes|pilz
roetelritterling|Violetter Rötelritterling|Lepista nuda|pilz
reh|Reh|Capreolus capreolus|tier
rothirsch|Rothirsch|Cervus elaphus|tier
wildschwein|Wildschwein|Sus scrofa|tier
gaemse|Gämse|Rupicapra rupicapra|tier
fuchs|Rotfuchs|Vulpes vulpes|tier
dachs|Europäischer Dachs|Meles meles|tier
feldhase|Feldhase|Lepus europaeus|tier
eichhoernchen|Eurasisches Eichhörnchen|Sciurus vulgaris|tier
baummarder|Baummarder|Martes martes|tier
luchs|Eurasischer Luchs|Lynx lynx|tier
wolf|Wolf|Canis lupus|tier
biber|Europäischer Biber|Castor fiber|tier
fischotter|Fischotter|Lutra lutra|tier
igel|Braunbrustigel|Erinaceus europaeus|tier
murmeltier|Alpenmurmeltier|Marmota marmota|tier
waschbaer|Waschbär|Procyon lotor|tier
buntspecht|Buntspecht|Dendrocopos major|tier
waldkauz|Waldkauz|Strix aluco|tier
"""
import json
a=[]
for z in L.strip().splitlines():
    i,d,w,k=z.split("|"); a.append({"id":i,"de":d,"wiss":w,"kap":k})
ids=[x["id"] for x in a]; assert len(ids)==len(set(ids))
json.dump(a,open("arten.json","w"),ensure_ascii=False,indent=0)
print(len(a))
