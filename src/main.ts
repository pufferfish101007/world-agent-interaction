import { assert } from 'node:console';
import { Agent } from './interaction.ts';
import { tasks } from './tasks.ts';

const agent = new Agent();

const task = process.argv[2]; // argv[0] is node, argv[1] is the file path

assert(typeof task === 'string');
assert(task! in tasks);

console.log(await agent.execute_task(tasks[task as unknown as string]!));
