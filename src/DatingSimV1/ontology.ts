import { z } from "zod";

/**
 * Each attribute ranges from 1 to 100.
 */
export type CharacterAttributes = z.infer<typeof CharacterAttributes>;
export const CharacterAttributes = z.object({
  charisma: z
    .number()
    .min(1)
    .max(100)
    .describe("The character's charisma. Ranges from 1 to 100."),
  empathy: z
    .number()
    .min(1)
    .max(100)
    .describe("The character's empathy. Ranges from 1 to 100."),
  humor: z
    .number()
    .min(1)
    .max(100)
    .describe("The character's humor. Ranges from 1 to 100."),
  creativity: z
    .number()
    .min(1)
    .max(100)
    .describe("The character's creativity. Ranges from 1 to 100."),
});

/**
 * Each attribute diff ranges from -10 to 10.
 */
export type CharacterAttributesDiff = z.infer<typeof CharacterAttributesDiff>;
export const CharacterAttributesDiff = z.object({
  charismaDiff: z
    .number()
    .min(-10)
    .max(10)
    .describe("The change is charisma. Ranges from -10 to 10."),
  empathyDiff: z
    .number()
    .min(-10)
    .max(10)
    .describe("The change in emphathy. Ranges from -10 to 10."),
  humorDiff: z
    .number()
    .min(-10)
    .max(10)
    .describe("The change in humor. Ranges from -10 to 10."),
  creativityDiff: z
    .number()
    .min(-10)
    .max(10)
    .describe("The change in creativity. Ranges from -10 to 10."),
});

export type GameAction = z.infer<typeof GameAction>;
export const GameAction = z.object({
  label: z.string(),
  description: z.string(),
  attributesDiff: CharacterAttributesDiff,
});

export type GameEvent = {
  action: GameAction;
  consequence: string;
};
export const GameEvent = z.object({
  action: GameAction,
  consequence: z.string().describe("The consequence of the action."),
});

export type Character = z.infer<typeof Character>;
export const Character = z.object({
  name: z.string().describe("The character's name."),
  description: z.string().describe("The character's description."),
  attributes: CharacterAttributes,
});

export type Player = z.infer<typeof Player>;
export const Player = Character;

export type Other = z.infer<typeof Other>;
export const Other = Character;

export type Game = z.infer<typeof Game>;
export const Game = z.object({
  setting: z.string().describe("The setting of the game."),
  player: Player,
  other: Other,
  history: z
    .array(GameEvent)
    .describe(
      "The history of events that have happened in the game. Each event corresponds to the player doing some action and then the immediate consequences of that action.",
    ),
});

// --------------------------------
// examples
// --------------------------------

export const game_ex1: Game = {
  setting: `Kaelen has arranged a surprise date for Elara, leading her to a secluded clearing deep within a moon-dappled forest he discovered on one of his impulsive explorations. In the center of the clearing, a blanket is spread beneath the sprawling branches of an ancient, moss-covered willow tree, its leaves rustling in the gentle night breeze. The air is filled with the soft scent of damp earth and night-blooming jasmine. Dozens of bioluminescent fungi, carefully transplanted by Kaelen, cast an ethereal, blue-green glow upon the scene, illuminating a simple but elegant picnic. The setting is a grand, romantic gesture designed to appeal to Elara's appreciation for profound, natural beauty and her love for serene, almost magical moments, a perfect fusion of his passionate nature and her quiet, dreamy world.`,
  player: {
    name: "Kaelen Rhys",
    description: `Kaelen Rhys is a striking figure with a lean, athletic build and an energy that fuses quiet strength with impulsive passion. His dark, unruly hair frames intense, moss-green eyes, and a lopsided grin often betrays the ardor beneath his calm exterior. Driven by a fiercely loyal heart, Kaelen's personality is a whirlwind of romantic rashness, leading him to make bold, sweeping gestures in his pursuit of a captivating and profound connection.`,
    attributes: {
      charisma: 50,
      empathy: 50,
      humor: 50,
      creativity: 50,
    },
  },
  other: {
    name: "Elara Vance",
    description:
      "Elara Vance is a vision of ethereal grace, with a slender frame and long, silver-blonde hair that cascades like a moonlit waterfall. Her eyes, a striking amethyst, hold a depth of quiet observation, often sparkling with a subtle, knowing amusement. She moves with a gentle poise, yet possesses an unexpectedly sharp wit and a profound appreciation for beauty in all its forms. Elara is a dreamer with a grounded heart, seeking a connection that understands her nuanced world and shares in her serene joy.",
    attributes: {
      charisma: 60,
      empathy: 70,
      humor: 40,
      creativity: 80,
    },
  },
  //   history: [
  //     {
  //       action: {
  //         label: "walk down the street",
  //         description:
  //           "With a gentle smile, Kaelen takes Elara’s hand, his fingers lacing through hers as he leads her from the well-trodden path into the hushed mystery of the woods. He guides her deeper into the trees, their footsteps a soft crunch of leaves and twigs over the damp earth, a quiet rhythm in the nocturnal soundscape. Moonbeams filter through the dense canopy above, painting shifting patterns of silver and shadow across their path and illuminating the subtle hints of what lies ahead. The air grows cooler, carrying the sweet, intoxicating perfume of night-blooming jasmine and the rich scent of ancient soil as he carefully navigates them toward the faint, ethereal blue-green glow that begins to pulse from the heart of the forest.",
  //         consequence_attributesDiff: {
  //           charisma: 0,
  //           empathy: 0,
  //           humor: 0,
  //           creativity: 0,
  //         },
  //       },
  //       consequence: `As you both step past the final curtain of weeping willow branches, the clearing opens up before you. Elara stops dead, her hand tightening instinctively in yours. A soft, audible gasp escapes her lips. Her eyes, wide with wonder, slowly trace the scene you've so carefully constructed. She follows the gentle, pulsating blue-green light from the clusters of fungi, to the soft woolen blanket spread with her favorite cheeses and fruits, and finally up to the ancient, twisting branches of the willow tree that shelters the space like a silent, benevolent guardian.

  // For a long moment, she is utterly still, simply breathing in the magic of it all. The ethereal glow paints highlights on her face, and you can see the reflection of a dozen tiny, radiant lights in her eyes. When she finally turns to look at you, her expression is one of profound, speechless emotion—a perfect, breathtaking mirror of the serene and magical world you hoped to create for her. Your heart thumps in your chest, a wild drumbeat against the forest's quiet hum.

  // Elara opens her mouth to speak, but seems unable to find the words. She simply shakes her head slightly in disbelief, a radiant smile beginning to bloom on her face.`,
  //     },
  //   ],
  history: [],
};
