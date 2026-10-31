/** Version 1 of the portable workflow definition. Paths are project-relative. */
export interface TaskDefinition {
  id: string;
  label: string;
  executable: string;
  args: string[];
  cwd: string;
  dependsOn: string[];
}

export interface WorkflowDefinition {
  version: 1;
  name: string;
  tasks: TaskDefinition[];
}

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'cancelled';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

/** Validate imported data without starting commands or changing stored state. */
export function parseWorkflow(value: unknown): WorkflowDefinition {
  if (!isRecord(value) || value.version !== 1 || !nonempty(value.name) || !Array.isArray(value.tasks)) {
    throw new Error('Expected a version 1 workflow with a name and tasks array.');
  }

  const tasks: TaskDefinition[] = value.tasks.map((task: unknown, index: number) => {
    if (!isRecord(task) || !nonempty(task.id) || !nonempty(task.label) ||
        !nonempty(task.executable) || !nonempty(task.cwd) ||
        !strings(task.args) || !strings(task.dependsOn)) {
      throw new Error(`Invalid task at index ${index}.`);
    }
    return {
      id: task.id, label: task.label, executable: task.executable,
      args: [...task.args], cwd: task.cwd, dependsOn: [...task.dependsOn],
    };
  });

  const byId = new Map(tasks.map(task => [task.id, task]));
  if (byId.size !== tasks.length) throw new Error('Task IDs must be unique.');

  // Iterative traversal avoids recursion limits for imported dependency chains.
  const remaining = new Map(tasks.map(task => [task.id, task.dependsOn.length]));
  const dependents = new Map<string, string[]>();
  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!byId.has(dependency)) throw new Error(`Unknown dependency: ${dependency}.`);
      const list = dependents.get(dependency) ?? [];
      list.push(task.id);
      dependents.set(dependency, list);
    }
  }
  const ready = tasks.filter(task => task.dependsOn.length === 0).map(task => task.id);
  for (let index = 0; index < ready.length; index++) {
    for (const id of dependents.get(ready[index]) ?? []) {
      const count = remaining.get(id)! - 1;
      remaining.set(id, count);
      if (count === 0) ready.push(id);
    }
  }
  if (ready.length !== tasks.length) throw new Error('Task dependencies contain a cycle.');
  return { version: 1, name: value.name, tasks };
}
