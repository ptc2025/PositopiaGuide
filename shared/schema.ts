import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Emotion categories for the traffic light system
export type EmotionCategory = "red" | "yellow" | "green" | "general";

// Audio files table - stores uploaded audio tracks
export const audioFiles = pgTable("audio_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(), // object storage path
  category: text("category").notNull().$type<EmotionCategory>(), // red, yellow, green, general
  duration: integer("duration"), // in seconds
  volume: integer("volume").notNull().default(80), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Affirmations table
export const affirmations = pgTable("affirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  category: text("category").notNull().$type<EmotionCategory>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activities table
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().$type<EmotionCategory>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jokes table
export const jokes = pgTable("jokes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  category: text("category").notNull().$type<EmotionCategory>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TTS Settings table
export const ttsSettings = pgTable("tts_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voiceProfile: text("voice_profile").notNull().default("alloy"), // OpenAI TTS voice names
  speed: integer("speed").notNull().default(100), // 50-200 (percentage)
  pitch: integer("pitch").notNull().default(100), // 50-200 (percentage)
  volume: integer("volume").notNull().default(80), // 0-100
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertAudioFileSchema = createInsertSchema(audioFiles).omit({
  id: true,
  createdAt: true,
});

export const insertAffirmationSchema = createInsertSchema(affirmations).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertJokeSchema = createInsertSchema(jokes).omit({
  id: true,
  createdAt: true,
});

export const insertTtsSettingSchema = createInsertSchema(ttsSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type AudioFile = typeof audioFiles.$inferSelect;
export type InsertAudioFile = z.infer<typeof insertAudioFileSchema>;

export type Affirmation = typeof affirmations.$inferSelect;
export type InsertAffirmation = z.infer<typeof insertAffirmationSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Joke = typeof jokes.$inferSelect;
export type InsertJoke = z.infer<typeof insertJokeSchema>;

export type TtsSetting = typeof ttsSettings.$inferSelect;
export type InsertTtsSetting = z.infer<typeof insertTtsSettingSchema>;

// AI Response type for emotion analysis
export interface EmotionAnalysisResponse {
  detectedEmotion: EmotionCategory;
  confidence: number;
  reasoning: string;
}

// Response type for child interaction
export interface ChildResponseContent {
  audio?: AudioFile;
  affirmation?: Affirmation;
  activity?: Activity;
  joke?: Joke;
}
