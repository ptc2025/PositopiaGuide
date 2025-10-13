import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openai } from "./openai";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import {
  insertAudioFileSchema,
  insertAffirmationSchema,
  insertActivitySchema,
  insertJokeSchema,
  insertTtsSettingSchema,
  insertChildSchema,
  insertEmotionCheckInSchema,
  type EmotionCategory,
  type ChildResponseContent,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();
  // ===== Object Storage for Audio =====
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectFile(req.params.objectPath);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error fetching object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/audio/upload-url", async (req, res) => {
    try {
      const { contentType } = req.body;
      const uploadURL = await objectStorageService.getAudioUploadURL(contentType || "audio/mpeg");
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/audio/normalize-path", async (req, res) => {
    try {
      const { uploadURL } = req.body;
      
      if (!uploadURL) {
        return res.status(400).json({ error: "Upload URL is required" });
      }

      const objectPath = objectStorageService.normalizeObjectPath(uploadURL);
      res.json({ objectPath });
    } catch (error) {
      console.error("Error normalizing path:", error);
      res.status(500).json({ error: "Failed to normalize path" });
    }
  });

  app.post("/api/audio/categorize", async (req, res) => {
    try {
      const { uploadURL, name } = req.body;
      
      if (!uploadURL || !name) {
        return res.status(400).json({ error: "Upload URL and name are required" });
      }

      const objectPath = objectStorageService.normalizeObjectPath(uploadURL);

      // Use AI to categorize the audio based on its name
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are categorizing audio files for a children's emotional learning app. Based on the audio file name, determine which emotion category it best fits:
            
- red: For calming music, soothing sounds for angry/upset/frustrated feelings
- yellow: For reassuring music, gentle sounds for nervous/worried/scared feelings  
- green: For upbeat music, celebratory sounds for happy/excited/proud feelings
- general: For neutral music that fits all emotions

Respond in JSON with: {"category": "red|yellow|green|general", "reasoning": "brief explanation"}`,
          },
          {
            role: "user",
            content: `Audio file name: "${name}"`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const aiResult = JSON.parse(aiResponse.choices[0].message.content || "{}");
      const category: EmotionCategory = aiResult.category || "general";

      res.json({ objectPath, category, reasoning: aiResult.reasoning });
    } catch (error) {
      console.error("Error categorizing audio:", error);
      res.status(500).json({ error: "Failed to categorize audio" });
    }
  });

  // ===== Audio Files =====
  app.get("/api/audio", async (req, res) => {
    try {
      const audioFiles = await storage.getAllAudio();
      res.json(audioFiles);
    } catch (error) {
      console.error("Error fetching audio:", error);
      res.status(500).json({ error: "Failed to fetch audio files" });
    }
  });

  app.post("/api/audio", async (req, res) => {
    try {
      const data = insertAudioFileSchema.parse(req.body);
      const audio = await storage.createAudio(data);
      res.json(audio);
    } catch (error) {
      console.error("Error creating audio:", error);
      res.status(400).json({ error: "Invalid audio data" });
    }
  });

  app.put("/api/audio/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAudioFileSchema.partial().parse(req.body);
      const audio = await storage.updateAudio(id, data);
      if (!audio) {
        return res.status(404).json({ error: "Audio not found" });
      }
      res.json(audio);
    } catch (error) {
      console.error("Error updating audio:", error);
      res.status(400).json({ error: "Invalid audio data" });
    }
  });

  app.delete("/api/audio/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAudio(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting audio:", error);
      res.status(500).json({ error: "Failed to delete audio" });
    }
  });

  // ===== Affirmations =====
  app.get("/api/affirmations", async (req, res) => {
    try {
      const affirmations = await storage.getAllAffirmations();
      res.json(affirmations);
    } catch (error) {
      console.error("Error fetching affirmations:", error);
      res.status(500).json({ error: "Failed to fetch affirmations" });
    }
  });

  app.post("/api/affirmations", async (req, res) => {
    try {
      const data = insertAffirmationSchema.parse(req.body);
      const affirmation = await storage.createAffirmation(data);
      res.json(affirmation);
    } catch (error) {
      console.error("Error creating affirmation:", error);
      res.status(400).json({ error: "Invalid affirmation data" });
    }
  });

  app.put("/api/affirmations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAffirmationSchema.partial().parse(req.body);
      const affirmation = await storage.updateAffirmation(id, data);
      if (!affirmation) {
        return res.status(404).json({ error: "Affirmation not found" });
      }
      res.json(affirmation);
    } catch (error) {
      console.error("Error updating affirmation:", error);
      res.status(400).json({ error: "Invalid affirmation data" });
    }
  });

  app.delete("/api/affirmations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAffirmation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting affirmation:", error);
      res.status(500).json({ error: "Failed to delete affirmation" });
    }
  });

  // ===== Activities =====
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const data = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(data);
      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.put("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(id, data);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteActivity(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // ===== Jokes =====
  app.get("/api/jokes", async (req, res) => {
    try {
      const jokes = await storage.getAllJokes();
      res.json(jokes);
    } catch (error) {
      console.error("Error fetching jokes:", error);
      res.status(500).json({ error: "Failed to fetch jokes" });
    }
  });

  app.post("/api/jokes", async (req, res) => {
    try {
      const data = insertJokeSchema.parse(req.body);
      const joke = await storage.createJoke(data);
      res.json(joke);
    } catch (error) {
      console.error("Error creating joke:", error);
      res.status(400).json({ error: "Invalid joke data" });
    }
  });

  app.put("/api/jokes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertJokeSchema.partial().parse(req.body);
      const joke = await storage.updateJoke(id, data);
      if (!joke) {
        return res.status(404).json({ error: "Joke not found" });
      }
      res.json(joke);
    } catch (error) {
      console.error("Error updating joke:", error);
      res.status(400).json({ error: "Invalid joke data" });
    }
  });

  app.delete("/api/jokes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteJoke(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting joke:", error);
      res.status(500).json({ error: "Failed to delete joke" });
    }
  });

  // ===== TTS Settings =====
  app.get("/api/tts-settings", async (req, res) => {
    try {
      const settings = await storage.getTtsSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching TTS settings:", error);
      res.status(500).json({ error: "Failed to fetch TTS settings" });
    }
  });

  app.put("/api/tts-settings", async (req, res) => {
    try {
      const data = insertTtsSettingSchema.parse(req.body);
      const settings = await storage.updateTtsSettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating TTS settings:", error);
      res.status(400).json({ error: "Invalid TTS settings data" });
    }
  });

  // ===== Children Profiles =====
  app.get("/api/children", async (req, res) => {
    try {
      const { familyCode } = req.query;
      
      // Require familyCode for data security
      if (!familyCode) {
        return res.status(400).json({ error: "Family code is required" });
      }
      
      const childrenList = await storage.getChildrenByFamilyCode(familyCode as string);
      res.json(childrenList);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  app.post("/api/children", async (req, res) => {
    try {
      const data = insertChildSchema.parse(req.body);
      const child = await storage.createChild(data);
      res.json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      res.status(400).json({ error: "Invalid child data" });
    }
  });

  app.put("/api/children/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertChildSchema.partial().parse(req.body);
      const child = await storage.updateChild(id, data);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      res.json(child);
    } catch (error) {
      console.error("Error updating child:", error);
      res.status(400).json({ error: "Invalid child data" });
    }
  });

  app.delete("/api/children/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteChild(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ error: "Failed to delete child" });
    }
  });

  // ===== Emotion Check-Ins =====
  app.post("/api/check-ins", async (req, res) => {
    try {
      const data = insertEmotionCheckInSchema.parse(req.body);
      const checkIn = await storage.createCheckIn(data);
      res.json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      res.status(400).json({ error: "Invalid check-in data" });
    }
  });

  app.get("/api/emotion-checkins", async (req, res) => {
    try {
      const { childId } = req.query;
      if (!childId) {
        return res.status(400).json({ error: "Child ID is required" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const checkIns = await storage.getCheckInsByChild(childId as string, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  app.get("/api/check-ins/child/:childId", async (req, res) => {
    try {
      const { childId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const checkIns = await storage.getCheckInsByChild(childId, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  app.get("/api/check-ins/family/:familyCode", async (req, res) => {
    try {
      const { familyCode } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const checkIns = await storage.getCheckInsByFamilyCode(familyCode, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching family check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  // ===== Dashboard Analytics =====
  app.get("/api/dashboard", async (req, res) => {
    try {
      const { familyCode } = req.query;
      
      if (!familyCode) {
        return res.status(400).json({ error: "Family code is required" });
      }

      const children = await storage.getChildrenByFamilyCode(familyCode as string);
      const allCheckIns = await storage.getCheckInsByFamilyCode(familyCode as string, 1000);

      const emotionBreakdown = {
        red: allCheckIns.filter(c => c.emotion === "red").length,
        yellow: allCheckIns.filter(c => c.emotion === "yellow").length,
        green: allCheckIns.filter(c => c.emotion === "green").length,
      };

      const childrenStats = children.map(child => {
        const childCheckIns = allCheckIns.filter(c => c.childId === child.id);
        const lastCheckIn = childCheckIns.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        return {
          child,
          checkIns: childCheckIns.length,
          lastEmotion: lastCheckIn?.emotion,
        };
      });

      const recentCheckIns = allCheckIns
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      res.json({
        totalCheckIns: allCheckIns.length,
        emotionBreakdown,
        childrenStats,
        recentCheckIns,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ===== AI Emotion Analysis =====
  app.post("/api/analyze-emotion", async (req, res) => {
    try {
      const { emotion, text, childId } = req.body;

      if (!emotion || !text) {
        return res.status(400).json({ error: "Emotion and text are required" });
      }

      // Use AI to analyze the emotion and refine the category
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using a smaller model for cost efficiency
        messages: [
          {
            role: "system",
            content: `You are a caring emotional intelligence assistant for children. Based on what the child shares, determine if their emotion category is accurate. 
            
Categories:
- red: Angry, frustrated, sad, upset, mad
- yellow: Nervous, worried, scared, anxious, unsure
- green: Happy, calm, excited, proud, joyful

Respond in JSON with: {"category": "red|yellow|green", "reasoning": "brief explanation"}`,
          },
          {
            role: "user",
            content: `The child selected "${emotion}" and shared: "${text}"`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const aiResult = JSON.parse(aiResponse.choices[0].message.content || "{}");
      const finalCategory: EmotionCategory = aiResult.category || emotion;

      // Save emotion check-in if childId is provided
      if (childId) {
        await storage.createCheckIn({
          childId,
          emotionCategory: emotion,
          feelingText: text,
          detectedEmotion: finalCategory,
        });
      }

      // Fetch content for this emotion category
      const [audioFiles, affirmations, activities, jokes] = await Promise.all([
        storage.getAudioByCategory(finalCategory),
        storage.getAffirmationsByCategory(finalCategory),
        storage.getActivitiesByCategory(finalCategory),
        storage.getJokesByCategory(finalCategory),
      ]);

      // Select random items from each category
      const response: ChildResponseContent = {
        audio: audioFiles.length > 0 
          ? audioFiles[Math.floor(Math.random() * audioFiles.length)]
          : undefined,
        affirmation: affirmations.length > 0
          ? affirmations[Math.floor(Math.random() * affirmations.length)]
          : undefined,
        activity: activities.length > 0
          ? activities[Math.floor(Math.random() * activities.length)]
          : undefined,
        joke: jokes.length > 0
          ? jokes[Math.floor(Math.random() * jokes.length)]
          : undefined,
      };

      res.json(response);
    } catch (error) {
      console.error("Error analyzing emotion:", error);
      res.status(500).json({ error: "Failed to analyze emotion" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
