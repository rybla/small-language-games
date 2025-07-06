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
import { presentGameWorld } from "./semantics";
import Markdown from "react-markdown";
import { unwords } from "@/utility";

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
      <div className={style["title"]}>escape-room</div>
      <div className={style["panels"]}>
        <PlayGame
          game={game}
          playerName={playerName}
          update_game={update_game}
        />
        <CurrentGame game={game} />
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
  switch (props.action.type) {
    case "PlayerDropsItem": {
      return (
        <div
          className={unwords(style["PlayerAction"], style["PlayerDropsItem"])}
        >
          <div className={style["label"]}>PlayerDropsItem</div>
          <div className={style["args"]}>
            <LabeledValue label="item" value={props.action.item} />
          </div>
        </div>
      );
    }
    case "PlayerEquipsItem": {
      return (
        <div
          className={unwords(style["PlayerAction"], style["PlayerEquipsItem"])}
        >
          <div className={style["label"]}>PlayerEquipsItem</div>
          <div className={style["args"]}>
            <LabeledValue label="item" value={props.action.item} />
          </div>
        </div>
      );
    }
    case "PlayerMovesInsideCurrentRoom": {
      return (
        <div
          className={unwords(
            style["PlayerAction"],
            style["PlayerMovesInsideCurrentRoom"],
          )}
        >
          <div className={style["label"]}>PlayerMovesInsideCurrentRoom</div>
          <div className={style["args"]}>
            <LabeledValue
              label="newPlayerLocationDescription"
              value={props.action.newPlayerLocationDescription}
            />
          </div>
        </div>
      );
    }
    case "PlayerStoresItemInInventory": {
      return (
        <div
          className={unwords(
            style["PlayerAction"],
            style["PlayerStoresItemInInventory"],
          )}
        >
          <div className={style["label"]}>PlayerStoresItemInInventory</div>
          <div className={style["args"]}>
            <LabeledValue label="item" value={props.action.item} />
          </div>
        </div>
      );
    }
    case "PlayerTakesItem": {
      return (
        <div
          className={unwords(style["PlayerAction"], style["PlayerTakesItem"])}
        >
          <div className={style["label"]}>PlayerTakesItem</div>
          <div className={style["args"]}>
            <LabeledValue label="item" value={props.action.item} />
          </div>
        </div>
      );
    }
  }
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
        </div>
        <div className={style["prompt"]}>
          <LabeledValue
            label="player"
            value={props.playerName ?? "undecided"}
          />
          <InputField label="prompt" inputRef={prompt_inputRef} />
          <Button
            onClick={async () => {
              if (props.playerName !== undefined) {
                const prompt = prompt_inputRef.current!.value;
                set_partialTurn({
                  name: props.playerName,
                  prompt,
                });
                await promptGame(game.name, props.playerName, prompt);
                set_partialTurn(undefined);
                props.update_game();
              }
            }}
          >
            Submit
          </Button>
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
      <Button onClick={async () => update_savedGamenames()}>Update</Button>
    </Section>
  );
}

function CurrentGame(props: { game: Game | undefined }) {
  // const gameName = props.game?.name;

  // useEffect(
  //   () => {
  //     if (props.game === undefined) {
  //       set_playerName(undefined);
  //       return;
  //     }
  //     set_playerName(props.game.world.players[0]?.name);
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [gameName],
  // );

  return (
    <Panel title="Current Game" classNames={[style["CurrentGame"]]}>
      <Section title="Current Game">
        {props.game === undefined ? (
          <></>
        ) : (
          <div className={unwords(style["Markdown"], style["scrollable"])}>
            <Markdown>{presentGameWorld(props.game)}</Markdown>
          </div>
        )}
      </Section>
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
}) {
  return (
    <div className={style["InputField"]}>
      <div className={style["label"]}>{props.label}</div>
      <textarea
        className={style["input"]}
        ref={props.inputRef}
        placeholder={props.placeholder}
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
