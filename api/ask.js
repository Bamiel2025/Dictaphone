export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    // Call Gemini API for question answering
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      // Fallback to mock response if no API key
      const answers = [
        `Question : "${question}"\n\nRéponse basée sur le contexte fourni. Le texte traite de transcription audio et d'analyse de contenu. Pour des réponses plus précises, configurez votre clé API Gemini.`,
        `En analysant le contenu, je peux répondre à votre question "${question}". Le texte semble concerner des technologies de reconnaissance vocale et d'IA. Configurez Gemini pour des réponses plus intelligentes.`,
        `Votre question "${question}" porte sur le contenu transcrit. D'après l'analyse, il s'agit de technologies audio et de synthèse. Ajoutez votre clé API Gemini pour des réponses personnalisées.`
      ];

      const answer = answers[Math.floor(Math.random() * answers.length)];
      return res.status(200).json({ answer });
    }

    const prompt = `Voici un texte transcrit : "${context}"

Question : ${question}

Réponds de manière claire et concise en français, en te basant uniquement sur le contenu du texte fourni.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Erreur lors de la génération de la réponse';

    res.status(200).json({ answer });
  } catch (error) {
    console.error('Question answering error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
}