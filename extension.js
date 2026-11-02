'use strict';
const vscode = require('vscode');
let enabled = false, busy = false, pending = null, timer = null, status, output;
const COMMAND = 'antigravity.prioritized.agentAcceptAllInFile';
function activate(context) {
  output = vscode.window.createOutputChannel('Auto Accept Files');
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  status.command = 'autoAcceptFiles.toggle'; status.show();
  context.subscriptions.push(output, status);
  const update = () => { status.text = `$(file-code) Auto Accept Files: ${enabled ? 'ON' : 'OFF'}`; };
  const cancel = () => { if (timer) clearTimeout(timer); timer = null; pending = null; };
  const allowed = (doc) => !!doc && doc.uri.scheme === 'file' && vscode.workspace.isTrusted && !!vscode.workspace.getWorkspaceFolder(doc.uri);
  async function accept(doc, reason) {
    if (!enabled || busy || !allowed(doc)) return;
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== doc.uri.toString()) return;
    busy = true;
    try {
      const cmds = await vscode.commands.getCommands(true);
      if (!cmds.includes(COMMAND)) { output.appendLine('Internal accept command unavailable.'); return; }
      await vscode.commands.executeCommand(COMMAND);
      output.appendLine(`${new Date().toISOString()} Invoked file-only accept (${reason}): ${doc.uri.fsPath}; result not independently verified.`);
    } catch (e) { output.appendLine(`Error: ${String(e)}`); }
    finally { busy = false; }
  }
  function schedule(doc) {
    if (!enabled || !allowed(doc)) return;
    cancel();
    // Only respond to a recent edit to the active workspace file. Never approve on a blind recurring timer.
    pending = {uri:doc.uri.toString(), version:doc.version};
    const delay = Math.max(1200, vscode.workspace.getConfiguration('autoAcceptFiles').get('debounceMs', 2200));
    timer = setTimeout(async () => {
      const p = pending; pending = null; timer = null;
      const active = vscode.window.activeTextEditor?.document;
      if (p && active && active.uri.toString() === p.uri && active.version === p.version) await accept(active, 'edit event');
    }, delay);
  }
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
    if (e.contentChanges.length && vscode.window.activeTextEditor?.document === e.document) schedule(e.document);
  }));
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => cancel()));
  context.subscriptions.push(vscode.commands.registerCommand('autoAcceptFiles.toggle', () => {
    enabled = !enabled; if (!enabled) cancel(); update();
    vscode.window.showInformationMessage(`Auto Accept Files: ${enabled ? 'ON' : 'OFF'}`);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('autoAcceptFiles.testOnce', async () => {
    const doc = vscode.window.activeTextEditor?.document;
    if (!allowed(doc)) return vscode.window.showWarningMessage('Open a file inside a trusted workspace first.');
    const answer = await vscode.window.showWarningMessage('Invoke the undocumented file acceptance command once for the active file?', {modal:true}, 'Run test');
    if (answer !== 'Run test') return;
    const wasEnabled = enabled; enabled = true;
    try { await accept(doc, 'manual test'); } finally { enabled = wasEnabled; update(); }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('autoAcceptFiles.showLog', () => output.show()));
  context.subscriptions.push({dispose: cancel});
  update(); output.appendLine('v0.2.0 loaded OFF. Only the file-accept command is invoked.');
}
function deactivate() { if (timer) clearTimeout(timer); }
module.exports = {activate, deactivate};
