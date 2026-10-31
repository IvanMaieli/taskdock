import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseWorkflow } from '../src/shared/workflow.ts';

const example = () => JSON.parse(readFileSync(new URL('../examples/project-checks.json', import.meta.url), 'utf8'));

test('accepts the documented workflow and returns independent data', () => {
  const input = example();
  const parsed = parseWorkflow(input);
  assert.deepEqual(parsed, input);
  parsed.tasks[0].args.push('changed');
  assert.deepEqual(input.tasks[0].args, ['run', 'lint']);
});

test('rejects malformed configuration and unsupported versions', () => {
  for (const input of [null, [], {}, { ...example(), version: 2 }]) {
    assert.throws(() => parseWorkflow(input));
  }
  const input = example();
  input.tasks[0].args = 'run lint';
  assert.throws(() => parseWorkflow(input), /Invalid task/);
});

test('rejects duplicate IDs, missing dependencies, and cycles', () => {
  const duplicate = example();
  duplicate.tasks.push(duplicate.tasks[0]);
  assert.throws(() => parseWorkflow(duplicate), /unique/);
  const missing = example();
  missing.tasks[0].dependsOn = ['unknown'];
  assert.throws(() => parseWorkflow(missing), /Unknown dependency/);
  const cycle = example();
  cycle.tasks[0].dependsOn = ['build'];
  assert.throws(() => parseWorkflow(cycle), /cycle/);
});
