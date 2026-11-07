/* ---------------------------------------------------------------------------
   LA LISTE D'ATTENTE.

   Jusqu'ici le site disait « ecrivez-nous » avec un lien mailto. Sur un
   ordinateur de magasin ou aucune messagerie n'est configuree — c'est-a-dire
   chez une bonne partie des commercants —, cliquer ce lien n'ouvre rien du
   tout. Le visiteur croit que le site est casse, et il s'en va.

   Un champ et un bouton suffisent. Pas de service tiers : l'adresse part par
   Resend, qui envoie deja les liens de connexion de Frendo.

   Deux envois : l'avis au proprietaire, et un accuse de reception au
   visiteur. Le second n'est pas une politesse : sans lui, la personne ne sait
   pas si son adresse est bien partie, et elle recommence trois fois.
--------------------------------------------------------------------------- */

const DESTINATAIRE = 'contact@frendo.ch';
const EXPEDITEUR = 'Frendo <contact@frendo.ch>';

/* Volontairement permissif : refuser une adresse valide coute un client,
   accepter une adresse farfelue ne coute rien — elle rebondira. */
function adresseValable(a) {
  return typeof a === 'string'
    && a.length >= 6 && a.length <= 190
    && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a);
}

async function envoyer(cle, message) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cle },
    body: JSON.stringify(message),
  });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' });
    return;
  }

  const corps = req.body && typeof req.body === 'object' ? req.body : {};

  /* Piege a robots : le champ « site » est cache par la feuille de style.
     Un humain ne le voit pas, un robot le remplit. On repond « ok » pour ne
     pas lui apprendre qu'il a ete repere. */
  if (String(corps.site || '').trim()) {
    res.status(200).json({ ok: true });
    return;
  }

  const email = String(corps.email || '').trim().toLowerCase();
  const commerce = String(corps.commerce || '').trim().slice(0, 120);

  if (!adresseValable(email)) {
    res.status(400).json({ error: 'Cette adresse ne semble pas valide.' });
    return;
  }

  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    res.status(500).json({ error: "L'envoi n'est pas configuré. Écrivez-nous à contact@frendo.ch." });
    return;
  }

  const quand = new Date().toLocaleString('fr-CH', { timeZone: 'Europe/Zurich' });

  try {
    const avis = await envoyer(cle, {
      from: EXPEDITEUR,
      to: [DESTINATAIRE],
      reply_to: email,
      subject: 'Liste d\'attente Frendo — ' + email,
      text: [
        'Nouvelle inscription à la liste d\'attente.',
        '',
        'Adresse : ' + email,
        commerce ? 'Commerce : ' + commerce : 'Commerce : (non renseigné)',
        'Reçue le : ' + quand,
        '',
        'Répondre à ce message écrit directement à la personne.',
      ].join('\n'),
    });
    if (!avis.ok) {
      res.status(500).json({ error: "L'envoi a échoué. Écrivez-nous à contact@frendo.ch." });
      return;
    }

    /* L'accuse de reception ne doit jamais faire echouer l'inscription :
       l'essentiel, c'est que l'adresse soit arrivee chez nous. */
    try {
      await envoyer(cle, {
        from: EXPEDITEUR,
        to: [email],
        subject: 'Votre place est réservée',
        text: [
          'Bonjour,',
          '',
          'Votre adresse est bien enregistrée. Vous serez prévenu dès que Frendo ouvrira,',
          'avec vos 60 jours d\'essai gratuits, sans carte bancaire.',
          '',
          'Si vous avez une question d\'ici là, répondez simplement à ce message.',
          '',
          'Stéphane',
          'Frendo — tous vos réseaux, un seul ami',
          'frendo.ch',
        ].join('\n'),
      });
    } catch (e) { /* sans importance */ }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "L'envoi a échoué. Écrivez-nous à contact@frendo.ch." });
  }
};
