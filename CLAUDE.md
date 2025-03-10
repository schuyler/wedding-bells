# MARC-WITH-A-SEA Development Guide

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build the app
- `npm run lint` - Run ESLint
- `npm run test` - Run all tests
- `npm run test:coverage` - Run tests with coverage reporting
- `npx vitest <test-file-pattern>` - Run specific tests

## Code Style Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Functional components with React hooks, explicit prop interfaces
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions
- **Imports**: Group external dependencies first, then internal modules
- **Error Handling**: Use try/catch with explicit error type checking
- **State Management**: Context API for global state, useState for component state
- **Testing**: Component tests use @testing-library/react with setup/teardown hooks
- **Documentation**: JSDoc comments for components and functions
- **Coverage Requirements**: 80% statements, 75% branches, 80% functions/lines

## File Organization

Components live in dedicated folders with related test files in `__tests__` directories.

## Rules for performing a task

Here is my workflow for performing a task:

1. Gather information about requirements and existing work
2. Ask questions about requirements and "definition of done"
3. Determine a plan for executing the work
4. Review and revise the plan with the user's help
5. Execute the plan to produce the work
6. Identify flaws in the work
7. Repeat from step 1 until I am confident the work is complete
8. Begin the task completion workflow below

Here are some rules for each step of the workflow:

- I must never skip any of these steps. I must perform all of them in order.
- I must always identify which step in the workflow I am about to perform.
- I must always stop and review my progress before continuing to the next step. I must make sure that my review makes sense.  

Before I use any tool, I should say "Yallah!" -- which is Arabic for "Let's go!"

## Rules for Unit Testing [!atomic]

Two foundational rules that must NEVER be broken:

1. NEVER modify code while writing tests
   - Tests verify existing behavior
   - Code changes belong in separate tasks
   - If code needs changes, stop and create a new task

2. NEVER continue until current tests pass
   - Failing tests indicate misunderstanding
   - Fix failing tests before adding new ones
   - Green tests are required to proceed

3. Test Only What Exists
   - Test only the public interface
   - Never test implementation details
   - Never test assumed functionality
   - Never test non-existent features

4. Test Behavior Not Implementation
   - Focus on what, not how
   - Test observable outcomes
   - Avoid testing internal state
   - Test side effects through public API

5. Mock with Purpose
   - Mock only external dependencies
   - Clear mocks between tests
   - Mock at boundaries only
   - Document mock assumptions

The goal of these rules is to ensure:

- Tests verify actual behavior
- Tests remain maintainable
- Tests serve as documentation
- Tests catch real problems

## Rules for planning changes

I must never make changes to work done by a human without asking first. I must never pretend I
know something if I am not certain that I know it. Asking questions is always better than making errors. We
love questions.

1. Understand Standard Patterns First
   - Before attempting implementation, read the documentation
   - Research and identify the standard patterns in the relevant ecosystem
   - Question if the problem is really a problem or just unfamiliarity with conventions
   - Avoid workarounds until standard approaches are proven insufficient

2. Library Integration First
   - Before implementing manual solutions, check for specialized plugins/modules
   - Tyype errors often indicate misunderstanding of intended API usage
   - Document discoveries of built-in solutions with URLs for reference
   - Treat compiler errors as hints to consult documentation

3. Read the documentation
   - You can always pause and review the documentation
   - Documentation might be local or online -- you can always download the documentation you need

4. Start with the Simplest Case
   - When implementing a feature, start with the most basic working version
   - Research real-world usage patterns before adding complexity
   - Avoid premature feature checking or optimization
   - Add complexity only when proven necessary by requirements

5. Communicate changes with clarity
   - Summarize what you are trying to do
   - Explain why you think it will work
   - Document your understanding of the impact

6. Ask permission before making big changes
   - Ask for permission before:
     - Making significant changes to existing logic
     - Making optional enhancements
     - Adding new dependencies to the project
   - Wait for explicit approval

## Rules for writing code

