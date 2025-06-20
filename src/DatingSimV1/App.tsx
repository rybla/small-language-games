import { generate } from "@/common_frontend";
import { do_, quoteblock } from "@/utility";
import { useState } from "react";
import z from "zod";
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

const systemPrelude = (game: Game): string =>
  `
You are a game master for a role playing game centered around dating. The player's character is named ${game.player.name}. The love interest's name is ${game.other.name}.

The following passage describes the setting of the game:

${quoteblock(game.setting)}

The following passage describes the player's character, ${game.player.name}:

${quoteblock(game.player.description)}

The following passage describes the player's love interest, ${game.other.name}:

${quoteblock(game.other.description)}
`.trim();

const submitAction = async (game: Game, action: GameAction): Promise<void> => {
  const response = await generate({
    messages: [
      {
        role: "system",
        content: [
          {
            text: `
${systemPrelude(game)}

Your task is to describe what happens immediately next in the game based give the user's description of what the player wants to do next. Be creative while also keeping the events of the game consistent with what's happened so far. Use vivid prose in the style of popular fantasy writers (such as George R. R. Martin, Brandon Sanderson, and Ursula K. Le Guin) that is interesting and exciting to read.

The following JSON specifies the player's current attributes:
\`\`\`json
${JSON.stringify(game.player.attributes, null, 4)}
\`\`\`

The following JSON specifies the love interest's current attributes:
\`\`\`json
${JSON.stringify(game.other.attributes, null, 4)}
\`\`\`

The user will give a description of what the player wants to do next.
You should reply with the description of what happens immediately next in the game.
`.trim(),
          },
        ],
      },
      ...game.history.flatMap((e) => [
        {
          role: "user" as const,
          content: [{ text: e.action.description }],
        },
        {
          role: "model" as const,
          content: [{ text: e.consequence }],
        },
      ]),
    ],
    prompt: action.description,
    output: {
      schema: z.object({
        description: z
          .string()
          .describe(
            "A description of what happens immediately next in the game.",
          ),
      }),
    },
    config: {
      temperature: 1.5,
    },
  });

  if (response.output === undefined || response.output === null) {
    throw new Error("Failed to generate response");
  }

  const consequence = response.output.description;

  applyCharacterAttributesDiff(game.player.attributes, action.attributesDiff),
    game.history.push({
      action,
      consequence,
    });
};

const generateActions = async (game: Game): Promise<GameAction[]> => {
  const response = await generate({
    system: `
${systemPrelude(game)}

Your task is to come up with a few options for what the player can do next, based on the current situation the player is in and their current attributes. The options should correspond to very different ways of reacting to the current situation. In this way, each option should have a very different \`attributesDiff\` which encodes how taking that option reflects a change in the player's attributes.
`.trim(),
    prompt: `
The following passages describe what has happened so far in the game:

${quoteblock(game.history.map((x) => x.consequence).join("\n\n"))}

The following JSON specifies the player's current attributes:
\`\`\`json
${JSON.stringify(game.player.attributes, null, 4)}
\`\`\`
`.trim(),
    output: {
      schema: z.object({
        options: z
          .array(GameAction)
          .min(2)
          .max(4)
          .describe(
            "Options for what the player can do next. There should be between 2-4 options.",
          ),
      }),
    },
    config: {
      temperature: 1.5,
    },
  });

  if (response.output === undefined || response.output === null) {
    throw new Error("Failed to generate response");
  }

  return response.output.options;
};

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
    "awaiting_action" | "generating_consequence" | "generating_actions"
  >("awaiting_action");

  const [actions, setActions] = useState<GameAction[]>([
    action_ex1,
    action_ex1,
  ]);

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
              <div key={i} className="GameEventView panel">
                <div className="action">
                  <QualiaView qualia={event.action.description} />
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
                  await submitAction(game, action);
                  setGame(game);
                  setActions([]);
                  setStatus("generating_actions");
                  const actions = await generateActions(game);
                  setStatus("awaiting_action");
                  setActions(actions);
                }}
              >
                <div className="label">
                  <QualiaView qualia={action.label} />
                </div>
              </div>
            ))}
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
