# TaskDock

**Repeatable command-line workflows, managed from one local interface.**

TaskDock is a planned developer tool for defining, running, and monitoring command-line workflows. It will bring task configuration, dependency ordering, execution status, and logs into a single interface for personal software projects.

> **Project status:** Early foundation. Workflow types, configuration validation, and a local health API are implemented. The features below describe the intended first version; workflow execution and the interface are not implemented yet.

## Why TaskDock?

Working on a project often means repeating the same sequence: check the code, run tests, build the application, and inspect several terminals when something fails.

TaskDock aims to make that sequence explicit and reusable. Define the commands once, specify which tasks depend on others, and launch the workflow with a clear view of what is running, what succeeded, and what needs attention.

## Planned features

- **Workflow editor:** Create, edit, duplicate, and delete tasks and workflows.
- **Task configuration:** Set each task's executable, arguments, and working directory.
- **Dependency-aware execution:** Run prerequisites before their dependent tasks and reject circular dependencies.
- **Live monitoring:** Display task status, elapsed time, exit codes, and streamed output.
- **Failure handling:** Stop scheduling dependent tasks when a prerequisite fails.
- **Cancellation:** Stop a workflow and terminate its running child processes.
- **Local persistence:** Save workflow definitions between sessions.
- **Import and export:** Move workflow configurations between personal projects as JSON files.

## Example workflow

A workflow named `Project checks` could contain:

| Task | Example command | Depends on |
| --- | --- | --- |
| Lint | `npm run lint` | None |
| Test | `npm test` | Lint |
| Build | `npm run build` | Test |

Starting this workflow would run linting first, then tests, then the build. If tests fail, the build would be marked as skipped, with the failed task's output available for inspection.

These commands are examples for a separate sample project; they are not installation or execution commands for TaskDock itself.

### Proposed configuration format

The following illustrates the intended format. It may change during implementation.

```json
{
  "version": 1,
  "name": "Project checks",
  "tasks": [
    {
      "id": "lint",
      "label": "Lint",
      "executable": "npm",
      "args": ["run", "lint"],
      "cwd": ".",
      "dependsOn": []
    },
    {
      "id": "test",
      "label": "Test",
      "executable": "npm",
      "args": ["test"],
      "cwd": ".",
      "dependsOn": ["lint"]
    },
    {
      "id": "build",
      "label": "Build",
      "executable": "npm",
      "args": ["run", "build"],
      "cwd": ".",
      "dependsOn": ["test"]
    }
  ]
}
```

Relative working directories will resolve against the project directory selected by the user. Imported configurations will be validated and shown for review before execution; importing a file will not run its commands.

## Proposed architecture

The initial design is a local web interface backed by a local task runner.

| Component | Responsibility |
| --- | --- |
| Interface | Workflow editing, run controls, status, and log views |
| Local API | Configuration validation and execution requests |
| Scheduler | Dependency validation, execution order, and failure propagation |
| Process runner | Start commands, capture output, and handle cancellation |
| Storage | Read and write versioned workflow configurations |

The proposed stack is TypeScript, React, and Node.js. Final dependencies and supported runtime versions will be documented during implementation.

The local service will bind to loopback and protect execution requests with a per-session token and origin checks. TaskDock will execute commands with the current user's permissions; it is not a sandbox. Only workflows the user trusts should be run.

## First-version scope

The first version will focus on finite tasks, one active workflow at a time, and sequential execution in dependency order. An explicit user action will be required to start a workflow.

Long-running development servers, readiness checks, parallel task execution, scheduled jobs, remote execution, cloud accounts, and team collaboration are outside the initial scope.

Examples and test fixtures will use personal sample projects and synthetic data. TaskDock does not need AI services, production credentials, or other people's personal data for its intended demonstrations.

## Roadmap

The foundation milestone has started. Remaining milestones are planned work.

| Milestone | Deliverables | Estimated effort |
| --- | --- | ---: |
| Foundation | Project setup, configuration types, local API | 3 hours |
| Workflow editor | Task forms, dependency selection, validation feedback | 5 hours |
| Execution engine | Dependency ordering, process execution, failure handling | 6 hours |
| Monitoring and controls | Live output, task states, cancellation | 5 hours |
| Persistence | Local saving, import, export, schema validation | 3 hours |
| Verification and documentation | Automated tests, sample workflows, setup guide, fixes | 8 hours |
| **Total** | **Initial usable version** | **30 hours** |

These are planning estimates, not completed work. Process cancellation and operating-system differences may require additional time. The first release will document the platform actually tested.

## Validation plan

The initial implementation will be checked against these behaviors:

- Invalid task references and dependency cycles are rejected before execution.
- Tasks start only after their prerequisites finish successfully.
- A failed prerequisite prevents its dependent tasks from running.
- Standard output, standard error, and exit codes appear in the interface.
- Cancelling a workflow stops active child processes on the supported platform and prevents pending tasks from starting.
- Malformed imports do not overwrite saved workflows.
- Saved configurations survive an application restart.
- Requests without valid local-session authorization cannot start commands.

## Getting started

Use Node.js 24 or newer and npm:

```sh
npm install
npm run typecheck
npm test
npm start
```

The API binds to `127.0.0.1:4310`. Visit `http://127.0.0.1:4310/api/health` to check it. Set `PORT` to change the port, or use `npm run dev` to restart automatically on changes.

The small foundation is organized as follows:

- `src/shared/workflow.ts`: versioned configuration types and import validation, including dependency references and cycles.
- `src/server/`: read-only local API and startup entry point.
- `examples/project-checks.json`: sample configuration; no commands are executed.
- `test/`: configuration validation and API checks.

There is no UI, scheduler, process runner, or persistence yet. Session authorization and origin checks must be added before introducing execution endpoints.

## Contributing

During the planning stage, useful contributions include feedback on the workflow format, scheduler behavior, and interface design. Implementation proposals should stay within the first-version scope and include a reproducible sample or test where appropriate.

## License

MIT. See [LICENSE](LICENSE).