- Always write clear, unambiguous, idiomatic code for whatever language you're working in.
- Always write code that is type-safe. Code that isn't type-safe is NOT complete.
- Use comments liberally to record your intentions as you write code
- Be cautious when changing code you didn't write. Better to ask permission than for the user to get annoyed.

## Problem Solving Rules

When encountering issues or unexpected behavior, I MUST follow these steps:

## Understanding the Problem [!atomic]

1. Identify Specifics:
   - What exact error or unexpected behavior occurred?
   - Which specific line or section of code triggered it?
   - What was my understanding of how this part should work?

2. Debug the Approach:
   - What assumptions did I make that might be incorrect?
   - What documentation or examples did I consult?
   - Can I explain step-by-step how I thought it would work?
   - Ask "why" five times, like the Toyota Way
   - Do NOT make assumptions that I know what is wrong -- find the ROOT CAUSE

3. Knowledge Assessment:
   - Which parts of the implementation am I unsure about?
   - What specific language features or patterns are involved that I might need to research?
   - Have I encountered similar issues before, and how were they different?
   - Is there anything in my idea store that might help me understand my task better?

## Core Rules [!atomic]

1. Stop After Three Attempts
   - If I try three times to fix the same error and fail
   - I MUST stop and admit that I don't know how to proceed
   - Do not continue trying solutions that have already failed

2. Ask Questions
   - It is ALWAYS preferable to ask questions than to be confidently wrong
   - Do not try solutions at random
   - Request additional documentation if needed

3. Focus on Understanding
   - The goal is not just to fix the current error
   - Identify and address gaps in understanding
   - Document learnings to prevent similar issues
   - Never proceed without clear understanding

4. Dependency Compatibility First
   - When troubleshooting CSS or build issues, check for dependency compatibility problems first
   - Console errors about unknown classes or components often indicate configuration issues
   - Consider downgrading to stable versions when facing complex configuration problems
   - Remember that major version upgrades often require configuration changes

## Documentation Rules [!atomic]

When documenting problems and solutions:

1. Describe the original issue clearly
2. List attempted solutions and their outcomes
3. Explain the root cause when discovered
4. Document any new learnings or patterns identified

If something went wrong during the task, or I made an error, I should document my mistake so
I learn for the future.

I should be clear about what exists and what does not exist yet. If I want to record information about
things that do not exist yet, or action that need to be taken, I should make sure that it is identified as a
plan or a TODO item. Project designs and todo lists are plans, not documentation.

## Adding and updating rules

The .clinerules file contains all the special instructions that detail how the user wishes me to perform tasks.

I MUST NEVER ignore a rule or fail to perform its instructions, or my user may be EXTREMELY ANNOYED.

- I might be given new rules from time to time.
- Rules will be stated in imperative form. They may include words such as "you should", "you must", "don't", "always", or "never".
- I should consider each instruction closely. If I think I have learned a new rule, I should ask to record it in .clinerules.
- I must never remove instructions from .clinerules without permission.

## Task completion workflow

Here are your rules for completing a task. Perform them in order when you think your task is complete.

NEVER skip a single step! NEVER begin this workflow without verification! NEVER consider a task complete until this workflow is complete!

1. MUST verify completion requirements:
    - To Do section is up to date
    - Notes section has entry with today's date
    - Suggestions section is reviewed
2. Only after confirmation:
    - Ask myself: What lessons have I learned from this task?
    - Attempt to summarize new instructions that can be generalized
    - Update CLAUDE.md with any new lessons or rules, but never delete any prior knowledge without permission
3. Only after summarizing and recording lessons learned:
    - Propose to stage the changes (and ONLY the changes) in Git and commit them with an informative message
4. Only after committing the changes to Git (or being given permission not to):
    - Update documentation files in docs/
    - Update todo list as work progresses:
      - Check off completed tasks
      - Add new tasks as they are discovered
    - Update technical architecture with any new decisions made
5. Only after updating project idea files:
    - Use attempt_completion to present final result

No task is complete unless you have performed ALL these steps! Don't even TRY to complete it early!
