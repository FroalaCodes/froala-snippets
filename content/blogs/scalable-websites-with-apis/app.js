const axios = require("axios");

// Load your API key
// Be sure to replace this with your actual key (preferably in a secure directory/file or environment variable)
const API_KEY = "Your_API_Key_Here";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

async function getDeepSeekResponse(userInput) {
  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: "deepseek-chat", // Or your preferred model
        messages: [{ role: "user", content: userInput }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const assistantReply = response.data.choices[0].message.content;
    console.log("Assistant says:", assistantReply);
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        "Error communicating with DeepSeek API:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error(
        "Error communicating with DeepSeek API: No response received",
        error.request
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error communicating with DeepSeek API:", error.message);
    }
  }
}

// Example usage from the blog post:
getDeepSeekResponse("Explain the concept of limits (math) in simpler terms.");

// To handle multi-turn conversations, you would modify the `messages` array
// and how you call this function. For example:
// let conversationHistory = [{ role: 'user', content: 'Explain the concept of limits (math) in simpler terms.' }];
// async function handleConversation(userInput) {
//    conversationHistory.push({ role: 'user', content: userInput });
//    const response = await getDeepSeekResponseWithHistory(conversationHistory); // a modified function
//    if (response && response.choices && response.choices[0].message) {
//        const assistantReply = response.choices[0].message.content;
//        console.log('Assistant says:', assistantReply);
//        conversationHistory.push({ role: 'assistant', content: assistantReply });
//    }
// }
