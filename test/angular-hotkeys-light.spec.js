describe('Hotkeys', function() {
  var Hotkeys;
  var $rootScope;
  var $compile;

  /**
   * Creates Hotkeys mutable object
   * @param  {Hotkeys} Immutable Immutable Hotkeys object
   * @return {HotkeysMutable}
   */
  var MutableHotkeys = function(Immutable) {
    var Mutable = function() {
      Immutable.call(this);
    };

    Mutable.prototype = Object.create(Immutable.prototype);

    Object.defineProperty(Mutable.prototype, 'keyStringFromEvent', {
      value: function() {
        return Immutable.prototype.keyStringFromEvent.apply(this, arguments);
      }, writable: true
    });

    Object.defineProperty(Mutable.prototype, '_registerKey', {
      value: function() {
        return Immutable.prototype._registerKey.apply(this, arguments);
      }, writable: true
    });

    Object.defineProperty(Mutable.prototype, 'createHotkey', {
      value: function() {
        return Immutable.prototype.createHotkey.apply(this, arguments);
      }, writable: true
    });

    return Mutable;
  };

  var createEvent = function(args) {
    var eventName = args.name || 'keydown';
    var evt = new CustomEvent(eventName, {bubbles: true});
    evt.code = args.code;
    evt.which = args.which;
    evt.keyCode = args.which;
    evt.shiftKey = Boolean(args.shiftKey);
    evt.ctrlKey = Boolean(args.ctrlKey);
    evt.altKey = Boolean(args.altKey);
    evt.metaKey = Boolean(args.metaKey);
    return evt;
  };

  var sendKeydown = function(event) {
    window.dispatchEvent(event);
  };

  var invokeHotkey = function(args) {
    var hotkeyContext = {};
    var hotkeyArgs = {date: Date.now()};

    if (args.code === null || args.code === void 0) { args.code = 1; }
    if (args.which === null || args.which === void 0) { args.which = 49; }

    var hotkeyHandler = jasmine.createSpy(args.combo);
    var hotkey = Hotkeys.createHotkey({
      key: args.combo,
      context: hotkeyContext,
      args: hotkeyArgs,
      callback: hotkeyHandler
    });
    expect(hotkey).not.toBeUndefined();

    Hotkeys.registerHotkey(hotkey);
    expect(Hotkeys._registerKey).toHaveBeenCalled();

    var event = createEvent(args);
    expect(args.combo).toEqual(Hotkeys.keyStringFromEvent(event));
    sendKeydown(event);
    expect(hotkeyHandler).toHaveBeenCalled();

    expect(hotkeyHandler.calls.first()).toEqual({
      object: hotkeyContext,
      args: [event, hotkeyArgs],
      returnValue: void 0
    });

    Hotkeys.deregisterHotkey(hotkey);
    expect(Hotkeys._hotkeys[hotkey.key]).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys[hotkey.key].length).toEqual(0);
  };

  beforeEach(module('fps.hotkeys'));

  beforeEach(module('ngTestApp'));

  beforeEach(inject(function(_$rootScope_, _$compile_, _$Hotkeys_) {
    var Mutable = MutableHotkeys(_$Hotkeys_);
    Hotkeys = new Mutable();
    spyOn(Hotkeys, '_registerKey').and.callThrough();
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  it('be able to clone existing hotkey object', function() {
    var hotkey = Hotkeys.createHotkey({
      key: 'ctrl+a',
      context: null,
      callback: function() {}
    });

    var clone = hotkey.clone();
    expect(hotkey == clone).toBeFalsy();
    expect(hotkey.id).toEqual(clone.id);
    expect(hotkey.key).toEqual(clone.key);
    expect(hotkey.context).toEqual(clone.context);
    expect(hotkey.callback).toEqual(clone.callback);
    expect(hotkey.args).toEqual(clone.args);
    expect(hotkey.onKeyUp).toEqual(clone.onKeyUp);
  });

  it('should return Array when register a hotkey object', function() {
    var hotkey = Hotkeys.createHotkey({key: 'ctrl+a', callback: function(){} });
    var hotkeys = Hotkeys.registerHotkey(hotkey);
    expect(Array.isArray(hotkeys)).toBeTruthy();
  });

  it('should be able to register/deregister hotkey', function() {
    var hotkeys;
    var hotkey = Hotkeys.createHotkey({
      key: 'ctrl+a',
      callback: function() {}
    });

    hotkeys = Hotkeys.registerHotkey(hotkey);
    expect(Array.isArray(hotkeys)).toBeTruthy();
    expect(hotkeys.length).toEqual(1);
    expect(Hotkeys._hotkeys).toEqual(jasmine.any(Object));
    expect(Hotkeys._hotkeys['ctrl+a']).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys['ctrl+a'].length).toEqual(1);

    hotkeys = Hotkeys.deregisterHotkey(hotkey);
    expect(Array.isArray(hotkeys)).toBeTruthy();
    expect(hotkeys.length).toEqual(1);
    expect(Hotkeys._hotkeys).toEqual(jasmine.any(Object));
    expect(Hotkeys._hotkeys['ctrl+a']).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys['ctrl+a'].length).toEqual(0);
  });

  it('should be able to register/deregister multiple keys with shared callback', function() {
    var hotkeys;
    var hotkey = Hotkeys.createHotkey({
      key: ['ctrl+a', 'meta+a'],
      callback: function() {}
    });

    hotkeys = Hotkeys.registerHotkey(hotkey);
    expect(Array.isArray(hotkeys)).toBeTruthy();
    expect(hotkeys.length).toEqual(2);
    expect(Hotkeys._hotkeys).toEqual(jasmine.any(Object));
    expect(Hotkeys._hotkeys['ctrl+a']).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys['ctrl+a'].length).toEqual(1);
    expect(Hotkeys._hotkeys['meta+a']).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys['meta+a'].length).toEqual(1);

    hotkeys = Hotkeys.deregisterHotkey(hotkey);
    expect(hotkeys).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys).toEqual(jasmine.any(Object));
    expect(Hotkeys._hotkeys['ctrl+a']).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys['ctrl+a'].length).toEqual(0);
    expect(Hotkeys._hotkeys['meta+a']).toEqual(jasmine.any(Array));
    expect(Hotkeys._hotkeys['meta+a'].length).toEqual(0);
  });

  it('helper "match" function', function() {
    var event;
    // ctrl+enter
    event = createEvent({code: 'Enter', which: 13, ctrlKey: true});
    expect(Hotkeys.match(event, 'ctrl+enter')).toBeTruthy();

    // ctrl+shift+x
    event = createEvent({code: 'KeyX', which: 88, ctrlKey: true, shiftKey: true});
    expect(Hotkeys.match(event, ['ctrl+shift+x'])).toBeTruthy();
  });

  it('hotkey callback should run angular digest', function() {
    var $scope = $rootScope.$new(true);

    $scope.onToggle = function() {};

    spyOn($scope, 'onToggle').and.callThrough();

    var element = angular.element('<hotkey_cheetsheet on-toggle="onToggle(show)"></hotkey_cheetsheet>');
    $compile(element)($scope);

    invokeHotkey({combo: 'meta+enter', code: 'Enter', which: 13, metaKey: true});

    expect($scope.onToggle).toHaveBeenCalledWith(true);
  });

  it('Combo hotkeys', function() {
    //  ctrl + <key>
    invokeHotkey({combo: 'ctrl+1', ctrlKey: true});

    //  ctrl + alt + <key>
    invokeHotkey({combo: 'ctrl+alt+1', ctrlKey: true, altKey: true});

    //  ctrl + alt + shift + <key>
    invokeHotkey({combo: 'ctrl+alt+shift+1', ctrlKey: true, altKey: true, shiftKey: true});

    //  ctrl + alt + shift + meta + <key>
    invokeHotkey({combo: 'ctrl+alt+shift+meta+1', ctrlKey: true, altKey: true, shiftKey: true, metaKey: true});

    //  ctrl + shift + <key>
    invokeHotkey({combo: 'ctrl+shift+1', ctrlKey: true, shiftKey: true});

    //  ctrl + shift + meta + <key>
    invokeHotkey({combo: 'ctrl+shift+meta+1', ctrlKey: true, shiftKey: true, metaKey: true});

    //  ctrl + meta + <key>
    invokeHotkey({combo: 'ctrl+meta+1', ctrlKey: true, metaKey: true});

    //  alt + <key>
    invokeHotkey({combo: 'alt+1', altKey: true});
    //  alt + shift + <key>
    invokeHotkey({combo: 'alt+shift+1', altKey: true, shiftKey: true});
    //  alt + shift + meta + <key>
    invokeHotkey({combo: 'alt+shift+meta+1', altKey: true, shiftKey: true, metaKey: true});
    //  alt + meta + <key>
    invokeHotkey({combo: 'alt+meta+1', altKey: true, metaKey: true});

    //  shift + <key>
    invokeHotkey({combo: 'shift+1', shiftKey: true});
    //  shift + meta + <key>
    invokeHotkey({combo: 'shift+meta+1', shiftKey: true, metaKey: true});

    // meta + <key>
    invokeHotkey({combo: 'meta+1', metaKey: true});

    // Numpad
    invokeHotkey({combo: '0', code: '0', which: 96});
    invokeHotkey({combo: '1', code: '1', which: 97});
    invokeHotkey({combo: '2', code: '2', which: 98});
    invokeHotkey({combo: '3', code: '3', which: 99});
    invokeHotkey({combo: '4', code: '4', which: 100});
    invokeHotkey({combo: '5', code: '5', which: 101});
    invokeHotkey({combo: '6', code: '6', which: 102});
    invokeHotkey({combo: '7', code: '7', which: 103});
    invokeHotkey({combo: '8', code: '8', which: 104});
    invokeHotkey({combo: '9', code: '9', which: 105});
    invokeHotkey({combo: '*', code: '*', which: 106});
    invokeHotkey({combo: '+', code: '+', which: 107});
    invokeHotkey({combo: '-', code: '-', which: 109});
    invokeHotkey({combo: '.', code: '.', which: 110});
    invokeHotkey({combo: '/', code: '/', which: 191});
  });
});

