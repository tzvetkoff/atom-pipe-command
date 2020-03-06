'use babel';

import { CompositeDisposable, Disposable, TextEditor } from 'atom';
import WaitGroup from './wait_group'
import { spawn } from 'child_process';

export default class PipeCommandView {
  constructor() {
    this.disposables = new CompositeDisposable();

    this.element = document.createElement('div');
    this.element.classList.add('pipe-command');

    this.commandEditor = new TextEditor({mini: true});
    this.disposables.add(new Disposable(() => {
      this.commandEditor.element.removeEventListener('blur');
    }));
    this.commandEditor.element.addEventListener('blur', () => this.hide);
    this.element.appendChild(this.commandEditor.element);

    this.helpMessage = document.createElement('div');
    this.helpMessage.classList.add('message');
    this.helpMessage.textContent = 'Enter command (e.g. sed \'s/^/\\/\\/ /g\')';
    this.element.appendChild(this.helpMessage);

    this.disposables.add(atom.commands.add(this.element, {
      'core:confirm': () => this.confirm(),
      'core:cancel': () => this.hide()
    }));

    this.panel = atom.workspace.addModalPanel({ item: this.element, visible: false })
  }

  destroy() {
    this.disposables.dispose();
    this.element.remove();
  }

  show(force) {
    const activeTextEditor = atom.workspace.getActiveTextEditor();
    if (!activeTextEditor) {
      return;
    }

    this.force = force;

    this.panel.show();
    this.commandEditor.setText('');
    this.commandEditor.element.focus();
  }

  hide() {
    this.panel.hide();
  }

  confirm() {
    const activeTextEditor = atom.workspace.getActiveTextEditor();
    if (!activeTextEditor) {
      return;
    }

    const originalCommand = this.commandEditor.getText();
    if (!originalCommand) {
      return;
    }

    let command = originalCommand;
    if (atom.project.rootDirectories && atom.project.rootDirectories[0]) {
      command = 'cd "' + atom.project.rootDirectories[0].path.replace(/["$]/, '\\$1') + '" && ' + command;
    }

    const waitGroup = new WaitGroup(() => {
      this.hide();
      atom.views.getView(activeTextEditor).focus();
    });

    activeTextEditor.getSelectedBufferRanges().forEach((range) => {
      waitGroup.add();

      const marker = activeTextEditor.markBufferRange(range, { reversed: true, invalidate: 'never' });

      let stdout = '';
      let stderr = '';

      let proc = spawn(process.env.SHELL, ['-l', '-c', command]);

      proc.stdout.on('data', (data) => stdout += data);
      proc.stderr.on('data', (data) => stderr += data);
      proc.on('close', (code) => {
        if (code == 0) {
          activeTextEditor.setTextInBufferRange(marker.getBufferRange(), stdout);
        } else if (this.force) {
          activeTextEditor.setTextInBufferRange(marker.getBufferRange(), stdout);
          atom.notifications.addWarning('The command `' + originalCommand + '` exited with code ' + code, {
            detail: stderr,
            dismissable: true
          });
        } else {
          atom.notifications.addError('The command `' + originalCommand + '` exited with code ' + code, {
            detail: stderr,
            dismissable: true
          });
        }

        waitGroup.done();
      })

      proc.stdin.write(activeTextEditor.getTextInBufferRange(marker.getBufferRange()));
      proc.stdin.end();
    });
  }
}
