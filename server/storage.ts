// Reference: javascript_database integration
import {
  audioFiles,
  affirmations,
  activities,
  jokes,
  ttsSettings,
  type AudioFile,
  type InsertAudioFile,
  type Affirmation,
  type InsertAffirmation,
  type Activity,
  type InsertActivity,
  type Joke,
  type InsertJoke,
  type TtsSetting,
  type InsertTtsSetting,
  type EmotionCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, or } from "drizzle-orm";

export interface IStorage {
  // Audio Files
  getAllAudio(): Promise<AudioFile[]>;
  getAudioByCategory(category: EmotionCategory): Promise<AudioFile[]>;
  getAudioById(id: string): Promise<AudioFile | undefined>;
  createAudio(data: InsertAudioFile): Promise<AudioFile>;
  updateAudio(id: string, data: Partial<InsertAudioFile>): Promise<AudioFile | undefined>;
  deleteAudio(id: string): Promise<void>;

  // Affirmations
  getAllAffirmations(): Promise<Affirmation[]>;
  getAffirmationsByCategory(category: EmotionCategory): Promise<Affirmation[]>;
  getAffirmationById(id: string): Promise<Affirmation | undefined>;
  createAffirmation(data: InsertAffirmation): Promise<Affirmation>;
  updateAffirmation(id: string, data: Partial<InsertAffirmation>): Promise<Affirmation | undefined>;
  deleteAffirmation(id: string): Promise<void>;

  // Activities
  getAllActivities(): Promise<Activity[]>;
  getActivitiesByCategory(category: EmotionCategory): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | undefined>;
  createActivity(data: InsertActivity): Promise<Activity>;
  updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<void>;

  // Jokes
  getAllJokes(): Promise<Joke[]>;
  getJokesByCategory(category: EmotionCategory): Promise<Joke[]>;
  getJokeById(id: string): Promise<Joke | undefined>;
  createJoke(data: InsertJoke): Promise<Joke>;
  updateJoke(id: string, data: Partial<InsertJoke>): Promise<Joke | undefined>;
  deleteJoke(id: string): Promise<void>;

  // TTS Settings
  getTtsSettings(): Promise<TtsSetting | undefined>;
  updateTtsSettings(data: InsertTtsSetting): Promise<TtsSetting>;
}

export class DatabaseStorage implements IStorage {
  // Audio Files
  async getAllAudio(): Promise<AudioFile[]> {
    return await db.select().from(audioFiles);
  }

  async getAudioByCategory(category: EmotionCategory): Promise<AudioFile[]> {
    return await db
      .select()
      .from(audioFiles)
      .where(or(eq(audioFiles.category, category), eq(audioFiles.category, "general")));
  }

  async getAudioById(id: string): Promise<AudioFile | undefined> {
    const [audio] = await db.select().from(audioFiles).where(eq(audioFiles.id, id));
    return audio || undefined;
  }

  async createAudio(data: InsertAudioFile): Promise<AudioFile> {
    const [audio] = await db.insert(audioFiles).values(data).returning();
    return audio;
  }

  async updateAudio(id: string, data: Partial<InsertAudioFile>): Promise<AudioFile | undefined> {
    const [audio] = await db
      .update(audioFiles)
      .set(data)
      .where(eq(audioFiles.id, id))
      .returning();
    return audio || undefined;
  }

  async deleteAudio(id: string): Promise<void> {
    await db.delete(audioFiles).where(eq(audioFiles.id, id));
  }

  // Affirmations
  async getAllAffirmations(): Promise<Affirmation[]> {
    return await db.select().from(affirmations);
  }

  async getAffirmationsByCategory(category: EmotionCategory): Promise<Affirmation[]> {
    return await db
      .select()
      .from(affirmations)
      .where(or(eq(affirmations.category, category), eq(affirmations.category, "general")));
  }

  async getAffirmationById(id: string): Promise<Affirmation | undefined> {
    const [affirmation] = await db.select().from(affirmations).where(eq(affirmations.id, id));
    return affirmation || undefined;
  }

  async createAffirmation(data: InsertAffirmation): Promise<Affirmation> {
    const [affirmation] = await db.insert(affirmations).values(data).returning();
    return affirmation;
  }

  async updateAffirmation(id: string, data: Partial<InsertAffirmation>): Promise<Affirmation | undefined> {
    const [affirmation] = await db
      .update(affirmations)
      .set(data)
      .where(eq(affirmations.id, id))
      .returning();
    return affirmation || undefined;
  }

  async deleteAffirmation(id: string): Promise<void> {
    await db.delete(affirmations).where(eq(affirmations.id, id));
  }

  // Activities
  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getActivitiesByCategory(category: EmotionCategory): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(or(eq(activities.category, category), eq(activities.category, "general")));
  }

  async getActivityById(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(data).returning();
    return activity;
  }

  async updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set(data)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // Jokes
  async getAllJokes(): Promise<Joke[]> {
    return await db.select().from(jokes);
  }

  async getJokesByCategory(category: EmotionCategory): Promise<Joke[]> {
    return await db
      .select()
      .from(jokes)
      .where(or(eq(jokes.category, category), eq(jokes.category, "general")));
  }

  async getJokeById(id: string): Promise<Joke | undefined> {
    const [joke] = await db.select().from(jokes).where(eq(jokes.id, id));
    return joke || undefined;
  }

  async createJoke(data: InsertJoke): Promise<Joke> {
    const [joke] = await db.insert(jokes).values(data).returning();
    return joke;
  }

  async updateJoke(id: string, data: Partial<InsertJoke>): Promise<Joke | undefined> {
    const [joke] = await db
      .update(jokes)
      .set(data)
      .where(eq(jokes.id, id))
      .returning();
    return joke || undefined;
  }

  async deleteJoke(id: string): Promise<void> {
    await db.delete(jokes).where(eq(jokes.id, id));
  }

  // TTS Settings
  async getTtsSettings(): Promise<TtsSetting | undefined> {
    const [settings] = await db.select().from(ttsSettings).limit(1);
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(ttsSettings)
        .values({
          voiceProfile: "alloy",
          speed: 100,
          pitch: 100,
          volume: 80,
        })
        .returning();
      return newSettings;
    }
    return settings;
  }

  async updateTtsSettings(data: InsertTtsSetting): Promise<TtsSetting> {
    const existing = await this.getTtsSettings();
    if (existing) {
      const [updated] = await db
        .update(ttsSettings)
        .set(data)
        .where(eq(ttsSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(ttsSettings).values(data).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
