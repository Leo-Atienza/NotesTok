import type { LessonManifest } from "./types";

export const DEMO_LESSON_ID = "demo-how-memory-works";

export const DEMO_LESSON: LessonManifest = {
  id: DEMO_LESSON_ID,
  title: "How Memory Works",
  subject: "Psychology / Neuroscience",
  difficulty: "beginner",
  estimatedMinutes: 4,
  totalXP: 65,
  segments: [
    {
      id: "seg-sensory",
      order: 0,
      type: "concept",
      title: "Sensory Memory",
      content:
        "Every second, your brain is bombarded with millions of signals from your eyes, ears, and skin. This raw flood of information enters sensory memory, a buffer that holds everything for less than one second. Iconic memory captures visual snapshots, while echoic memory records the last three to four seconds of sound. Most of this information vanishes instantly unless your attention grabs it. Think of sensory memory like a camera flash — it captures everything in the room, but the image fades almost immediately.",
      keyTerms: ["sensory memory", "iconic memory", "echoic memory"],
      emoji: "👁️",
      imagePrompt:
        "Dark cinematic illustration of a human eye with a burst of colorful light rays entering, neural pathways glowing behind it, dramatic lighting",
      sceneImagePrompts: [
        "Dramatic close-up of a human brain surrounded by swirling streams of colorful light representing sensory signals, dark moody atmosphere with neon blues and purples",
        "Split scene showing an eye capturing a bright camera flash on one side, and sound waves entering an ear on the other, dark cinematic style with vibrant highlights",
        "A glowing photograph slowly dissolving into particles of light against a dark void, representing fading sensory memory, dramatic deep shadows",
      ],
      quiz: {
        question:
          "How long does sensory memory typically hold information before it fades?",
        options: [
          "Less than 1 second",
          "About 30 seconds",
          "Up to 5 minutes",
          "Permanently",
        ],
        correctIndex: 0,
        explanation:
          "Sensory memory is ultra-brief — it holds raw sensory input for less than one second. Only information you actively pay attention to moves on to short-term memory.",
        hint: "Think about the camera flash analogy — how quickly does a flash afterimage fade from your vision?",
        xpReward: 10,
      },
    },
    {
      id: "seg-short-term",
      order: 1,
      type: "concept",
      title: "Short-Term Memory",
      content:
        "When you pay attention to something, it enters short-term memory. This mental workspace holds about seven items for roughly twenty to thirty seconds. George Miller called this the magic number seven, plus or minus two. Without rehearsal, the information decays quickly. Your phone number is seven digits for exactly this reason. Chunking helps you beat the limit by grouping items together — instead of remembering ten random letters, you remember three meaningful words.",
      keyTerms: [
        "short-term memory",
        "magic number seven",
        "chunking",
        "rehearsal",
      ],
      emoji: "🧠",
      imagePrompt:
        "Cinematic illustration of a glowing workspace desk inside a transparent brain, with seven floating orbs of light, dark dramatic atmosphere",
      sceneImagePrompts: [
        "A glowing transparent brain with a spotlight illuminating a small workspace area inside, seven bright orbs floating in the lit zone, dark dramatic background",
        "A scientist in a dark lab holding up seven glowing spheres arranged in a line, dramatic cinematic lighting with deep shadows and golden highlights",
        "A phone keypad with seven digits glowing brightly against a dark background, each digit pulsing with energy, moody cinematic style",
        "Hands arranging scattered glowing puzzle pieces into three neat groups, representing chunking, dark atmospheric scene with warm light",
      ],
      quiz: {
        question:
          "According to George Miller, how many items can short-term memory hold?",
        options: ["3 ± 1", "5 ± 2", "7 ± 2", "12 ± 3"],
        correctIndex: 2,
        explanation:
          "Miller's famous 1956 paper established that short-term memory can hold about 7 items (plus or minus 2). Chunking can effectively increase this by grouping items.",
        hint: "It is called the 'magic number seven' — and there's a reason phone numbers have seven digits.",
        xpReward: 15,
      },
    },
    {
      id: "seg-long-term",
      order: 2,
      type: "concept",
      title: "Long-Term Memory",
      content:
        "Through encoding, information transfers from short-term to long-term memory, where it can last a lifetime. Long-term memory splits into two types. Explicit memory stores facts and events you can consciously recall, like your birthday or the capital of France. Implicit memory stores skills and habits you perform automatically, like riding a bike or typing on a keyboard. The hippocampus acts as the gateway, deciding what gets stored permanently.",
      keyTerms: [
        "long-term memory",
        "explicit memory",
        "implicit memory",
        "hippocampus",
        "encoding",
      ],
      emoji: "🏛️",
      imagePrompt:
        "A vast library inside a brain with endless glowing bookshelves stretching into darkness, dramatic cinematic lighting with golden warm tones",
      sceneImagePrompts: [
        "A dramatic scene of information flowing like a glowing river from a small bright workspace into a massive dark cathedral-like vault, representing encoding into long-term memory",
        "Split scene: one side shows a person consciously recalling a birthday cake with candles, other side shows hands automatically typing on a keyboard, dark cinematic atmosphere",
        "A majestic glowing gate shaped like a hippocampus standing at the entrance to an enormous dark library, dramatic golden light streaming through, moody cinematic style",
      ],
      quiz: {
        question:
          "Which brain structure acts as the gateway for transferring information to long-term memory?",
        options: [
          "Cerebellum",
          "Hippocampus",
          "Amygdala",
          "Prefrontal cortex",
        ],
        correctIndex: 1,
        explanation:
          "The hippocampus is crucial for forming new long-term memories. Damage to it (like in patient H.M.) prevents new explicit memories from forming, while old memories remain intact.",
        hint: "This structure is named after a sea creature — its shape resembles a seahorse.",
        xpReward: 15,
      },
    },
    {
      id: "seg-retrieval",
      order: 3,
      type: "example",
      title: "Retrieval & Forgetting",
      content:
        "Getting information out of long-term memory is called retrieval. Recognition is easier than recall — that's why multiple-choice tests feel simpler than essay questions. Hermann Ebbinghaus discovered the forgetting curve: we lose about fifty percent of new information within the first hour unless we actively review it. The best defense is spaced repetition — reviewing material at increasing intervals. This technique exploits the spacing effect to build stronger neural connections each time you retrieve a memory.",
      keyTerms: [
        "retrieval",
        "forgetting curve",
        "spaced repetition",
        "spacing effect",
        "recognition",
        "recall",
      ],
      emoji: "📈",
      imagePrompt:
        "Dramatic graph showing the forgetting curve as a glowing neon line dropping steeply then being saved by spaced repetition arrows, dark cinematic background",
      sceneImagePrompts: [
        "A person reaching into a vast dark library pulling out a glowing book, representing memory retrieval, dramatic spotlight and deep shadows",
        "A dramatic visualization of a steep glowing curve dropping into darkness, representing the forgetting curve, with small recovery pulses of light at intervals",
        "A person studying at a desk with a calendar behind them showing review sessions spaced further and further apart, each session emitting brighter light, dark cinematic atmosphere",
      ],
      quiz: {
        question:
          "According to the forgetting curve, how much information do we lose within the first hour without review?",
        options: ["About 10%", "About 25%", "About 50%", "About 90%"],
        correctIndex: 2,
        explanation:
          "Ebbinghaus found that roughly 50% of newly learned information is forgotten within the first hour. Spaced repetition is the most effective countermeasure — which is exactly what this app uses!",
        hint: "Ebbinghaus discovered a steep initial drop — it is more than a quarter but less than most people expect.",
        xpReward: 25,
      },
    },
  ],
};
