import type { Game, GameId, GameName, PlayerName, RoomName } from "../ontology";

export const game: Game = {
  metadata: {
    id: "example1" as GameId,
    name: "Example 1" as GameName,
  },
  world: {
    description:
      "You find yourself in the verdant, humid expanse of the Whispering Plantation, a sprawling estate rumored to be haunted by the ghosts of over-ripe fruit. Towering banana trees, their broad leaves rustling with an uncanny intelligence, form a dense canopy overhead, casting dappled shadows on the damp earth below. The air hangs thick with the cloying scent of sweet, decaying bananas, a fragrance that seems to follow you, whispering secrets of the past. Ancient, vine-choked outbuildings dot the landscape, their dilapidated structures hinting at a once-grand operation now consumed by overgrowth and an inexplicable, sticky sap. It is said that within the heart of this plantation lies the legendary 'House of Mysterious Bananas,' a structure that shifts and reforms, its rooms filled with puzzles born from the very essence of this peculiar, cursed land.",
    rooms: [
      {
        name: "Altar of the Sunken Mango" as RoomName,
        longDescription:
          "The air here is heavy with the perfume of fermenting mangoes, a stark contrast to the dominant banana scent of the plantation. In the center of this clearing, a weathered stone altar stands, stained with a deep, rust-colored residue that looks disturbingly like dried blood. Upon the altar rests a single, perfectly ripe mango, unnaturally large and glowing with a faint, internal light. Strange, waxy leaves, unlike any found elsewhere on the plantation, carpet the ground around the altar. If one looks closely, faint symbols etched into the stone base of the altar can be discerned, pulsating with the same subtle light as the mango. A narrow, overgrown path leads away from the clearing, disappearing into the dense jungle.",
        shortDescription:
          "A clearing with a stone altar holds a single, glowing mango.",
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
    playerLocations: [
      {
        player: "Silas" as PlayerName,
        room: "Altar of the Sunken Mango" as RoomName,
        description:
          "The farmer stands near the edge of the clearing, a few paces from the stone altar. They are turned slightly away from it, their gaze fixed on the unnaturally glowing mango, a look of bewildered awe mixed with deep-seated concern etched on their face. Their worn leather boots are planted firmly on the damp earth, still carrying traces of plantation soil.",
      },
    ],
    items: [],
    itemLocations: [],
  },
  turns: [],
};
