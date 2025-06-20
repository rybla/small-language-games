import { generate } from "@/common_frontend";
import { do_ } from "@/utility";
import { useState } from "react";
import "./App.css";

// --------------------------------
// Types
// --------------------------------

type Game = {
  player: Player;
  history: GameEvent[];
};

const game_ex1: Game = {
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
  history: [
    {
      action: "I walk down the street",
      consequence: "I see a beautiful woman",
    },
  ],
};

type Player = {
  name: string;
  description: string;
  attributes: PlayerAttributes;
};

/**
 * Each player attribute ranges from 1 to 100.
 */
type PlayerAttributes = {
  charisma: number;
  empathy: number;
  humor: number;
  creativity: number;
};

type GameEvent = {
  action: string;
  consequence: string;
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
  const [player, setPlayer] = useState<Player>({
    name: "",
    description: "",
    attributes: { charisma: 50, empathy: 50, humor: 50, creativity: 50 },
  });

  const canStart =
    player.name.trim() !== "" && player.description.trim() !== "";

  return (
    <div className="Init panel">
      <h2>Create Your Player</h2>
      <input
        type="text"
        placeholder="Name"
        value={player.name}
        onChange={(e) => setPlayer({ ...player, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="Description"
        value={player.description}
        onChange={(e) => setPlayer({ ...player, description: e.target.value })}
      />
      <button
        onClick={() =>
          props.setAppState({
            type: "Play",
            props: {
              game: {
                player,
                history: [],
              },
            },
          })
        }
        disabled={!canStart}
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
          <div className="History panel">
            {props.game.history.map((event, index) => (
              <div className="GameEventView">
                <div className="action">{event.action}</div>
                <div className="consequence">{event.consequence}</div>
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
      <p className="description">{props.player.description}</p>
      <table className="attributes">
        <tbody>
          {Object.entries(props.player.attributes).map(([key, value]) => (
            <tr key={key} className="attribute-row">
              <td className="attribute-name">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </td>
              <td className="attribute-value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
