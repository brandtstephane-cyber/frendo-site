/* ---------------------------------------------------------------------------
   LE GARDE-FOU DU SITE.

   Deux fichiers de ce projet s'appellent index.html : la vitrine, 14 Ko, et
   l'application, 509 Ko. Ils vivent dans deux depots differents, mais on les
   depose a la main, souvent entre deux clients, et le 7 novembre 2026 le
   mauvais est parti : pendant une heure, frendo.ch a demande un mot de passe
   aux visiteurs au lieu de leur presenter Frendo.

   Un marqueur de couleur dans le fichier n'aurait rien change : au moment de
   le glisser dans GitHub, on ne voit pas son contenu. Il faut donc que la
   verification soit faite par la machine, et qu'elle BLOQUE.

   Ce script s'execute a chaque publication. S'il sort en erreur, Vercel
   annule le deploiement et garde le site precedent en ligne. Mieux vaut un
   deploiement rouge qu'un site remplace.
--------------------------------------------------------------------------- */

const fs = require('fs');

const PAGE = 'index.html';
const PAGES_ATTENDUES = ['index.html', 'fonctions.html', 'conditions.html', 'confidentialite.html'];

/* Signes qui n'existent que dans l'application. Un seul suffit a condamner. */
const SIGNES_APPLICATION = ['APP_VERSION', 'manifest.webmanifest', 'MOT DE PASSE', 'API_LOT'];

/* Signes que la vitrine est bien la vitrine. */
const SIGNES_SITE = ['Tous vos réseaux', 'fonctions.html'];

function echec(titre, details) {
  console.error('\n────────────────────────────────────────────────────────');
  console.error('  PUBLICATION REFUSÉE — ' + titre);
  console.error('────────────────────────────────────────────────────────');
  details.forEach((l) => console.error('  ' + l));
  console.error('');
  console.error('  Le site en ligne n\'a PAS été modifié : il reste intact.');
  console.error('  Reprenez le bon fichier et publiez-le à nouveau.');
  console.error('────────────────────────────────────────────────────────\n');
  process.exit(1);
}

if (!fs.existsSync(PAGE)) {
  echec('index.html est absent', ['Le fichier index.html ne se trouve pas à la racine du dépôt.']);
}

const texte = fs.readFileSync(PAGE, 'utf8');
const taille = Buffer.byteLength(texte);

const intrus = SIGNES_APPLICATION.filter((s) => texte.indexOf(s) !== -1);
if (intrus.length) {
  echec("c'est l'APPLICATION qui a été déposée, pas le site", [
    'index.html contient ' + intrus.join(', ') + ' — ce sont des marques de l\'application Frendo.',
    'Taille du fichier déposé : ' + Math.round(taille / 1024) + ' Ko. La vitrine en fait environ 14.',
    '',
    'Ce fichier-là va dans le dépôt « poster », dossier public/.',
    'Le site attend l\'autre : celui dont le titre est',
    '« Frendo — tous vos réseaux, un seul ami ».',
  ]);
}

const manquants = SIGNES_SITE.filter((s) => texte.indexOf(s) === -1);
if (manquants.length) {
  echec('index.html ne ressemble pas à la vitrine', [
    'Introuvable dans le fichier : ' + manquants.map((m) => '« ' + m + ' »').join(', ') + '.',
    'Taille : ' + Math.round(taille / 1024) + ' Ko.',
    '',
    'Si vous avez volontairement réécrit la page, corrigez ces repères',
    'dans verifier.js — ils sont là pour vous protéger, pas pour vous bloquer.',
  ]);
}

const absentes = PAGES_ATTENDUES.filter((p) => !fs.existsSync(p));
if (absentes.length) {
  echec('il manque des pages', [
    'Absentes du dépôt : ' + absentes.join(', ') + '.',
    'Le menu du site renvoie vers elles : les visiteurs tomberaient sur une erreur.',
  ]);
}

console.log('Vérification du site : index.html fait ' + Math.round(taille / 1024) +
  ' Ko et porte bien les marques de la vitrine. Les ' + PAGES_ATTENDUES.length +
  ' pages sont présentes. Publication autorisée.');
