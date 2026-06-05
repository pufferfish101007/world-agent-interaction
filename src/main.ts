import { Agent } from './interaction.ts';
import { tasks } from './tasks.ts';

const agent = new Agent();


console.log(await agent.execute_task(tasks.measure_room_simple));
