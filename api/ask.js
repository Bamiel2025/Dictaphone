const AIService = require('./services/ai/aiService');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const answer = await AIService.answerQuestion(question, context);
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Question answering error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
}