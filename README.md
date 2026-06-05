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

I chose to use gemini because it has a (limited) free tier on its API. It also supports code execution and function calls, which means that the client shouldn't need to interact with the agent using natural language, beyond the initial instructions. The workflow is, roughly speaking:

- Create an initial interaction, consisting of an instruction outlining the goal, and how to use functions, along with a list of functions that gemini can call
- Then, until a queue of interactions is exhausted, or gemini returns a final result outpu:
- - If the response requests a function call, execute the function on the `World` and queue a new interaction that returns the data as JSON
- - If the response includes a thought, or code execution, ignore it
- - If the response is a result, terminate
- - Create the next queued interaction

I initially didn't use code execution, but the LLM completely failed to do any actual calculations, and just guessed a result (the goal was to measure a rectangular room) based on what it thought an average room size is (apparently 2mx3mx2m).

I spent a while trying to engineer the prompts to get the LLM to actually do what it was meant to, but I ultimately didn't have much success for more complicated cases (see below). I think this is largely down to the model I was using being very light-weight.

The data that the LLM was able to request access to was:

- x, y, z coordinates
- horizontal rotation, relative to the x-z plane
- vertical angle, relative to the x-y plane

Functions allowed it to change its position and angle, and read sensor data (distance to nearest wall) and position/angle state.

When the conversation was sufficiently small, the descriptions of the various functions were well understood. When conversations went on for longer, these seemed to get lost outside of the context window and mistakes were made.

## Example runs

### `measure_room_simple`

Goal: measure the dimensions of a rectangular room, where the agent starts in the centre of the room, facing a wall.

Log: [logs/measure_room_simple.txt](./logs/measure_room_simple.txt)

Completed in 3 interactions!

### `measure_room_harder`

Goal: measure the dimensions of a rectangular room, where the starting position is not necessarily the centre of the room, and walls might no be at angles 0, 90, 180, 270.

Logs: [logs/measure_room_harder_failed.txt](./logs/measure_room_harder_failed.txt) (failed due to ratelimiting, and was on track to get the wrong answer anyway, but at least found its way into the centre of the room); this is just one example of a failed attempt, but is probably the closest to getting it correct.

This was significantly more difficult for the LLM to complete. I ended up having to repeat several times in the instructions that the walls were NOT at the usual 0, 90 etc angles, which is unfortunate. Across different tries, the LLM tried various approaches, including walking to a wall and scanning for adjacent walls there, or finding its way into the centre of the room, but ultimately wasn't able to complete the task. It also had a tendency to ignore the instructions that the walls were at an angle.

I think a more powerful model is needed to effectively tackle these problems.

It may also help to send the initial instructions along with every single function call response, so that it stays fresh in the context window.

## Future extension

I wanted to be able to get up to asking the agent to find a box in a room, and maybe measure it, but seeing as it fails even at simpler tasks, I didn't end up trying this. If you have paid access to more powerful models, please consider trying it out and let me know how it goes.

Hallucination was also a massive issue - at various point, the LLM thought that the angle it was facing was a temperature, or a timestamp.

Ultimately though, LLMs really aren't designed for this sort of task in my opinion; a more specialised machine learning algorithm would be much better suited (for tasks like finding a box - the general measuring objects problem doesn't really need ML at all), and no doubt more cost-effective.


## License

This repository is licensed under the [MPL-2.0 license](./LICENSE).
