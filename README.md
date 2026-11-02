# Antigravity Auto Accept Files v0.2.0 (experimental)

Author: Gilmar Silva Santos

Target: Antigravity IDE 2.5.5 / VS Code OSS 1.107.0 on Windows.

## What it does
- Starts OFF. Click `Auto Accept Files: OFF` on the status bar to turn ON.
- When the **active editor document** inside a trusted workspace changes, waits 2.2 seconds without additional edits, then invokes the experimentally validated internal command `antigravity.prioritized.agentAcceptAllInFile` once.
- Does not execute terminal commands, approve `Run`/`Allow` prompts, or use CDP.
- `Auto Accept Files: Show Log` shows attempts. A logged invocation does not prove the change was accepted.

## Limitations
- Only triggers if an active editor file generates a VS Code text-document change event. Agent edits may not generate this event in some workflows, or the relevant file may not be active. The extension may therefore miss the `Accept all` button in the agent chat.
- The internal command is undocumented and its scope is not guaranteed; test in a disposable project. It may accept more than the intended change within the active file.
- This is NOT proven end-to-end automatic for this IDE build; only manual invocation was confirmed by the user.

## Build
With Node.js and npm installed, open PowerShell in this folder:

```powershell
npm install
npx vsce package --no-dependencies
```

Install the resulting `.vsix` using `Extensions: Install from VSIX...`.
If v0.1.0 is installed, installing v0.2.0 updates it. Restart the IDE.

## Test
1. Use a disposable trusted workspace, with terminal permission review enabled.
2. Enable status bar toggle `Auto Accept Files: ON`.
3. Open a file in the editor; request an agent edit to that file.
4. Wait 3–5 seconds, then check if the change is accepted. If not, open `Auto Accept Files: Show Log`.
5. Toggle OFF after testing.
