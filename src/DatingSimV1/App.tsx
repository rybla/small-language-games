import { generate } from "@/common_frontend";
import { and, do_ } from "@/utility";
import { useState } from "react";
import "./App.css";

// --------------------------------
// Types
// --------------------------------

type Game = {
  setting: string;

  player: Player;

  /**
   * The other character who is the player's current love interest.
   */
  other: Other;

  /**
   * The history of events that have happened in the game. Each event corresponds to the player doing some action and then the immediate consequences of that action.
   */
  history: GameEvent[];
};

type Character = {
  name: string;
  description: string;
  attributes: CharacterAttributes;
};

/**
 * Each attribute ranges from 1 to 100.
 */
type CharacterAttributes = {
  charisma: number;
  empathy: number;
  humor: number;
  creativity: number;
};

type Player = Character;

type Other = Character;

type GameEvent = {
  action: string;
  consequence: string;
  consequence_attributesDiff: CharacterAttributes;
};

// --------------------------------
// examples
// --------------------------------

const game_ex1: Game = {
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
  history: [
    {
      action: "I walk down the street",
      consequence: "I see a beautiful woman",
      consequence_attributesDiff: {
        charisma: 0,
        empathy: 0,
        humor: 0,
        creativity: 0,
      },
    },
    {
      action: "I walk down the street",
      consequence: "I see a beautiful woman",
      consequence_attributesDiff: {
        charisma: 0,
        empathy: 0,
        humor: 0,
        creativity: 0,
      },
    },
    {
      action: "I walk down the street",
      consequence: "I see a beautiful woman",
      consequence_attributesDiff: {
        charisma: 0,
        empathy: 0,
        humor: 0,
        creativity: 0,
      },
    },
  ],
};

// --------------------------------
// App
// --------------------------------

type AppState =
  | { type: "Init"; props: InitViewProps }
  | { type: "Play"; props: PlayViewProps }
  | { type: "End"; props: EndViewProps };

type SetAppState = React.Dispatch<React.SetStateAction<AppState>>;

export default function App(props: {}) {
  const [output, set_output] = useState("");

  const test1 = async () => {
    const res = await generate({
      prompt: "What is 1 + 2?",
    });
    set_output(res.message?.content[0].text || "{{empty}}");
  };

  // const [state, setAppState] = useState<AppState>({ type: "Init", props: {} });
  const [state, setAppState] = useState<AppState>({
    type: "Play",
    props: {
      game: game_ex1,
    },
  });

  return (
    <div className="App">
      <div className="title">DatingSimV1</div>
      {do_(() => {
        switch (state.type) {
          case "Init":
            return InitView({ ...state.props, setAppState });
          case "Play":
            return PlayView({ ...state.props, setAppState });
          case "End":
            return EndView({ ...state.props, setAppState });
        }
      })}
    </div>
  );
}

// --------------------------------
// InitView
// --------------------------------

type InitViewProps = {};

function InitView(props: InitViewProps & { setAppState: SetAppState }) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [setting, setSetting] = useState<string>("");

  const [others, setOthers] = useState<Other[]>([]);
  const [other, setOther] = useState<Other | undefined>(undefined);

  const game: Game | undefined = do_(() => {
    if (name === "") return undefined;
    if (description === "") return undefined;
    if (others.length === 0) return undefined;
    if (other === undefined) return undefined;
    return {
      setting,
      player: {
        name,
        description,
        attributes: { charisma: 50, empathy: 50, humor: 50, creativity: 50 },
      },
      other,
      history: [],
    };
  });

  return (
    <div className="Init panel">
      <h2>Create Your Player</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        onClick={() => {
          if (game !== undefined) {
            props.setAppState({
              type: "Play",
              props: {
                game,
              },
            });
          }
        }}
        disabled={game === undefined}
      >
        Start
      </button>
    </div>
  );
}

// --------------------------------
// Play
// --------------------------------

type PlayViewProps = {
  game: Game;
};

function PlayView(props: PlayViewProps & { setAppState: SetAppState }) {
  const [game, setGame] = useState(props.game);

  return (
    <div className="Play panel">
      <h2>Play</h2>
      <div className="row">
        <div className="Interaction panel">
          <div className="Setting qualia">{game.setting}</div>
          <div className="History panel">
            {game.history.map((event, index) => (
              <div className="GameEventView panel ">
                <div className="action qualia">{event.action}</div>
                <div className="consequence qualia">{event.consequence}</div>
              </div>
            ))}
          </div>
          <div className="Prompts panel"></div>
        </div>
        <PlayerView player={game.player} />
      </div>
    </div>
  );
}

// --------------------------------
// EndView
// --------------------------------

type EndViewProps = {};

function EndView(props: EndViewProps & { setAppState: SetAppState }) {
  return (
    <div className="End panel">
      <div>End</div>
    </div>
  );
}

// --------------------------------
// PlayerView
// --------------------------------

function PlayerView(props: { player: Player }) {
  return (
    <div className="Player panel">
      <h3 className="name">{props.player.name}</h3>
      <p className="description qualia">{props.player.description}</p>
      <table className="attributes">
        <tbody>
          {Object.entries(props.player.attributes).map(([key, value]) => (
            <tr key={key} className="attribute-row">
              <td className="attribute-name">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </td>
              <td className="attribute-value qualia">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
