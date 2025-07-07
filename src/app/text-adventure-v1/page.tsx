"use client";

import {
  Dispatch,
  MouseEventHandler,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import style from "./page.module.css";
import {
  getGame,
  getSavedGameNames,
  initializeGame,
  promptGame,
} from "./server";
import {
  type PlayerAction,
  type Game,
  type GameName,
  PlayerName,
  PlayerTurn,
} from "./ontology";
import {
  presentGameWorld,
  presentGameWorldFromPlayerPerspective,
} from "./semantics";
import Markdown from "react-markdown";
import { do_, unwords } from "@/utility";

export default function Page() {
  // @ts-expect-error mismatch when inferring type from zod schema
  const [game, set_game]: [Game, Dispatch<SetStateAction<Game>>] = useState<
    Game | undefined
  >(undefined);

  const gameName = game?.name;

  const [playerName, set_playerName] = useState<PlayerName | undefined>(
    undefined,
  );

  useEffect(
    () => {
      set_playerName(game?.world.players[0]?.name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameName],
  );

  async function update_game() {
    if (game !== undefined) {
      set_game(await getGame(game.name));
    }
  }

  return (
    <main className={style["main"]}>
      <div className={style["title"]}>text-adventure-v1</div>
      <div className={style["panels"]}>
        <PlayGame
          game={game}
          playerName={playerName}
          update_game={update_game}
        />
        <CurrentGame game={game} playerName={playerName} />
        <ManageGames set_game={set_game} />
      </div>
    </main>
  );
}

function LabeledValue(props: { label: string; value: string }) {
  return (
    <div className={style["LabeledValue"]}>
      <div className={style["label"]}>{props.label}</div>
      <div className={style["value"]}>{props.value}</div>
    </div>
  );
}

function PlayerActionView(props: { action: PlayerAction }) {
  const [open, set_open] = useState(false);

  return (
    <div
      className={unwords(
        style["PlayerAction"],
        style[props.action.type],
        style[open ? "open" : "closed"],
      )}
      onClick={() => set_open((b) => !b)}
    >
      {do_(() => {
        switch (props.action.type) {
          case "PlayerDropsItem": {
            return (
              <>
                <div className={style["label"]}>{props.action.type}</div>
                <div className={style["args"]}>
                  <LabeledValue label="item" value={props.action.item} />
                  <LabeledValue
                    label="newItemLocationDescription"
                    value={props.action.newItemLocationDescription}
                  />
                  <LabeledValue
                    label="description"
                    value={props.action.description}
                  />
                </div>
              </>
            );
          }
          case "PlayerEquipsItem": {
            return (
              <>
                <div className={style["label"]}>{props.action.type}</div>
                <div className={style["args"]}>
                  <LabeledValue label="item" value={props.action.item} />
                  <LabeledValue
                    label="description"
                    value={props.action.description}
                  />
                </div>
              </>
            );
          }
          case "PlayerMovesInsideCurrentRoom": {
            return (
              <>
                <div className={style["label"]}>{props.action.type}</div>
                <div className={style["args"]}>
                  <LabeledValue
                    label="newPlayerLocationDescription"
                    value={props.action.newPlayerLocationDescription}
                  />
                  <LabeledValue
                    label="description"
                    value={props.action.description}
                  />
                </div>
              </>
            );
          }
          case "PlayerStoresItemInInventory": {
            return (
              <>
                <div className={style["label"]}>{props.action.type}</div>
                <div className={style["args"]}>
                  <LabeledValue label="item" value={props.action.item} />
                  <LabeledValue
                    label="newItemLocationDescription"
                    value={props.action.newItemLocationDescription}
                  />
                  <LabeledValue
                    label="description"
                    value={props.action.description}
                  />
                </div>
              </>
            );
          }
          case "PlayerTakesItem": {
            return (
              <>
                <div className={style["label"]}>{props.action.type}</div>
                <div className={style["args"]}>
                  <LabeledValue label="item" value={props.action.item} />
                  <LabeledValue
                    label="newItemLocationDescription"
                    value={props.action.newItemLocationDescription}
                  />
                  <LabeledValue
                    label="description"
                    value={props.action.description}
                  />
                </div>
              </>
            );
          }
        }
      })}
    </div>
  );
}

function PlayGame(props: {
  game: Game | undefined;
  playerName: PlayerName | undefined;
  update_game: () => Promise<void>;
}) {
  const prompt_inputRef = useRef<HTMLTextAreaElement>(null);
  const [partialTurn, set_partialTurn] = useState<
    Omit<PlayerTurn, "actions" | "description"> | undefined
  >(undefined);
  const turns_bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    turns_bottomRef.current?.scrollIntoView({ block: "end" });
  }, [props.game, partialTurn]);

  async function submit(game: Game) {
    if (props.playerName !== undefined) {
      const prompt = prompt_inputRef.current!.value;
      prompt_inputRef.current!.value = "";
      try {
        set_partialTurn({
          name: props.playerName,
          prompt: prompt.trim(),
        });
        await promptGame(game.name, props.playerName, prompt);
        set_partialTurn(undefined);
        props.update_game();
      } catch (exception: unknown) {
        prompt_inputRef.current!.value = prompt;
        set_partialTurn(undefined);
        throw exception;
      }
    }
  }

  if (props.game === undefined) {
    return (
      <Panel title="Play Game" classNames={[style["PlayGame"]]}>
        <div>no active game</div>
      </Panel>
    );
  } else {
    const game = props.game;
    return (
      <Panel title="Play Game" classNames={[style["PlayGame"]]}>
        <div className={style["turns"]}>
          {game.turns.map((turn, i) => (
            <div key={i} className={style["PlayerTurn"]}>
              <div className={style["name"]}>{turn.name}</div>
              <div className={style["prompt"]}>{turn.prompt}</div>
              <div className={style["actions"]}>
                {turn.actions.map((action, i) => (
                  <PlayerActionView key={i} action={action} />
                ))}
              </div>
              <div className={style["description"]}>{turn.description}</div>
            </div>
          ))}
          {/* partialTurn */}
          {partialTurn === undefined ? (
            <></>
          ) : (
            <div className={style["PlayerTurn"]}>
              <div className={style["name"]}>{partialTurn.name}</div>
              <div className={style["prompt"]}>{partialTurn.prompt}</div>
            </div>
          )}
          <div ref={turns_bottomRef}></div>
        </div>
        <div className={style["prompt"]}>
          <LabeledValue
            label="player"
            value={props.playerName ?? "undecided"}
          />
          <InputField
            label="prompt"
            inputRef={prompt_inputRef}
            onEnter={async () => await submit(game)}
          />
          <Button onClick={async () => await submit(game)}>Submit</Button>
        </div>
      </Panel>
    );
  }
}

