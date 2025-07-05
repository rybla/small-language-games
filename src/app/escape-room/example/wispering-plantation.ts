import type { Game, ItemName, PlayerName, RoomName } from "../ontology";

export const game: Game = {
  name: "The Whispering Plantation",
  world: {
    description:
      "You find yourself in the verdant, humid expanse of the Whispering Plantation, a sprawling estate rumored to be haunted by the ghosts of over-ripe fruit. Towering banana trees, their broad leaves rustling with an uncanny intelligence, form a dense canopy overhead, casting dappled shadows on the damp earth below. The air hangs thick with the cloying scent of sweet, decaying bananas, a fragrance that seems to follow you, whispering secrets of the past. Ancient, vine-choked outbuildings dot the landscape, their dilapidated structures hinting at a once-grand operation now consumed by overgrowth and an inexplicable, sticky sap. It is said that within the heart of this plantation lies the legendary 'House of Mysterious Bananas,' a structure that shifts and reforms, its rooms filled with puzzles born from the very essence of this peculiar, cursed land.",
    name: "Whispering Plantation",
    itemLocations: [
      {
        type: "PlacedInRoom",
        room: "Altar of the Sunken Mango" as RoomName,
        item: "Altar" as ItemName,
        description:
          "The stone altar is situated in the very center of the clearing, dominating the small space. The glowing mango sits precisely on the flat surface of the altar, nestled in a shallow, perfectly circular indentation.",
      },
      {
        type: "PlacedInRoom",
        room: "Altar of the Sunken Mango" as RoomName,
        item: "Glowing Mango" as ItemName,
        description:
          "The glowing mango rests atop the stone altar, positioned in the center of the clearing. Its luminescence illuminates the immediate area, making it the focal point of the entire space.",
      },
      {
        type: "PlacedInRoom",
        room: "Altar of the Sunken Mango" as RoomName,
        item: "Bioluminescent Fungi" as ItemName,
        description:
          "These fungi grow in a small ring around the base of the stone altar, their ethereal light creating a halo effect on the ancient rock. They seem to thrive in the perpetual twilight of the clearing.",
      },
    ],
    items: [
      {
        name: "Altar" as ItemName,
        shortDescription: "A mysterious stone altar holds a glowing mango.",
        appearanceDescription:
          "The stone altar is a rough-hewn block of granite, stained with age and partially overgrown with luminous moss. At its center, a single, perfectly formed mango rests, emanating a soft, warm golden light that pushes back the surrounding shadows. The air around it hums with a gentle energy.",
      },
      {
        name: "Glowing Mango" as ItemName,
        shortDescription:
          "A large, luminous mango radiates a warm, golden light.",
        appearanceDescription:
          "This mango is unnaturally large and perfectly shaped, its skin a vibrant, unblemished gold. It pulses with an inner light, casting an ethereal glow on the surrounding altar and the clearing. The scent of ripe mango is almost overpowering, yet it carries a hint of something ancient and powerful.",
      },
      {
        name: "Bioluminescent Fungi" as ItemName,
        shortDescription:
          "Clusters of shimmering, glowing mushrooms sprout from the ground.",
        appearanceDescription:
          "A cluster of iridescent, bioluminescent fungi sprouts from the damp earth surrounding the base of the altar. Their caps shimmer with shifting colors, from deep blues to vibrant greens, casting a soft, eerie glow on the mossy stones.",
      },
    ],
    playerLocations: [
      {
        player: "Silas" as PlayerName,
        room: "Altar of the Sunken Mango" as RoomName,
        description:
          "The farmer stands near the edge of the clearing, a few paces from the stone altar. They are turned slightly away from it, their gaze fixed on the unnaturally glowing mango, a look of bewildered awe mixed with deep-seated concern etched on their face. Their worn leather boots are planted firmly on the damp earth, still carrying traces of plantation soil.",
      },
    ],
    players: [
      {
        name: "Silas" as PlayerName,
        shortDescription:
          "A weathered banana farmer utterly lost in a world of strange fruit.",
        appearanceDescription:
          "A wiry individual with sun-weathered skin and calloused hands, dressed in faded overalls and a straw hat tilted to shield eyes that have seen too many seasons of sun and rain. Their movements are economical, honed by years of agricultural labor, and a faint scent of ripe banana clings to them.",
        personalityDescription:
          "Silas is a practical, no-nonsense individual, deeply connected to the earth and the cycles of nature. Years spent tending crops have made him patient and observant, but also deeply superstitious. He's accustomed to predictable harvests and familiar pests, making this strange, unsettling plantation all the more unnerving. While his first instinct is to solve problems with tried-and-true methods, he is also capable of a surprising resilience and a quiet determination when faced with the unknown.",
        skills: [
          "Farming",
          "Patience",
          "Observational Skills",
          "Fruit Identification",
        ],
      },
    ],
    rooms: [
      {
        name: "Altar of the Sunken Mango" as RoomName,
        longDescription:
          "The air here is heavy with the perfume of fermenting mangoes, a stark contrast to the dominant banana scent of the plantation. In the center of this clearing, a weathered stone altar stands, stained with a deep, rust-colored residue that looks disturbingly like dried blood. Upon the altar rests a single, perfectly ripe mango, unnaturally large and glowing with a faint, internal light. Strange, waxy leaves, unlike any found elsewhere on the plantation, carpet the ground around the altar. If one looks closely, faint symbols etched into the stone base of the altar can be discerned, pulsating with the same subtle light as the mango. A narrow, overgrown path leads away from the clearing, disappearing into the dense jungle.",
        shortDescription:
          "A clearing with a stone altar holds a single, glowing mango.",
      },
    ],
  },
  turns: [],
};
