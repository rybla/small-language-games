import { makeRouteHandler_frontend } from "@/api_frontend_util";
import { do_ } from "@/utility";
import { useState } from "react";
import {
  GenerateActions_input,
  GenerateActions_output,
  GenerateConsequence_input,
  GenerateConsequence_output,
} from "./api";
import "./App.css";
import {
  CharacterAttributes,
  CharacterAttributesDiff,
  Game,
  game_ex1,
  GameAction,
  Other,
} from "./ontology";

// --------------------------------
// logic
// --------------------------------

const applyCharacterAttributesDiff = (
  attributes: CharacterAttributes,
  diff: CharacterAttributesDiff,
) => {
  attributes.charisma += diff.charismaDiff;
  attributes.creativity += diff.creativityDiff;
  attributes.empathy += diff.empathyDiff;
  attributes.humor += diff.humorDiff;
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

const action_ex1: GameAction = {
  label: "walk down the street",
  description:
    "With a gentle smile, Kaelen takes Elara’s hand, his fingers lacing through hers as he leads her from the well-trodden path into the hushed mystery of the woods. He guides her deeper into the trees, their footsteps a soft crunch of leaves and twigs over the damp earth, a quiet rhythm in the nocturnal soundscape. Moonbeams filter through the dense canopy above, painting shifting patterns of silver and shadow across their path and illuminating the subtle hints of what lies ahead. The air grows cooler, carrying the sweet, intoxicating perfume of night-blooming jasmine and the rich scent of ancient soil as he carefully navigates them toward the faint, ethereal blue-green glow that begins to pulse from the heart of the forest.",
  attributesDiff: {
    charismaDiff: 0,
    empathyDiff: 0,
    humorDiff: 0,
    creativityDiff: 0,
  },
};

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

  const [status, setStatus] = useState<
    | "awaiting_start"
    | "awaiting_action"
    | "generating_consequence"
    | "generating_actions"
  >("awaiting_start");

  const [actions, setActions] = useState<GameAction[]>([]);

  return (
    <div className="Play panel">
      <h2>Play</h2>
      <div className="row">
        <div className="Interaction panel">
          <div className="Setting">
            <QualiaView qualia={game.setting} />
          </div>
          <div className="History panel">
            {game.history.map((event, i) => (
              <div key={i} className="GameEvent">
                <div className="action">
                  <QualiaView qualia={event.action.label} />
                </div>
                <div className="consequence">
                  <QualiaView qualia={event.consequence} />
                </div>
              </div>
            ))}
          </div>
          <div className="Status panel">{status}</div>
          <div className="Actions panel">
            {actions.map((action, i) => (
              <div
                key={i}
                className="Action panel"
                onClick={async () => {
                  setStatus("generating_consequence");
                  setActions([]);

                  const { consequence } = await GenerateConsequence({
                    game,
                    action,
                  });
                  game.history.push({ action, consequence });
                  applyCharacterAttributesDiff(
                    game.player.attributes,
                    action.attributesDiff,
                  );
                  setGame(game);

                  setStatus("generating_actions");
                  const { options } = await GenerateActions({ game });
                  setActions(options);

                  setStatus("awaiting_action");
                }}
              >
                <div className="label">
                  <QualiaView qualia={action.label} />
                </div>
              </div>
            ))}
            {status !== "awaiting_start" ? (
              <></>
            ) : (
              <div
                className="Action panel"
                onClick={async () => {
                  setStatus("generating_actions");
                  const { options } = await GenerateActions({ game });
                  setActions(options);

                  setStatus("awaiting_action");
                }}
              >
                start game
              </div>
            )}
          </div>
        </div>
        <div className="Player panel">
          <h3 className="name">{game.player.name}</h3>
          <div className="description">
            <QualiaView qualia={game.player.description} />
          </div>
          <table className="attributes">
            <tbody>
              {Object.entries(game.player.attributes).map(([key, value]) => (
                <tr key={key} className="attribute-row">
                  <td className="attribute-name">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </td>
                  <td className="attribute-value">
                    <QualiaView qualia={`${value}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
// Qualia
// --------------------------------

function QualiaView(props: { qualia: string }) {
  // TODO: parse and render markdown
  return <div className="qualia">{props.qualia}</div>;
}

// --------------------------------
// api
// --------------------------------

export const GenerateConsequence = async (
  input: GenerateConsequence_input,
): Promise<GenerateConsequence_output> => {
  return await makeRouteHandler_frontend({
    route: "/api/GenerateConsequence",
    input,
  });
};

export const GenerateActions = async (
  input: GenerateActions_input,
): Promise<GenerateActions_output> => {
  return await makeRouteHandler_frontend({
    route: "/api/GenerateActions",
    input,
  });
};
