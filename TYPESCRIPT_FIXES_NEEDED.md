# TypeScript Fixes Required

## TrainingStudioPage.tsx

The following changes need to be made to fix TypeScript errors:

1. Line 68: Change `cancelTraining` to `stopTraining` in the destructured assignment
2. Line 69: Remove the parameter from `useAvailableModels()` call
3. Line 86-93: Comment out or remove the `getJobLogs` usage in useEffect
4. Line 164: Change `startTraining(jobName, config)` to `startTraining({ ...config, name: jobName })`
5. Line 190: Change `cancelTraining(jobId)` to `stopTraining(jobId)`

These changes are needed because:
- The `useTraining` hook provides `stopTraining` instead of `cancelTraining`
- The `useAvailableModels` hook doesn't accept any parameters
- The `getJobLogs` method is not implemented in the `useTraining` hook
- The `startTraining` method expects a single config object with the name included