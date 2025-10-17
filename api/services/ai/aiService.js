
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  /**
   * Generate a summary of the provided text
   * @param {string} text - Text to summarize
   * @returns {Promise<string>} - Generated summary
   */
  static async summarize(text) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});
      const prompt = `Summarize the following text:

${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();
      return summary;
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Answer a question based on the provided context
   * @param {string} question - Question to answer
   * @param {string} context - Context to base the answer on
   * @returns {Promise<string>} - Generated answer
   */
  static async answerQuestion(question, context) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});
      const prompt = `Based on the following context, answer the question.

Context: ${context}

Question: ${question}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();
      return answer;
    } catch (error) {
      console.error('Error answering question:', error);
      throw new Error('Failed to answer question');
    }
  }
}

module.exports = AIService;
