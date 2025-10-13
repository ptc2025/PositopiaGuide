import { db } from "./db";
import { audioFiles, affirmations, activities, jokes, ttsSettings } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Seed Affirmations
    await db.insert(affirmations).values([
      {
        text: "You are doing an amazing job! Your feelings are important and valid.",
        category: "green",
      },
      {
        text: "It's okay to feel this way. Taking deep breaths can help you feel better.",
        category: "red",
      },
      {
        text: "You are brave and strong. It's normal to feel nervous sometimes.",
        category: "yellow",
      },
      {
        text: "You are loved and you matter. Every feeling you have is important.",
        category: "general",
      },
    ]).onConflictDoNothing();
    console.log("✅ Affirmations seeded");

    // Seed Activities
    await db.insert(activities).values([
      {
        title: "Dance Party",
        description: "Put on your favorite song and dance around the room!",
        category: "green",
      },
      {
        title: "Deep Breathing",
        description: "Take 5 slow, deep breaths. Breathe in for 4 counts, hold for 4, breathe out for 4.",
        category: "red",
      },
      {
        title: "Cozy Corner",
        description: "Find a quiet, safe space with a soft blanket and your favorite stuffed animal.",
        category: "yellow",
      },
      {
        title: "Draw Your Feelings",
        description: "Use colors and shapes to draw how you're feeling right now.",
        category: "general",
      },
    ]).onConflictDoNothing();
    console.log("✅ Activities seeded");

    // Seed Jokes
    await db.insert(jokes).values([
      {
        text: "What do you call a bear with no teeth? A gummy bear!",
        category: "green",
      },
      {
        text: "Why did the bunny go to the hair salon? It was having a bad hare day!",
        category: "green",
      },
      {
        text: "What's a bunny's favorite music? Hip hop!",
        category: "general",
      },
    ]).onConflictDoNothing();
    console.log("✅ Jokes seeded");

    // Seed TTS Settings (if not exists)
    const existingSettings = await db.select().from(ttsSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(ttsSettings).values({
        voiceProfile: "alloy",
        speed: 100,
        pitch: 100,
        volume: 80,
      });
      console.log("✅ TTS settings seeded");
    }

    console.log("🎉 Database seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