function ManageGames(props: { set_game: Dispatch<SetStateAction<Game>> }) {
  return (
    <Panel title="Manage Games" classNames={[style["ManageGames"]]}>
      <NewGame set_game={props.set_game} />
      <SavedGames set_game={props.set_game} />
    </Panel>
  );
}

function NewGame(props: { set_game: Dispatch<SetStateAction<Game>> }) {
  const prompt_game_inputRef = useRef<HTMLTextAreaElement>(null);
  const prompt_room_inputRef = useRef<HTMLTextAreaElement>(null);
  const prompt_player_inputRef = useRef<HTMLTextAreaElement>(null);
  const [status, set_status] = useState("awaiting input");

  return (
    <Section title="New Game">
      <Section title="Prompts">
        <InputField label="game" inputRef={prompt_game_inputRef} />
        <InputField label="room" inputRef={prompt_room_inputRef} />
        <InputField label="player" inputRef={prompt_player_inputRef} />
      </Section>
      <Button
        onClick={async () => {
          try {
            set_status("initializing new game...");
            const gameName = await initializeGame({
              game: prompt_game_inputRef.current!.value,
              room: prompt_room_inputRef.current!.value,
              player: prompt_player_inputRef.current!.value,
            });
            set_status(`successfully initialize a new game "${gameName}"`);
            props.set_game(await getGame(gameName));
          } catch (exception: unknown) {
            if (exception instanceof Error) {
              set_status(
                `failed to initialize a new game:\n${exception.toString()}`,
              );
            } else {
              set_status("failed to initialize a new game");
              throw exception;
            }
          }
        }}
      >
        Submit
      </Button>
      <Section title="Status">{status}</Section>
    </Section>
  );
}

function SavedGames(props: { set_game: Dispatch<SetStateAction<Game>> }) {
  const [savedGamenames, set_savedGamenames] = useState<GameName[]>([]);

  async function update_savedGamenames() {
    set_savedGamenames(await getSavedGameNames());
  }

  useEffect(() => {
    update_savedGamenames();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      update_savedGamenames();
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Section title="Saved Games">
      {savedGamenames.map((name, i) => (
        <Button
          key={i}
          onClick={async () => props.set_game(await getGame(name))}
        >
          {name}
        </Button>
      ))}
    </Section>
  );
}

function CurrentGame(props: {
  game: Game | undefined;
  playerName: PlayerName | undefined;
}) {
  return (
    <Panel title="Current Game" classNames={[style["CurrentGame"]]}>
      {props.game === undefined ? (
        <></>
      ) : (
        <Section title="Game World –– God's Perspective">
          <div className={unwords(style["Markdown"], style["scrollable"])}>
            <Markdown>{presentGameWorld(props.game)}</Markdown>
          </div>
        </Section>
      )}

      {props.game === undefined || props.playerName === undefined ? (
        <></>
      ) : (
        <Section title={`Game World –– ${props.playerName}'s Perspective`}>
          <div className={unwords(style["Markdown"], style["scrollable"])}>
            <Markdown>
              {presentGameWorldFromPlayerPerspective(
                props.game,
                props.playerName,
              )}
            </Markdown>
          </div>
        </Section>
      )}
    </Panel>
  );
}

function Panel(props: {
  title: ReactNode;
  children?: ReactNode;
  classNames?: string[];
}) {
  return (
    <div className={unwords(style["Panel"], ...(props.classNames ?? []))}>
      <div className={style["title"]}>{props.title}</div>
      <div className={style["children"]}>{props.children}</div>
    </div>
  );
}

function Section(props: { title: ReactNode; children?: ReactNode }) {
  return (
    <>
      <div className={style["Section-title"]}>{props.title}</div>
      {props.children}
    </>
  );
}

function InputField(props: {
  label: ReactNode;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  onEnter?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => Promise<void>;
}) {
  return (
    <div className={style["InputField"]}>
      <div className={style["label"]}>{props.label}</div>
      <textarea
        className={style["input"]}
        ref={props.inputRef}
        placeholder={props.placeholder}
        onKeyUp={async (event) => {
          if (event.key === "Enter") {
            await props.onEnter?.(event);
          }
        }}
      />
    </div>
  );
}

function Button(props: {
  onClick: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
}) {
  return (
    <button className={style["Button"]} onClick={props.onClick}>
      {props.children}
    </button>
  );
}
