'use babel';

import PipeCommandView from './pipe_command_view';
import { CompositeDisposable } from 'atom';

export default {
  pipeCommandView: null,
  modalPanel: null,
  subscriptions: null,

  activate() {
    this.pipeCommandView = new PipeCommandView();

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pipe-command:pipe': () => this.pipe(),
      'pipe-command:force-pipe': () => this.forcePipe()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.pipeCommandView.destroy();
  },

  pipe() {
    this.pipeCommandView.show(false);
  },

  forcePipe() {
    this.pipeCommandView.show(true);
  }
};
