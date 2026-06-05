# World-agent interaction

Built for an internship application with https://thehumanoid.ai.

## Installation/setup

1. Clone the repository
2. Ensure you have a recent version of [node.js](https://nodejs.org) installed
3. Run `npm ci` to install dependencies as listed in `package-lock.json`.
4. Get a gemini API key from [google ai studio](https://aistudio.google.com), which needs to be put in the [`.env`](./.env) file.
5. You can tweak other configuration settings in `.env`, including the choice of model to use. The provided `.env` file is commented so that configuration settings can be easily understood hopefully.

*Note*: `.env` is gitignored so that API keys aren't accidentally committed. API keys should never be uploaded publicly.

## Design choices/process

I wanted to use an observatino format that was relatively easy for me to create ad produce data for, so I chose to simply provide a distance sensor, to provide data about how far away the nearest object in the agent's sightline is. I was also interested to see if an LLM would actually be able to deal with this; it is very simple to program a robot to follow a path using this sort of data normally, but because LLMs' numerical reasoning is often fairly abysmal, I was interested to see how they would cope with the basic stuff like that, and then if it could be extended to try to detect specific objects. The generic `World` interface is defined in [`src/world.ts`]( ./src/world.ts), with more specific worlds (with data), along with objective instructions, in the [`src/tasks`](./src/tasks/) directory.

I chose to use gemini because it has a (limited) free tier on its API. It also cupports code execution and function calls, which means that the client shouldn't need to interact with the agent using natural language, beyond the initial instructions. The workflow is, roughly speaking:

- Create an initial interaction, consisting of an instruction outlining the goal, and how to use functions, along with a list of functions that gemini can call
- Then, until a queue of interactions is exhausted, or gemini returns a final result outpu:
- - If the response requests a function call, execute the function on the `World` and queue a new interaction that returns the data as JSON
- - If the response includes a thought, or code execution, ignore it
- - If the response is a result, terminate
- - Create the next queued interaction

I initially didn't use code execution, but the LLM completely failed to do any actual calculations, and just guessed a result (the goal was to measure a rectangular room) based on what it thought an average room size is (apparently 2mx3mx2m).

## Example runs

### `measure_room_simple`

Goal: measure the dimensions of a rectangular room, where the agent starts in the centre of the room, facing a wall.

Log: [logs/measure_room_simple.txt](./logs/measure_room_simple.txt)

Completed in 3 interactions!

## License

This repository is licensed under the [MPL-2.0 license](./LICENSE).
