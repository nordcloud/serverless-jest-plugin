'use strict';

const Plugin = require('../index');

describe('plugin', () => {
  it('checks that commands exists', () => {
    const plugin = new Plugin({}, {});
    const commands = Object.keys(plugin.commands);
    expect(commands).toEqual(['create', 'invoke']);
  });

  it('checks hooks exists', () => {
    const plugin = new Plugin({}, {});
    const hooks = Object.keys(plugin.hooks);
    expect(hooks).toEqual([
      'create:test:test',
      'invoke:test:test',
      'create:function:create',
    ]);
  });
});
