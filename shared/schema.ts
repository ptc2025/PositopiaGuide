import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Emotion categories for the traffic light system
export type EmotionCategory = "red" | "yellow" | "green" | "general";

// User roles
export type UserRole = "parent" | "teacher" | "child";

// Gender options for profiles
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

// Families table - manages family accounts with PIN authentication
export const families = pgTable("families", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyCode: text("family_code").notNull().unique(), // Unique family identifier
  familyName: text("family_name").notNull(),
  pin: text("pin").notNull(), // 4-6 digit PIN for authentication
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Parents/Admin accounts table
export const parents = pgTable("parents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: varchar("family_id").notNull(),
  name: text("name").notNull(),
  email: text("email"), // Optional email for recovery
  role: text("role").notNull().$type<UserRole>().default("parent"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Children profiles table
export const children = pgTable("children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: varchar("family_id").notNull(),
  name: text("name").notNull(),
  birthday: date("birthday"),
  gender: text("gender").$type<Gender>(),
  age: integer("age"),
  avatarColor: text("avatar_color").notNull().default("blue"), // For visual identification
  familyCode: text("family_code").notNull(), // Simple code to group children (family or classroom)
  favoriteColor: text("favorite_color"),
  favoriteAnimal: text("favorite_animal"),
  interests: text("interests").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Family Settings table - manages global family settings
export const familySettings = pgTable("family_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: varchar("family_id").notNull().unique(),
  allowChildrenLogin: boolean("allow_children_login").notNull().default(true),
  requirePinForChild: boolean("require_pin_for_child").notNull().default(false),
  themePreset: text("theme_preset").notNull().default("default"),
  volumeLevel: integer("volume_level").notNull().default(80),
  autoPlayMusic: boolean("auto_play_music").notNull().default(true),
  enableTts: boolean("enable_tts").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Asset Distribution table - manages which profiles get which assets
export const assetDistributions = pgTable("asset_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: varchar("family_id").notNull(),
  assetType: text("asset_type").notNull(), // "audio", "affirmation", "activity", "joke"
  assetId: varchar("asset_id").notNull(), // ID of the specific asset
  distributionType: text("distribution_type").notNull(), // "all", "include", "exclude"
  profileIds: text("profile_ids").array(), // Array of child IDs for include/exclude
  genderFilter: text("gender_filter").$type<Gender>(), // Optional gender-specific filter
  ageMin: integer("age_min"), // Optional age range filter
  ageMax: integer("age_max"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(), // Parent ID who created this rule
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Emotion check-ins table - tracks all emotional interactions
export const emotionCheckIns = pgTable("emotion_check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  emotionCategory: text("emotion_category").notNull().$type<EmotionCategory>(),
  feelingText: text("feeling_text").notNull(), // What the child typed
  detectedEmotion: text("detected_emotion").notNull().$type<EmotionCategory>(), // AI-detected emotion
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
});

export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  createdAt: true,
});

export const insertFamilySettingSchema = createInsertSchema(familySettings).omit({
  id: true,
  updatedAt: true,
});

export const insertAssetDistributionSchema = createInsertSchema(assetDistributions).omit({
  id: true,
  createdAt: true,
});

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

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export const insertEmotionCheckInSchema = createInsertSchema(emotionCheckIns).omit({
  id: true,
  createdAt: true,
});

// Types
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;

export type FamilySetting = typeof familySettings.$inferSelect;
export type InsertFamilySetting = z.infer<typeof insertFamilySettingSchema>;

export type AssetDistribution = typeof assetDistributions.$inferSelect;
export type InsertAssetDistribution = z.infer<typeof insertAssetDistributionSchema>;

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

export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;

export type EmotionCheckIn = typeof emotionCheckIns.$inferSelect;
export type InsertEmotionCheckIn = z.infer<typeof insertEmotionCheckInSchema>;

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
