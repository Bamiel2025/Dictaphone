export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Call Gemini API for summarization
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      // Fallback to mock response if no API key
      const summary = `Résumé automatique du texte transcrit :

• Longueur du texte : ${text.length} caractères
• Nombre de mots : ${text.split(' ').length}
• Contenu principal : ${text.substring(0, 100)}...

Pour un résumé plus précis, configurez votre clé API Gemini dans les variables d'environnement.`;

      return res.status(200).json({ summary });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Résume ce texte en français de manière concise et structurée : ${text}`
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Erreur lors de la génération du résumé';

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
}