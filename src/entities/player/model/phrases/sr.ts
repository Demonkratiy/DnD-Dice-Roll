/**
 * Сербские реплики персонажа по классам (латиница).
 *
 * Параллель русскому/английскому наборам. Перевод вольный: сохраняем дух и юмор
 * класса, а не буквальность — можно использовать естественные для сербского
 * обороты. Полнота набора не обязательна (см. dev-wiki/localization.md).
 */

import type { ClassPhrases, PhrasesByClass } from './types.ts'

/** Нейтральный набор — когда класс героя не выбран. */
export const DEFAULT_PHRASES_SR: ClassPhrases = {
  shake: ['Tresem kockice…', 'Zveckam koščice u dlanovima…', 'Zagrevam kockice protresanjem…'],
  release: ['Kockice se vrte… hajde…', 'Lete, čekam rezultat…', 'Ukočen u iščekivanju…'],
  success: ['Kritičan uspeh! Dvadesetka!', 'Čista 20 — savršeno!', 'Krit! Bolje ne može!'],
  fail: ['Kritičan promašaj… jedinica.', 'Čista 1 — baš peh.', 'Promašaj! Kockice me izdaše.'],
}

/** Реплики по классам. Тот же характер и юмор, что и в других языках. */
export const PLAYER_PHRASES_SR: PhrasesByClass = {
  barbarian: {
    shake: [
      'TRESEM JAKO I BESNO!',
      'Tresem ih dok koščice ne zavrište!',
      'Stisnute u pesnici, tresem iz sve snage!',
      'Tresem i osećam kako bes raste!',
      'Tresem i već čujem ratni poklič u glavi!',
    ],
    release: [
      'VAAARGH! Koliko ćeš pasti?!',
      'KOLIKO ĆU IH SMRSKATI?!',
      'Eto ih! Hajde, plemenu, ne izneveri me!',
      'Lete, a ja već vidim kako gazim neprijatelje!',
      'Kotrljaju se, a krv mi ključa pred boj!',
    ],
    success: [
      'KRIT! NEPRIJATELJI, MOLITE SE!',
      'DVADESETKA! SVE ĆU SMRVITI!',
      'ČISTA 20 — RAZBIĆU U PARAMPARČAD!',
      'BES JE BACIO KRIT!',
    ],
    fail: [
      'PROMAŠAJ! SMRVIĆU OVU KOCKU U PRAH!',
      'Čista 1… sad sam još besniji!',
      'Promašio sam — ali bes mi samo raste!',
    ],
  },
  bard: {
    shake: [
      'Tresem kockice u ritmu refrena…',
      'Zveckam ih uz zvuk lutnje…',
      'Hej-ho, tresi-i-kreni…',
      'Tresem, a u glavi se već rađaju stihovi…',
      'Vrtim ih, a melodija već svira u meni…',
    ],
    release: [
      'Bubnjevi… kockice poleteše!',
      'Vrte se kao finale balade…',
      'Tiho, publiko — stiže vrhunac!',
      'Lete, a ja već vidim zadivljenu publiku!',
    ],
    success: [
      'Krit! Sala aplaudira — dvadesetka!',
      'Čista 20 — finale balade pogađa u srce!',
      'Ovacije! To je bila savršena nota!',
      'Dvadeset! Ova pesma postaće legenda!',
    ],
    fail: [
      'Jedinica… falš nota, nažalost.',
      'Čista 1 — publika se mršti.',
      'Promašaj! Lutnja jadno zacvili.',
      'Uh… izgubih ritam.',
    ],
  },
  cleric: {
    shake: [
      'Tresem kockice s molitvom na usnama…',
      'Zveckam ih, prizivajući boga kockica…',
      'Posvećujem bacanje, tresući ih u dlanu…',
      'Tresem i osećam blagoslov…',
      'Vrtim ih, a On bdi nada mnom…',
    ],
    release: [
      'Letite! Neka bude volja nebesa…',
      'Vrte se u ruci sudbine — čekam znamenje…',
      'Svevišnji, otkrij broj…',
      'Lete, a ja se uzdam da su bogovi čuli molitvu!',
    ],
    success: [
      'Dvadesetka! Nebesa blagosloviše bacanje!',
      'Krit! Volja božanstva je ispunjena!',
      'Čista 20 — čudo se obistinilo!',
      'Aleluja! Bogovi me čuše!',
    ],
    fail: [
      'Jedinica… iskušenje vere mi je poslato.',
      'Čista 1 — nebesa ćute.',
      'Promašaj… znači, postoji viši plan.',
      'Bogovi se okrenuše… prihvatam ponizno.',
    ],
  },
  druid: {
    shake: [
      'Tresem kockice kao seme u dlanovima…',
      'Zveckam ih uz šapat lišća…',
      'Tresem koščice kao šaku žira…',
      'Tresem i osećam vezu s prirodom…',
      'Vrtim ih, kao da piju snagu zemlje…',
    ],
    release: [
      'Kotrljaju se kao kamenje u planinskom potoku…',
      'Priroda odlučuje — čekam njenu reč…',
      'Ukočim se, oslušnem šta duhovi kažu…',
      'Lete, a ja već osećam prirodu na delu!',
    ],
    success: [
      'Dvadeset! Sama priroda je uz mene!',
      'Krit! Duhovi se raduju sa mnom!',
      'Čista 20 — divlja sreća!',
      'Stihije odgovoriše — savršeno bacanje!',
    ],
    fail: [
      'Jedinica… priroda je danas ćudljiva.',
      'Čista 1 — duhovi se okrenuše.',
      'Promašaj… izgleda nije sezona sreće.',
      'Avaj, koreni me izdaše.',
    ],
  },
  fighter: {
    shake: [
      'Tresem kockice uvežbanim pokretom…',
      'Zveckam ih — jedan, dva, po pravilima…',
      'Zagrevam kockice pre bacanja…',
      'Tresem, već uvežbavam taktiku u glavi…',
      'Vrtim ih, zamišljajući čist udarac…',
    ],
    release: [
      'Lete pravo i tačno — čekam pogodak…',
      'Kotrljaju se ka meti… spreman!',
      'Stojim mirno, čekam ishod…',
      'Lete, a ja već vidim kako gazim neprijatelje!',
    ],
    success: [
      'Dvadesetka! Udarac tačno u metu!',
      'Krit! Trening se isplatio!',
      'Čista 20 — pogodak po udžbeniku!',
      'Čist krit, strogo po pravilima!',
    ],
    fail: [
      'Jedinica… zatajenje u najgorem trenutku.',
      'Čista 1 — ruka mi je zadrhtala.',
      'Promašaj! Saberi se, vojniče.',
      'Pored mete… analiza kasnije.',
    ],
  },
  monk: {
    shake: [
      'Tresem kockice u toku daha…',
      'Zveckam ih — a um mi je miran…',
      'Vrtim ih polako, centrirajući či…',
      'Tresem i osećam kako energija teče kroz mene…',
      'Vrtim ih, meditirajući, čekam skladan ishod…',
    ],
    release: [
      'Kotrljaju se u savršenoj ravnoteži…',
      'Ukočen u zenu, čekam šta tok otkriva…',
      'Ommm… kockice se vrte, a ja sam miran…',
      'Brus Li je oslobodio hiljadu udaraca!',
    ],
    success: [
      'Dvadeset. Tok i telo — jedno su.',
      'Krit. Savršena ravnoteža čija.',
      'Čista 20 — sklad je postignut.',
      'Udar hiljadu pesnica — tačno u metu.',
    ],
    fail: [
      'Jedinica. Dah mi zastade na tren.',
      'Čista 1 — ravnoteža je narušena.',
      'Promašaj. Vraćam se na početak puta.',
      'Tok je nestao… prihvatam mirno.',
    ],
  },
  paladin: {
    shake: [
      'Tresem kockice u ime zakletve…',
      'Zveckam ih, prizivajući svetlost…',
      'Vrtim ih rukom koju vodi dužnost…',
      'Tresem i osećam svetu snagu u sebi…',
      'Vrtim ih, zamišljajući kako ispunjavam zavet…',
    ],
    release: [
      'Lete za slavu pravde — čekam sud…',
      'Vrte se pod pogledom nebesa…',
      'Ukočim se: neka svetlost presudi pravednom delu…',
      'Lete — a koga čeka njihova kazna?',
    ],
    success: [
      'Dvadesetka! Nagrada za održanu zakletvu!',
      'Krit! Pravda je pobedila!',
      'Čista 20 — zavet je ispunjen!',
      'Nebesa izrekoše presudu — krit!',
    ],
    fail: [
      'Jedinica… svetlost iskušava moju odlučnost.',
      'Čista 1 — ali zakletva ostaje nepokolebana.',
      'Promašaj… iskupiću se u boju.',
      'Posrnuo sam, ali neću skrenuti s puta.',
    ],
  },
  ranger: {
    shake: [
      'Tresem kockice tiho, da ne uplašim sreću…',
      'Zveckam ih, čekajući pravi tren i vetar…',
      'Vrtim ih, čitajući trag broja koji mi treba…',
      'Tresem i osećam kako se plen približava…',
      'Vrtim ih, zamišljajući čist pogodak u metu…',
    ],
    release: [
      'Lete kao strela ka cilju…',
      'Kotrljaju se ka meti — zadržavam dah…',
      'Ukočim se: gde će pasti — u centar?',
      'Lete, a ja već vidim kako pogađam metu!',
    ],
    success: [
      'Dvadeset! Pravo u centar mete!',
      'Krit! Ova strela nikad ne promašuje!',
      'Čista 20 — slep hitac, a u sridu!',
      'Savršen trag — pravo u desetku!',
    ],
    fail: [
      'Jedinica… vetar je odneo bacanje.',
      'Čista 1 — izgubih trag.',
      'Promašaj… plen mi je umakao.',
      'Pored mete… uloviću sreću drugi put.',
    ],
  },
  rogue: {
    shake: [
      'Tresem kockice… niko ne gleda, je l’ da?',
      'Zveckam ih vešto, uz par lukavih poteza…',
      'Vrtim ih u dlanu — čisto, bez traga…',
      'Tresem tiho, ne privlačeći pažnju…',
      'Okrećem ih, jedva čekam da sve nasamarim…',
    ],
    release: [
      'Eno ih, a ja gotovo da znam ishod…',
      'Kotrljaju se neprimetno — čekam svoj deo…',
      'Ukočim se u senci, čekam pravu priliku…',
      'Lete, a ja se nadam malo sreće…',
    ],
    success: [
      'Dvadesetka… ne da sam ikad sumnjao.',
      'Krit. Nameštih — i niko ne primeti.',
      'Čista 20 — čist posao.',
      'Tačno u sridu. Sreća voli okretne.',
    ],
    fail: [
      'Jedinica… baš sad, od svih trenutaka!',
      'Čista 1 — da nije neko zamenio kockice?',
      'Promašaj… praviću se da je namerno.',
      'Omaška. Nestajem u senci.',
    ],
  },
  sorcerer: {
    shake: [
      'Tresem kockice — a magija u njima vrca…',
      'Zveckam ih, divlja moć navire…',
      'Vrtim ih — varnice pucketaju među prstima…',
      'Tresem i osećam kako energija raste…',
      'Zveckam ih, a magija se otima da prsne…',
    ],
    release: [
      'Lete obavijene divljom magijom — čekam blesak…',
      'Vrte se u vrtlogu moći… šta će pasti?',
      'Ukočim se: krv će odlučiti — čekam ishod…',
      'Lete, a ja osećam njihovu moć…',
    ],
    success: [
      'Dvadeset! Divlja magija pogodi metu!',
      'Krit! Moć u mojoj krvi se pokazala!',
      'Čista 20 — stihije poslušaše!',
      'Blesak! Savršeno pražnjenje moći!',
    ],
    fail: [
      'Jedinica… magija je podivljala.',
      'Čista 1 — divlji nalet pokvari bacanje.',
      'Promašaj! Moć mi izmače kontroli.',
      'Varnice u prazno… dešava se.',
    ],
  },
  warlock: {
    shake: [
      'Tresem kockice, šapućući svom pokrovitelju…',
      'Zveckam ih po uslovima velike pogodbe…',
      'Pokrovitelj mi reče da tresem — i tresem…',
      'Tresem i osećam njegovo prisustvo…',
      'Vrtim ih, a on bdi nada mnom…',
    ],
    release: [
      'Lete voljom pakta — čekam cenu…',
      'Vrte se u tami, pokrovitelj gleda…',
      'Ukočim se: šta će mi pogodba upisati?',
      'Lete, a ja osećam njegovu moć…',
    ],
    success: [
      'Dvadeset! Pokrovitelj je zadovoljan pogodbom.',
      'Krit! Pakt je urodio plodom.',
      'Čista 20 — cena se isplatila.',
      'Pokrovitelj mi se osmehnu — krit!',
    ],
    fail: [
      'Jedinica… pokrovitelj je nezadovoljan.',
      'Čista 1 — cena pogodbe raste.',
      'Promašaj… moraću da dam još više.',
      'Pakt se okrenuo protiv mene…',
    ],
  },
  wizard: {
    shake: [
      'Tresem kockice, proračunavši izglede…',
      'Zveckam ih strogo po računici…',
      'Vrtim ih, proveravajući svaki obrt…',
      'Tresem, a u glavi se već slažu teorije…',
      'Zveckam ih, mentalno prolazeći kroz opcije…',
    ],
    release: [
      'Lete po formulama — čekam potvrdu…',
      'Vrte se po teoriji… da proverimo sada…',
      'Ukočim se: eksperiment je u toku, čekam rezultat…',
      'Lete, a ja analiziram njihovo kretanje…',
    ],
    success: [
      'Dvadeset! Verovatnoća se savršeno poklopila.',
      'Krit! Proračun se pokazao besprekornim.',
      'Čista 20 — hipoteza potvrđena!',
      'Eksperiment uspeo — maksimum na kocki!',
    ],
    fail: [
      'Jedinica… statistički izuzetak, bez sumnje.',
      'Čista 1 — nesrećna granica greške.',
      'Promašaj… revidiraću model.',
      'Minimum na kocki… malo verovatno, a evo ga.',
    ],
  },
}
