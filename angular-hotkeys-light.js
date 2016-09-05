(function(ng) {
  ng.module('fps.hotkeys', [])
  .service('Hotkeys', ['$Hotkeys', function($Hotkeys) {
    return new $Hotkeys();
  }])
  .provider('$Hotkeys', function () {
    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }

    var isArray = Array.isArray || function isArray(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };

    /**
    * Creates a duplicate-free version of an array, using SameValueZero
    * for equality comparisons, in which only the first occurrence of
    * each element is kept.
    * @param {Array<String>} array The array to inspect
    * @returns {Array<String>}
    */
    var uniq = function (array) {
      var lookup = {};
      var newList = [];
      for (var i = 0; i < array.length; ++i) {
        if (!lookup[array[i]]) {
          newList.push(array[i]);
        }
        lookup[array[i]] = true;
      }
      return newList;
    };

    // Key-code values for various meta-keys.
    // Source : http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
    //          http://unixpapa.com/js/key.html
    // Date: Oct 02, 2015.
    var KEY_CODES = this.KEY_CODES = {
      8: 'backspace',
      9: 'tab',
      13: 'enter',
      16: 'shift',
      17: 'ctrl',
      18: 'alt',
      19: 'pause',
      20: 'caps',
      27: 'escape',
      32: 'space',
      33: 'pageup',
      34: 'pagedown',
      35: 'end',
      36: 'home',
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down',
      45: 'insert',
      46: 'delete',
      // Numpad
      96: '0',
      97: '1',
      98: '2',
      99: '3',
      100: '4',
      101: '5',
      102: '6',
      103: '7',
      104: '8',
      105: '9',
      106: '*',
      107: '+',
      109: '-',
      110: '.',
      111: '/',
      // Function keys
      112: 'f1',
      113: 'f2',
      114: 'f3',
      115: 'f4',
      116: 'f5',
      117: 'f6',
      118: 'f7',
      119: 'f8',
      120: 'f9',
      121: 'f10',
      122: 'f11',
      123: 'f12'
    };

    this.$get = ['$rootScope', '$window', function($rootScope, $window) {

      var wrapWithApply = function (fn) {
        return function(event, args) {
          $rootScope.$apply(function() {
            fn.call(this, event, args);
          }.bind(this));
        };
      };

      var HotKey = function(params) {
        this.id = params.id || guid();
        this.key = params.key;
        this.context = params.context || null;
        this.callback = params.callback;
        this.args = params.args;
        this.onKeyUp = false;
      };

      HotKey.prototype.clone = function() {
        return new HotKey(this);
      };

      var Hotkeys = function() {
        /**
         * Sometimes a UI wants keybindings which are global, so called hotkeys.
         * Keys are keystrings (identify key combinations) and values are objects
         * with keys callback, context.
         */
        this._hotkeys = {};

        /**
         * Sometimes a UI wants keybindings for keyup behaviour.
         */
        this._hotkeysUp = {};

        this._onKeydown = this._onKeydown.bind(this);
        this._onKeyup = this._onKeyup.bind(this);

        this.initialize();
      };

      /**
       * Binds Keydown, Keyup with the window object
       */
      Object.defineProperty(Hotkeys.prototype, 'initialize', {
        value: function initialize() {
          $window.addEventListener('keydown', this._onKeydown, true);
          $window.addEventListener('keyup', this._onKeyup, true);
        }
      });

      /**
       * Invokes callback functions assosiated with the given hotkey
       * @param  {Event} event
       * @param  {String} keyString hotkey
       * @param  {Array.<HotKey>} hotkeys List of registered callbacks for
       *                                  the given hotkey
       * @private
       */
      Object.defineProperty(Hotkeys.prototype, '_invokeHotkeyHandlers', {
        value: function _invokeHotkeyHandlers(event, keyString, hotkeys) {
          for (var i = 0, l = hotkeys.length; i < l; i++) {
            try {
              var hotkey = hotkeys[i];
              hotkey.callback.call(hotkey.context, event, hotkey.args);
            } catch(e) {
              console.error('HotKeys: ', hotkey.key, e.message);
            }
          }
        }
      });

      /**
       * Keydown Event Handler
       * @private
       */
      Object.defineProperty(Hotkeys.prototype, '_onKeydown', {
        value: function _onKeyDown(event) {
          var keyString = this.keyStringFromEvent(event);
          if (this._hotkeys[keyString]) {
            this._invokeHotkeyHandlers(event, keyString, this._hotkeys[keyString]);
          }
        },
        writable: true
      });

      /**
       * Keyup Event Handler
       * @private
       */
      Object.defineProperty(Hotkeys.prototype, '_onKeyup', {
        value: function _onKeyDown(event) {
          var keyString = this.keyStringFromEvent(event);
          if (this._hotkeysUp[keyString]) {
            this._invokeHotkeyHandlers(this._hotkeysUp[keyString], keyString);
          }
        },
        writable: true
      });

      /**
      * Cross-browser method which can extract a key string from an event.
      * Key strings are of the form
      *
      *   ctrl+alt+shift+meta+character
      *
      * where each of the 4 modifiers may or may not appear, but always appear
      * in that order if they do appear.
      *
      * TODO : this is not yet implemented fully. The trouble is, the keyCode,
      * charCode, and which properties of the DOM standard KeyboardEvent are
      * discouraged in favour of the use of key and char, but key and char are
      * not yet implemented in Gecko nor in Blink/Webkit. We need to leverage
      * keyCode/charCode so that current browser versions are supported, but also
      * look to key and char because they're apparently more useful and are the
      * future.
      */
      Object.defineProperty(Hotkeys.prototype, 'keyStringFromEvent', {
        value: function keyStringFromEvent(event) {
          var result = [];
          var key = event.which;

          if (KEY_CODES[key]) {
            key = KEY_CODES[key];
          } else {
            key = String.fromCharCode(key).toLowerCase();
          }

          if (event.ctrlKey) { result.push('ctrl'); }
          if (event.altKey) { result.push('alt'); }
          if (event.shiftKey) { result.push('shift'); }
          if (event.metaKey) { result.push('meta'); }
          result.push(key);
          return uniq(result).join('+');
        }
      });

      /**
      * Unregister a hotkey (shortcut) helper for (keyUp/keyDown).
      *
      * @param {String}   params.key      - valid key string.
      * @param {Function} params.callback - routine to run when key is pressed.
      * @param {Object}   params.context  - @this value in the callback.
      * @param [Boolean]  params.onKeyUp  - if this is intended for a keyup.
      * @param [String]   params.id       - the identifier for this registration.
      */
      Object.defineProperty(Hotkeys.prototype, '_deregisterHotkey', {
        value: function _deregisterHotkey(hotkey) {
          var ret;
          var table = this._hotkeys;

          if (hotkey.onKeyUp) {
            table = this._hotkeysUp;
          }

          if (table[hotkey.key]) {
            var callbackArray = table[hotkey.key];
            for (var i = 0; i < callbackArray.length; ++i) {
              var callbackData = callbackArray[i];
              if ((hotkey.callback === callbackData.callback
                  && callbackData.context === hotkey.context)
                  || (hotkey.id === callbackData.id)) {
                ret = callbackArray.splice(i, 1);
              }
            }
          }
          return ret;
        }
      });

      /**
       * Unregister hotkeys
       * @param  {Hotkey}  hotkey A hotkey object
       * @return {Array}
       */
      Object.defineProperty(Hotkeys.prototype, 'deregisterHotkey', {
        value: function deregisterHotkey(hotkey) {
          var result = [];

          this._validateHotkey(hotkey);

          if (isArray(hotkey.key)) {
            for (var i = hotkey.key.length - 1; i >= 0; i--) {
              var clone = hotkey.clone();
              clone.key = hotkey.key[i];
              var ret = this._deregisterHotkey(clone);
              if (ret !== void 0) {
                result.push(ret[0]);
              }
            }
          } else {
            result.push(this._deregisterHotkey(hotkey));
          }
          return result;
        }
      });

      /**
       * Validate HotKey type
       */
      Object.defineProperty(Hotkeys.prototype, '_validateHotkey', {
        value: function _validateHotkey(hotkey) {
          if (!(hotkey instanceof HotKey)) {
            throw new TypeError('Hotkeys: Expected a hotkey object be instance of HotKey');
          }
        }
      });

      /**
      * Register a hotkey (shortcut) helper for (keyUp/keyDown).
      * @param {Object} params Parameters object
      * @param {String}   params.key      - valid key string.
      * @param {Function} params.callback - routine to run when key is pressed.
      * @param {Object}   params.context  - @this value in the callback.
      * @param [Boolean]  params.onKeyUp  - if this is intended for a keyup.
      * @param [String]   params.id       - the identifier for this registration.
      */
      Object.defineProperty(Hotkeys.prototype, '_registerKey', {
        value: function _registerKey(hotkey) {
          var table = this._hotkeys;

          if (hotkey.onKeyUp) {
            table = this._hotkeysUp;
          }

          table[hotkey.key] = table[hotkey.key] || [];
          table[hotkey.key].push(hotkey);
          return hotkey;
        }
      });

      Object.defineProperty(Hotkeys.prototype, '_registerKeys', {
        value: function _registerKeys(hotkey) {
          var result = [];

          if (isArray(hotkey.key)) {
            for (var i = hotkey.key.length - 1; i >= 0; i--) {
              var clone = hotkey.clone();
              clone.id = guid();
              clone.key = hotkey.key[i];
              result.push(this._registerKey(clone));
            }
          } else {
            result.push(this._registerKey(hotkey));
          }
          return result;
        }
      });

      /**
      * Register a hotkey (shortcut). see _registerHotKey
      */
      Object.defineProperty(Hotkeys.prototype, 'registerHotkey', {
        value: function registerHotkey(hotkey) {
          this._validateHotkey(hotkey);
          return this._registerKeys(hotkey);
        }
      });

      /**
      * Register a hotkey (shortcut) keyup behavior.
      * see _registerHotKey
      */
      Object.defineProperty(Hotkeys.prototype, 'registerHotkeyUp', {
        value: function registerHotkeyUp(hotkey) {
          this._validateHotkey(hotkey);
          hotkey.onKeyUp = true;
          this._registerKeys(hotkey);
        }
      });

      /**
       * Creates new hotkey object.
       * @param  {Object} args
       * @return {HotKey}
       */
      Object.defineProperty(Hotkeys.prototype, 'createHotkey', {
        value: function createHotkey(args) {
          if (args.key === null || args.key === void 0) {
            throw new TypeError('HotKeys: Argument "key" is required');
          }

          if (args.callback === null || args.callback === void 0) {
            throw new TypeError('HotKeys: Argument "callback" is required');
          }

          args.callback = wrapWithApply(args.callback);
          return new HotKey(args);
        }
      });

      /**
       * Checks if given shortcut match the event
       * @param  {Event} event An event
       * @param  {String|Array} key A shortcut
       * @return {Boolean}
       */
      Object.defineProperty(Hotkeys.prototype, 'match', {
        value: function(event, key) {
          if (!isArray(key)) {
            key = [key];
          }

          var eventHotkey = this.keyStringFromEvent(event);
          return Boolean(~key.indexOf(eventHotkey));
        }
      });

      return Hotkeys;
    }];
  });
}(window.angular));
