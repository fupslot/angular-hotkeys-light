## angular-hotkeys-light
![Latest build](https://img.shields.io/badge/latest-v1.1.0-brightgreen.svg)
![Latest build](https://travis-ci.org/fupslot/angular-hotkeys-light.svg?branch=master)
![npm](https://img.shields.io/npm/dt/angular-hotkeys-light.svg)]
![Size](https://img.shields.io/badge/size-4.29kb-green.svg)
![GZip](https://img.shields.io/badge/gzip-1.57kb-brightgreen.svg)

Code-centric keyboard shortcuts for your Angular apps.

### Features:
* Flexible hotkey object configuration
* Support for `keydown` and `keyup` events. (`keydown` is the default)
* Define hotkeys in javascript instead of DOM

### Why "angular-hotkeys-light"?
* Small source size
* No other dependencies required
* No HTML markups
* No DOM manipulations

### Getting started

#### Install via npm
```bash
$ npm install angular-hotkeys-light --save
```

#### Install via bower
```bash
$ bower install angular-hotkeys-light --save
```

#### Add module to your app

```js
angular.module('myApp', ['fps.hotkeys']);
```

### Usage

#### Hotkeys.createHotkey(\<object\>): \<hotkey\>;

Creates `hotkey` object based on given `object`

`object`: An object with following parameters:

* `id`: {String} Hotkey's id. If it's not supplied, will be auto-generated. Used internaly.
* `key`: {String} A key or key combination you what to bind a callback to. **required**
* `context`: {Object} This object will be passed to a `callback` as `this` parameter
* `callback`: {Function} This function will be invoked when `key` is pressed. Passes two arguments: an event that triggered `callback` and `args` object **required**
* `args`: {Object} This object will be pass to `callback` as a second argument

#### Note: Do not call `$scope.$apply()` manually within a hotkey callback.

#### Hotkeys.registerHotkey(\<hotkey\>): Array.\<hotkey\>
This method registers the hotkey object in the global table. If the given combination already exist it will append the hotkey to it. In the case when a combination has multiple callbacks they will be invoked in FIFO way.

##### Basic usage

```js
// Create simple hotkey object
var hotkey = Hotkeys.createHotkey({
    key: 'shift+1',
    callback: function () {
      console.log('You pressed shift+1 keys combination');
    }
});

// Register the hotkey object
Hotkeys.registerHotkey(hotkey);
```

##### Using hotkeys within a directive

```js
angular.module('myApp', [])
.directive('myDirective', function() {
  return {
    controllerAs: 'vm',
    controller: function($scope, Hotkeys) {
      var hotkey = Hotkeys.createHotkey({
          key: 'escape',
          callback: function () {
            console.log('You pressed shift+1 keys combination');
          }
      });

      Hotkeys.registerHotkey( hotkey);

      // Very important to unregister the hotkey when `scope` gets destroyed
      $scope.$on('$destroy', function(){
        Hotkeys.deregisterHotkey(hotkey);
      });
    }
  }
});
```

##### Using hotkeys within a service

```js
angular.module('myApp', [])
.service('MyService', function() {
  var srv = this;

  srv.importantMethod = function(){
    // do important things
  };

  // invoke `importantMethod` when `f1` key pressed
  var hotkey = Hotkeys.createHotkey({
      key: 'f1',
      context: srv,
      callback: srv.importantMethod
  });
  Hotkeys.registerHotkey(hotkey);
});
```

Note: Unlike the directive we do not need to worry about deregestering a hotkey here, because a service never gets destroyed.

#### Share a callback between multiple hotkeys

```js
// Create hotkeys with shared callback
var hotkeys = Hotkeys.createHotkey({
    key: ['ctrl+a', 'meta+a'],
    callback: function (event) {
      var key = Hotkeys.keyStringFromEvent(event);
      console.log('You pressed %s key combination', key);
    }
});

// Register hotkeys object
Hotkeys.registerHotkey(hotkeys);
```

Note: Calling `deregisterHotkey` method on `hotkey` object with multiple keys, will correctly deregister a callback for each key.

#### Hotkeys.registerHotkeyUp(\<hotkey\>): : Array.\<hotkey\>

Same as `registerHotkey`, instead a callback binded to `keyup` event.

#### Hotkeys.deregisterHotkey(\<hotkey\>): Array.\<Hotkey\>

Removes specific `hotkey` object from the global hotkey table. Removed  object will be returned within the array, otherwise return null.

#### Hotkeys.keyStringFromEvent(event): \<string\>
Extracts a key string from `keydown` and `keyup` events. Note: Do not use this method within `keypress` event, since it reveals different keyCode values.

```js
document.addEventListener('keydown', function(event) {
  var combo = Hotkeys.keyStringFromEvent(event);
  console.log(combo); // Ex: 'ctrl+c'
});
```

#### Hotkeys.match(event, \<String\|Array\>): \<boolean\>
Checks given shortcut against the event and return `true` when find a match. Helful to use in conjunction with user input elements like: input, textarea, etc.

```js
textarea.addEventListener('keydown', function(event) {
	if (Hotkeys.match(event, 'escape')) {
		event.preventDefault();
		event.target.value = '';
	}

	if (Hotkeys.match(event, ['ctrl+enter', 'meta+enter'])) {
		event.prevetDefault();
		// do something
	}
});
```

### Supported keys
`backspace`, `tab`, `enter`, `shift`, `ctrl`, `alt`, `pause`, `caps`, `escape`, `space`, `pageup`, `pagedown`, `end`, `home`, `left`, `up`, `right`, `down`, `insert`, `delete`

Including functional keys from `f1` to `f12`

### Supported key combinations
* ctrl + \<key\>
* ctrl + alt + \<key\>
* ctrl + alt + shift + \<key\>
* ctrl + alt + shift + meta + \<key\>
* ctrl + shift + \<key\>
* ctrl + shift + meta + \<key\>
* ctrl + meta + \<key\>
* alt + \<key\>
* alt + shift + \<key\>
* alt + shift + meta + \<key\>
* alt + meta + \<key\>
* shift + \<key\>
* shift + meta + \<key\>
* meta + \<key\>
* or single \<key\>

### License

The MIT License

Copyright (c) 2016 Eugene Brodsky

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
