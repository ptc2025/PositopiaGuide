import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type VoiceOption = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

// Voice profiles optimized for children
// alloy - neutral and balanced
// echo - male, conversational
// fable - British accent, storyteller-like
// nova - female, energetic and friendly (best for children)
// shimmer - female, warm and inviting

export async function generateSpeech(text: string, voice: VoiceOption = "nova") {
  try {
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      speed: 0.9, // Slightly slower for children
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("Error generating speech with OpenAI:", error);
    throw error;
  }
}

export async function generateSpeechBase64(text: string, voice: VoiceOption = "nova") {
  try {
    const audioBuffer = await generateSpeech(text, voice);
    return audioBuffer.toString("base64");
  } catch (error) {
    console.error("Error generating base64 speech:", error);
    throw error;
  }
}