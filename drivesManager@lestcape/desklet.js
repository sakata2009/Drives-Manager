
// Desklet : Drives Manager         Version      : v1.1-RTM
// O.S.    : Cinnamon               Release Date : 30 October 2013.
// Author  : Lester Carballo Pérez  Email        : lestcape@gmail.com
//
// Website : https://github.com/lestcape/Drives-Manager
//
// This is a desklet to show devices connected to the computer and interact with them.
//
// Skills including:
//
// 1- Show different volumes containing a device, also if is not currently mounted.
// 2- The volumes can be mounted and unmounted with a single click.
// 3- If you have data volumes mounted, you can access the mount point with your favorite
//    browser (Nemo or Nautilus) with a single click or automatically if desired when the
//    volume is mounted.
// 4- The desklet has a wide range of configuration options, allowing you to fit almost all
//    themes desk.
// 5- Through this desklet, you can monitor the temperatures of your hard disks and even
//    activate an alarm when the disc temperature exceeds a value, that you consider unacceptable.
//    To use this option, we required the installation and configuration of hddtemp program,
//    but do not worry, simply activate the option and the desklet will installed and configured,
//    without your intervention.
// 6- You can enable the option to reconnect removable usb device, without the need to remove the
//    device from the connector. Like USB Safely Removed works in Windows.
// 7- You can also monitor the speed of read/write files on your system.
// 8- If you have a CD-ROM disc tray, you can opened/closed it with a single click, even if a
//    disc is present. Unfortunately, this skill requires that you have installed eject and
//    cdrecord programs.
//
//    This program is free software:
//
//    You can redistribute it and/or modify it under the terms of the
//    GNU General Public License as published by the Free Software
//    Foundation, either version 3 of the License, or (at your option)
//    any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

const Gio = imports.gi.Gio;
const St = imports.gi.St;

const Desklet = imports.ui.desklet;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Settings = imports.ui.settings;
const Tweener = imports.ui.tweener;
const CinnamonMountOperation = imports.ui.cinnamonMountOperation;
const Main = imports.ui.main;
const Cinnamon = imports.gi.Cinnamon;
const GUdev = imports.gi.GUdev;
const Signals = imports.signals;

/****Import File****/
//const AppletDir = imports.ui.appletManager.applets['drivesManager@lestcape'];
const DeskletDir = imports.ui.deskletManager.desklets['drivesManager@lestcape'];
//const Translate = DeskletDir.translate;
const SystemClass = DeskletDir.system;
/****Import File****/


function HDDTempMonitor(system) {
    this._init(system);
}

HDDTempMonitor.prototype = {

   _init: function(system) {
      this._system = system;
      this._active = false;
      this._criticalTemp = 45;
      this._warningTemp = 38;
      this._normalTempColor = "green";
      this._warningTempColor = "orange";
      this._criticalTempColor = "red";
      this._activeAlarm = false;
      this.deviceList = new Array();
      this._hddtempProxy = this._system.createHDDTempProxy();
      this._client = new GUdev.Client ({subsystems: ["block"]});
   },

   addDevice: function(device) {
      let deviceUdev = this._client.query_by_device_file(device);
      this.deviceList[device] = [];
      this.deviceList[device]["id"] = device;
      if(deviceUdev)
         this.deviceList[device]["label"] = deviceUdev.get_property("ID_MODEL");
      this.deviceList[device]["temp"] = "?\u00B0C";//\u00B0 = °
   },

   getDeviceTemp: function(device) {
      return this.deviceList[device]["temp"];
   },

   _hDDTempResultProxy: function(info) {
      for(let device in this.deviceList) {
         for(let pos in info) {
            if(this.deviceList[device]["label"] == info[pos]["label"].replace(' ','_')) {
               let newTemp = Math.floor(info[pos]["temp"]) + "\u00B0C";
               if(this.deviceList[device]["temp"] != newTemp) {
                 this.deviceList[device]["temp"] = newTemp;
                 this.emit('temp-changed', device, newTemp);
                 this._playSoundHddTemp(newTemp);
               }
               break;
            }
         }
      }
   },

   setWarningHddTemp: function(warningTemp) {
      this._warningTemp = warningTemp;
      this._emitAll();
   },

   setCriticalHddTemp: function(crititalTemp) {
      this._criticalTemp = crititalTemp;
      this._emitAll();
   },

   setNormalHddTempColor: function(normalColor) {
      this._normalTempColor = normalColor;
      this._emitAll();
   },

   setWarningHddTempColor: function(warningColor) {
      this._warningTempColor = warningColor;
      this._emitAll();
   },

   setCritialHddTempColor: function(criticalColor) {
      this._criticalTempColor = criticalColor;
      this._emitAll();
   },

   activeAlarm: function(alarm) {
      this._activeAlarm = alarm;
      this._emitAll();
   },

   getHddTempColor: function(tempString) {
      let _tempValue = tempString.match(new RegExp('[0-9]+', 'g'));
      if((_tempValue)&&(_tempValue[0])) {
         if(_tempValue[0] >= this._criticalTemp)
            return this._criticalTempColor;
            if(_tempValue[0] >= this._warningTemp)
               return this._warningTempColor; 
      }
      return this._normalTempColor;
   },

   _playSoundHddTemp: function(tempString) {
      if((this._active)&&(this._activeAlarm)) {
         try {
            let _tempValue = tempString.match(new RegExp('[0-9]+', 'g'));
            if((_tempValue)&&(_tempValue[0])&&(_tempValue[0] >= this._criticalTemp))
               global.play_theme_sound(0, 'suspend-error');
         } catch(e) {
            Main.notifyError(_("Failed of Drives Manager:"), e.message);
         }
      }
   },

   enableMonitor: function(active) {
      this._active = active;
      this._emitAll();
   },
 
   _emitAll: function() {
      if(this._active) {
         for(let dev in this.deviceList)
            this.emit('temp-changed', dev, this.deviceList[dev]["temp"]);
      } else {
         for(let dev in this.deviceList)
            this.emit('temp-changed', dev, null);
      }
   },

   update: function() {
      try {
         if(this._active) {
            this._hDDTempResultProxy(this._hddtempProxy.get_temp_info());
         }
      } catch(e) {
         Main.notify(_("Failed of Drives Manager:"), e.message);
      }
   }
};

Signals.addSignalMethods(HDDTempMonitor.prototype);

function GlobalContainer(uuid, system) {
    this._init(uuid, system);
}

GlobalContainer.prototype = {

   _init: function(uuid, system) {
      this._mainBox = new St.Bin({ x_align: St.Align.START, style_class: 'desklet-with-borders', reactive: true, track_hover: true });
      this._mainBox.add_style_class_name('drives-main-box');
      this._rootBox = new St.BoxLayout({ vertical:true });
      this._mainBox.set_child(this._rootBox);

      this._uuid = uuid;
      this._sys = system;
      this._listCategoryContainer = new Array();
      this._listCategoryConnected = new Array();

      this._overrideTheme = false;
      this._topTextSize = 9;
      this._bottomTextSize = 7;
      this._showMainBox = true;
      this._showDriveBox = true;
      this._theme = "mind";
      this._opacity = 50;
      this._boxColor = "rgb(0,0,0)";
      this._borderBoxWidth = 1;
      this._borderBoxColor = "white";
      this._width = 170;
      this._fixWidth = false;
      this._fontColor = "white";
      this.setFontColor(this._fontColor); 
      this._setStyle();
   },

   diplayedMesageID: function() {
      return this._messageID;
   },

   displayMessage: function(message, buttons, btClickedCallBack) {
      if(this.diplayedMesageID() == null) {
         this._fixedActive = this._fixWidth;
         this.fixWidth(false);
         for(let index in this._listCategoryContainer) {
            this._rootBox.remove_actor(this._listCategoryContainer[index].getContainerBox());
         }
         this._btClickedCallBack = btClickedCallBack;
         this._messageContainer = new St.BoxLayout({vertical:true});
 
         let _information = new St.Label();
         _information.style="font-size: " + this._nameSize + "pt";
         _information.set_text(message);
         let _buttonContainer = new St.BoxLayout({vertical:false});

         for(let index in buttons) {
            let _label = "    " + buttons[index] + "    ";
            let _btButton = new St.Button({label: _label});
            _btButton.connect('notify::hover', Lang.bind(this, function(actor) {
               if(actor.get_hover())
                  global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
               else
                  global.unset_cursor();
            }));
            _btButton.set_style('border:1px solid #ffffff; border-radius: 12px;');
            _btButton.connect('clicked', Lang.bind(this, function(btClick) {
               this._btClickedCallBack(btClick.label.substring(4, btClick.label.length - 4));
            }));
            _buttonContainer.add(_btButton, {x_fill: true, x_align: St.Align.END});
         }

         this._messageContainer.add(_information, {x_fill: true, x_align: St.Align.START});
         this._messageContainer.add(_buttonContainer, {x_fill: true, x_align: St.Align.END})

         this._rootBox.insert_actor(this._messageContainer, 0);
         this._messageID = new Date().getTime().toString();
      }
      return this._messageID; 
   },

   removeMessage: function() {
      if(this.diplayedMesageID() != null) {
         this.fixWidth(this._fixedActive);
         this._rootBox.remove_actor(this._messageContainer);
         this._messageContainer = null;
         for(let index in this._listCategoryContainer) {
            if(this._listCategoryConnected[index])
               this.connectCategoryByIndex(index);
         }
      }
      this._messageID = null;
   },

//Child property
   overrideTheme: function(override) {
      this._overrideTheme = override;
      this._setStyle();
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].overrideTheme(override);
   },

   showDriveBox: function(show) {
      this._showDriveBox = show;
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].showDriveBox(show);
   },

   setTheme: function(theme) {
      this._theme = theme;
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].setTheme(theme);
   },

   setBorderBoxWidth: function(width) {
      this._borderBoxWidth = width;
      this._setStyle();
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].setBorderBoxWidth(width);
   },

   setBorderBoxColor: function(color) {
      this._borderBoxColor = color;
      this._setStyle();
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].setBorderBoxColor(color);
   },

   setBoxColor: function(color) {
      this._boxColor = color;
      this._setStyle();
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].setBoxColor(color);
   },

   setTopTextSize: function(size) {
      this._topTextSize = size;
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].setTopTextSize(size);
   },

   setBottomTextSize: function(size) {
      this._bottomTextSize = size;
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].setBottomTextSize(size);
   },

   setOpacity: function(opacity) {
      this._opacity = opacity;
      this._setStyle();
      for(let index in this._listCategoryContainer)
         this._listCategoryContainer[index].setOpacity(opacity);
   },

   applyDriveStyle: function(categoryContainer) {
      categoryContainer.showDriveBox(this._showDriveBox);
      categoryContainer.setTheme(this._theme);
      categoryContainer.setBorderBoxWidth(this._borderBoxWidth);
      categoryContainer.setBorderBoxColor(this._borderBoxColor);
      categoryContainer.setBoxColor(this._boxColor);
      categoryContainer.setTopTextSize(this._topTextSize);
      categoryContainer.setBottomTextSize(this._bottomTextSize);
      categoryContainer.setOpacity(this._opacity);
   },

   addCategoryContainer: function(categoryContainer) {
      categoryContainer.setParentContainer(this);
      this.applyDriveStyle(categoryContainer);
      this._listCategoryContainer.push(categoryContainer);
   },

   insertCategoryContainer: function(categoryContainer, index) {
      let _index = this._listCategoryContainer.indexOf(categoryContainer);
      if(_index == -1) {
         categoryContainer.setParentContainer(this);
         this.applyDriveStyle(categoryContainer);
         this._listCategoryContainer.splice(index, 0, categoryContainer);
      }
   },

   indexOfCategoryContainer: function(categoryContainer) {
      return this._listCategoryContainer.indexOf(categoryContainer);
   },

   countCategoryContainer: function() {
      return this._listCategoryContainer.length;
   },

   removeCategoryContainer: function(categoryContainer) {
      let _index = this._listCategoryContainer.indexOf(categoryContainer);
      removeCategoryContainerByIndex(_index);
   },

   removeCategoryContainerByIndex: function(index) {
      if((index > -1)&&(index < this._listCategoryContainer.length)) {
         this.disconnectCategoryByIndex(index);
         this._listCategoryContainer.splice(index, 1);
         this._listCategoryConnected.splice(index, 1);
      }
   },

   connectCategory: function(categoryContainer) {  
      this.connectCategoryByIndex(this._listCategoryContainer.indexOf(categoryContainer));
   },

   connectCategoryByIndex: function(index) {
      if((index > -1)&&(index < this._listCategoryContainer.length)) {
         let _indexConnect = 0;
         let currCat = 0;
         let catContainer = this._listCategoryContainer[index];
         while(this._listCategoryContainer[currCat] != catContainer) {
            if(currCat >= this._listCategoryContainer.length)
               break;
            if(this._listCategoryConnected[currCat])
               _indexConnect = _indexConnect + 1;
            currCat = currCat + 1;
         }
         this._listCategoryConnected[index] = true;
         let parentContainer = catContainer.getContainerBox().get_parent();
         if(parentContainer)
            parentContainer.remove_actor(catContainer.getContainerBox());
         this._rootBox.insert_actor(catContainer.getContainerBox(), _indexConnect);
         catContainer.overrideTheme(this._overrideTheme);
      }
   },

   disconnectCategory: function(categoryContainer) {  
      this.disconnectCategoryByIndex(this._listCategoryContainer.indexOf(categoryContainer));
   },

   disconnectCategoryByIndex: function(index) {
      if((index > -1)&&(index < this._listCategoryContainer.length)) {
         this._listCategoryConnected[index] = false;
         let containerBox = this._listCategoryContainer[index].getContainerBox();
         let parentContainerBox = containerBox.get_parent();
         if(parentContainerBox)
            parentContainerBox.remove_actor(containerBox);
      }
   },

   isCategoryConnect: function(categoryContainer) {
      return this.isCategoryConnectByIndex(this._listCategoryContainer.indexOf(categoryContainer));
   },

   isCategoryConnectByIndex: function(index) {
      return this._listCategoryConnected[index];
   },

   update: function() {
      for(let index in this._listCategoryContainer) {
         if(this._listCategoryConnected[index])
            this._listCategoryContainer[index].update();
      }
   },
//Child property
   getContentBox: function() {
      return this._mainBox;
   },

   getRootBox: function() {
      return this._rootBox;
   },

   setWidth: function(width) {
      this._width = width;
      if(this._fixWidth)
         this._rootBox.set_width(this._width);
   },

   fixWidth: function(fix) {
      this._fixWidth = fix;
      if(this._fixWidth)
         this._rootBox.set_width(this._width);
      else
         this._rootBox.set_width(-1);
   },

   setFontColor: function(color) {
      this._fontColor = color;
      this._rootBox.set_style('color:' + this._fontColor + '; text-shadow: 1px 1px 2px #000;');
   },

   showMainBox: function(show) {
      this._showMainBox = show;
      this._setStyle();
   },

   _setStyle: function() {
      if(this._showMainBox) {
         let newStyle = '';
         let remplaceColor;
         if(this._overrideTheme) {
            this._mainBox.set_style_class_name(' ');
            let remplaceColor = this._textRGBToRGBA(this._boxColor, this._opacity);
            newStyle = 'padding: 4px; border:'+this._borderBoxWidth +
                       'px solid ' + this._borderBoxColor + '; background-color: ' +
                       remplaceColor + '; border-radius: 12px;';
            this._mainBox.set_style(newStyle);
         } else {
            if(this._mainBox.style_class != 'desklet-with-borders') {
               this._mainBox.set_style(' ');
               this._mainBox.set_style_class_name('desklet-with-borders');
               this._mainBox.add_style_class_name('drives-main-box');
            }
            if((this._mainBox.visible)&&(this._mainBox.get_parent())) {
               let themeNode = this._mainBox.get_theme_node();
               let [have_color, box_color] = themeNode.lookup_color('background-color', false);
               if(have_color) {
                  remplaceColor = this._updateOpacityColor(box_color.to_string(), this._opacity);
                  newStyle += 'background-color: ' + remplaceColor + ';';
               }
               let [have_color_start, box_color_start] = themeNode.lookup_color('background-gradient-start', false);
               if(have_color_start) {
                  remplaceColor = this._updateOpacityColor(box_color_start.to_string(), this._opacity);
                  newStyle += ' background-gradient-start: ' + remplaceColor + ';';
               }
               let [have_color_end, box_color_end] = themeNode.lookup_color('background-gradient-end', false);
               if(have_color_end) {
                  remplaceColor = this._updateOpacityColor(box_color_end.to_string(), this._opacity);
                  newStyle += ' background-gradient-end: ' + remplaceColor + ';';
               }
               if(newStyle != this._mainBox.get_style()) {
                  this._mainBox.set_style(newStyle);
               }
            }
         }
      } else {
         this._mainBox.set_style(' ');
         this._mainBox.set_style_class_name(' ');
      }
      return true;
   },

   _updateOpacityColor: function(color, opacity) {
      if((!opacity)||(opacity == 0))
         opacity = "0.01";
      let r = parseInt(color.substring(1,3),16);
      let g = parseInt(color.substring(3,5),16);
      let b = parseInt(color.substring(5,7),16);
      return "rgba("+r+","+g+","+b+","+opacity+")";
   },

   _textRGBToRGBA: function(textRGB, opacity) {
      if((!opacity)||(opacity == 0))
         opacity = "0.0";
      return (textRGB.replace(')',',' + opacity + ')')).replace('rgb','rgba');
   }
};

function CategoryContainer(parent) {
    this._init(parent);
}

CategoryContainer.prototype = {

   _init: function(parent) {
      this._parent = parent;
      this._categoryBox = new St.BoxLayout({vertical:true});
      this._listDriveContainer = new Array();
      this._overrideTheme = "false";
      this._theme = "mind";
      this._showDriveBox = true;
      this._borderBoxWidth = 1;
      this._borderBoxColor  = "white";
      this._boxColor = "rgb(0,0,0)";
      this._topTextSize = 9;
      this._bottomTextSize = 7;
      this._opacity = 50;
   },

   setParentContainer: function(parent) {
      this._parent = parent;
   },

   getContainerBox: function() {
      return this._categoryBox;
   },

   getUUID: function() {
      return this._parent._uuid;
   },

//Child property
   addDriveContainer: function() {
      let _driveContainer = new DriveContainer(this);
      this.applyDriveStyle(_driveContainer);
      this._listDriveContainer.push(_driveContainer);
      this._categoryBox.add(_driveContainer.getDriveBox(), {x_fill: true, y_fill: false, expand: true, x_align: St.Align.START});
      return _driveContainer;
   },

   countDriveContainer: function() {
      return this._listDriveContainer.length;
   },

   getDriveContainer: function(index) {
      return this._listDriveContainer[index];
   },

   removeDriver: function(index) {
      if((index > -1)&&(index < this._listDriveContainer.length)) {
         this._listDriveContainer[index].setParent(null);
         this._categoryBox.remove_actor(this._listDriveContainer[index].getDriveBox());
         this._listDriveContainer.splice(index, 1);
      }
   },

   indexOfDriverButton: function(button) {
      for(let _index in this._listDriveContainer)
         if(this._listDriveContainer[_index].getDriveButton() == button)
            return _index;
      return -1;
   },

   indexOfEjectButton: function(button) {
      for(let _index in this._listDriveContainer)
         if(this._listDriveContainer[_index].getEjectButton() == button)
            return _index;
      return -1;
   },

   overrideTheme: function(override) {
      this._overrideTheme = override;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].overrideTheme(override);
   },

   setTheme: function(theme) {
      this._theme = theme;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].setTheme(theme);
   },

   showDriveBox: function(show) {
      this._showDriveBox = show;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].showDriveBox(show);
   },

   setBorderBoxWidth: function(width) {
      this._borderBoxWidth = width;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].setBorderBoxWidth(width);
   },

   setBorderBoxColor: function(color) {
      this._borderBoxColor = color;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].setBorderBoxColor(color);
   },

   setBoxColor: function(color) {
      this._boxColor = color;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].setBoxColor(color);
   },

   setTopTextSize: function(size) {
      this._topTextSize = size;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].setTopTextSize(size);
   },

   setBottomTextSize: function(size) {
      this._bottomTextSize = size;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].setBottomTextSize(size);
   },

   setOpacity: function(opacity) {
      this._opacity = opacity;
      for(let index in this._listDriveContainer)
         this._listDriveContainer[index].setOpacity(opacity);
   },

   applyDriveStyle: function(driveContainer) {
      driveContainer.overrideTheme(this._overrideTheme);
      driveContainer.setTheme(this._theme);
      driveContainer.showDriveBox(this._showDriveBox);
      driveContainer.setBorderBoxWidth(this._borderBoxWidth);
      driveContainer.setBorderBoxColor(this._borderBoxColor);
      driveContainer.setBoxColor(this._boxColor);
      driveContainer.setTopTextSize(this._topTextSize);
      driveContainer.setBottomTextSize(this._bottomTextSize);
      driveContainer.setOpacity(this._opacity);
   },
//Child property
   update: function() {
   },

   convertToString: function(size) {
      let converted_string;
      let suffix = "BT";
      let index = 0;
      let prefixNumber = size;
      while (prefixNumber > 999)
      {
         prefixNumber /= 1000;
         index++;
      }
      switch(index) {
         case 1: suffix = "KB" ;break;
         case 2: suffix = "MB" ;break;
         case 3: suffix = "GB" ;break;
         case 4: suffix = "TB" ;break;
         default:suffix = "BT" ;break;
      }
      let _result = prefixNumber.toFixed(2).toString();
      if(_result.length > 5)
         _result = _result.substring(0, 5);
      while(_result.length < 5)
         _result = _result + "0";
      return "" + _result + "" + suffix;
   }
};

function DriveContainer(parent) {
    this._init(parent);
}

DriveContainer.prototype = {

   _init: function(parent) {
      this._parent = parent;
      this._overrideTheme = false;
      this._showDriveBox = true;
      this._boxColor = "rgb(0,0,0)";
      this._opacity = 50;
      this._borderBoxWidth = 1;
      this._borderBoxColor = "white";
      this._fontFamily = ""; //Default Font family
      this._textTopSize = 9;
      this._textBottomSize = 7;
      this._clickedEject = false;

      this._driveBox = new St.BoxLayout({ vertical:false, style_class: 'menu-favorites-box', reactive: true, track_hover: true });
      this._driveBox.add_style_class_name('drives-drive-box');
      this._iconContainer = new St.BoxLayout({ vertical:true, style_class: 'drives-icon-button-box'});
          
      this._topTextContainer = new St.BoxLayout({ vertical: false, style_class: 'drives-top-text-drive-box' });
      this._leftTopText = new St.Label({ style_class: 'menu-selected-app-title' });
      this._rightTopText = new St.Label({ style_class: 'menu-selected-app-title' });
      this._leftTopText.add_style_class_name('drives-left-top-text');
      this._rightTopText.add_style_class_name('drives-right-top-text');
      this._topTextContainer.add(this._leftTopText, {x_fill: true, expand: true, x_align: St.Align.START});
      this._topTextContainer.add(this._rightTopText, {x_fill: true, x_align: St.Align.END});

      this._bottomTextContainer = new St.BoxLayout({ vertical: false, style_class: 'drives-bottom-text-drive-box' });
      this._leftBottomText = new St.Label({ style_class: 'menu-selected-app-description' });
      this._rightBottomText = new St.Label({ style_class: 'menu-selected-app-description' });
      this._leftBottomText.add_style_class_name('drives-left-bottom-text');
      this._rightBottomText.add_style_class_name('drives-right-bottom-text');
      this._bottomTextContainer.add(this._leftBottomText, {x_fill: true, expand: true, x_align: St.Align.START});
      this._bottomTextContainer.add(this._rightBottomText, {x_fill: true, x_align: St.Align.END});

      this.percentContainer = new St.BoxLayout({ vertical:true, style_class: 'drives-percent-meter-box' });

      this._ejectContainer = new St.BoxLayout({vertical:true, style_class: 'drives-eject-button-box' });
      //this._ejectContainer.set_style('padding: 8px 0px 0px 4px;');

      this._infoContainer = new St.BoxLayout({ vertical: true, style_class: 'drives-info-drive-box' });
      this._infoContainer.add(this._topTextContainer, {x_fill: true, expand: true, x_align: St.Align.START});
      this._infoContainer.add(this.percentContainer, {x_fill: true, expand: true, x_align: St.Align.START});
      this._infoContainer.add(this._bottomTextContainer, {x_fill: true, expand: true, x_align: St.Align.START});

      this._driveBox.add(this._iconContainer, {x_fill: true, x_align: St.Align.START});
      this._driveBox.add(this._infoContainer, {x_fill: true, expand: true, x_align: St.Align.START});
      this._driveBox.add(this._ejectContainer, { x_fill: true, x_align: St.Align.START });
      this._setStyleDrive();
      this._currentMeterImage = new Array();
      this._currentIndexMeterImage = new Array();
   },

   enableClickedEject: function() {
      this._clickedEject = false;
   },

   getDriveBox: function() {
      return this._driveBox;
   },

   setParent: function(parent) {
      this._parent = parent;
   },

   overrideTheme: function(override) {
      this._overrideTheme = override;
      this._setStyleDrive();
   },

   showDriveBox: function(show) {
      this._showDriveBox = show;
      this._setStyleDrive();
   },

   setBoxColor: function(color) {
      this._boxColor = color;
      this._setStyleDrive();
   },

   setOpacity: function(opacity) {
      this._opacity = opacity;
      this._setStyleDrive();
   },

   setBorderBoxWidth: function(width) {
      this._borderBoxWidth = width;
      this._setStyleDrive();
   },

   setBorderBoxColor: function(color) {
      this._borderBoxColor = color;
      this._setStyleDrive();
   },
 
   addMeter: function() {
      this._currentMeterImage.push(null);
      this._currentIndexMeterImage.push(-1);
      this.setMeterImage(this._currentMeterImage.length-1, 0, 0);
   },

   removeMeterImage: function(index) {
      if((index > -1)&&(index < this._currentMeterImage.length)) {
         this.percentContainer.remove_actor(this._currentMeterImage[index]);
         this._currentMeterImage.splice(index, 1);
      }
   },

   setMeterImage: function(index, currValue, totalValue) {
      if((index > -1)&&(index < this._currentMeterImage.length)) {
         let _indexImage = this._findIndexMeterImage(currValue, totalValue);
         if(this._currentIndexMeterImage[index] != _indexImage) {
            let _preloadImage = this._getMeterImage(_indexImage);
            if(this._currentMeterImage[index])
               this.percentContainer.remove_actor(this._currentMeterImage[index]);
            this._currentMeterImage[index] = _preloadImage;
            this.percentContainer.add(this._currentMeterImage[index], {x_fill: true, x_align: St.Align.MIDDLE});
         }
      }
   },

   setDriveIcon: function(themeName, iconName, callBackClicked) {
      this._callDriveClicked = callBackClicked;
      this._iconDriveName = iconName;
      if(this._driveButton)
         this._iconContainer.remove_actor(this._driveButton);
      let _driveIcon = this._getIconImage(this._path() + "theme/" + themeName + "/" + iconName);
      this._driveButton = new St.Button({ child: _driveIcon });
      this._iconContainer.add_actor(this._driveButton, {x_fill: true, x_align: St.Align.START});
      if(this._callDriveClicked) {
         this._driveButton.connect('clicked', Lang.bind(this, this._onDriveIconClicked));
         this._driveButton.connect('notify::hover', Lang.bind(this, this._onHover));
      }
   },

   setEjectIcon: function(themeName, iconName, callBackClicked) {
      this._callEjectClicked = callBackClicked; 
      this._iconEjectName = iconName;
      if(this._ejectButton)
         this._ejectContainer.remove_actor(this._ejectButton);
      let _ejectIcon;
      if(iconName == "empty")
         _ejectIcon = this._getIconImage(this._path() + "theme/" + iconName);
      else
         _ejectIcon = this._getIconImage(this._path() + "theme/" + themeName + "/" + iconName);
      this._ejectButton = new St.Button({ child: _ejectIcon });
      this._ejectContainer.add_actor(this._ejectButton);
      if(this._callEjectClicked) {
         this._ejectButton.connect('clicked', Lang.bind(this, this._onEjectIconClicked));
         this._ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
      }
   },

   getEjectButton: function() {
      return this._ejectButton;
   },

   getDriveButton: function() {
      return this._driveButton;
   },

   getEjectName: function() {
      return this._iconEjectName;
   },

   setTheme: function(theme) {
      this.setDriveIcon(theme, this._iconDriveName, this._callDriveClicked);
      this.setEjectIcon(theme, this._iconEjectName, this._callEjectClicked);
   },  

   setFontFamily: function(fontFamily) {
      this._fontFamily = fontFamily;
      
   },

   setTopTextSize: function(size) {
      this._textTopSize = size;
      this._setStyleText();
   },

   setBottomTextSize: function(size) {
      this._textBottomSize = size;
      this._setStyleText();
   },

   setLeftTopText: function(text) {
      this._leftTopFontColor = null;
      this._leftTopText.set_text(text);
   },

   setRightTopText: function(text) {
      this._rightTopFontColor = null;
      this._rightTopText.set_text(text);
   },

   setLeftBottomText: function(text) {
      this._leftBottomFontColor = null;
      this._leftBottomText.set_text(text);
   },

   setRightBottomText: function(text) {
      this._rightBottomFontColor = null;
      this._rightBottomText.set_text(text);
   },

   setLeftTopTextColor: function(text, color) {
      this.setLeftTopText(text);
      this._leftTopFontColor = color;
      this._setStyleText();
   },

   setRightTopTextColor: function(text, color) {
      this.setRightTopText(text);
      this._rightTopFontColor = color;
      this._setStyleText();
   },

   setLeftBottomTextColor: function(text, color) {
      this.setLeftBottomText(text);
      this._leftBottomFontColor = color;
      this._setStyleText();
   },

   setRightBottomTextColor: function(text, color) {
      this.setRightBottomText(text);
      this._rightBottomFontColor = color;
      this._setStyleText();
   },

   _setStyleDrive: function() {
      if(this._showDriveBox) {
         let newStyle = '';
         let remplaceColor;
         if(this._overrideTheme) {
            this._infoContainer.set_style_class_name(' ');
            this.percentContainer.set_style_class_name(' ');
            this._iconContainer.set_style_class_name(' ');
            this._ejectContainer.set_style_class_name(' ');
            this._ejectContainer.style = 'padding: 8px 0px 0px 4px;';
            this._topTextContainer.set_style_class_name(' ');
            this._topTextContainer.style = 'spacing: 4px;';
            this._bottomTextContainer.set_style_class_name(' ');
            this._bottomTextContainer.style = 'spacing: 4px;';

            this._driveBox.set_style_class_name(' ');
            let remplaceColor = this._textRGBToRGBA(this._boxColor, this._opacity);
            newStyle = 'padding: 0px 6px 0px 0px; border:' + this._borderBoxWidth + 'px solid ' +
                       this._borderBoxColor +'; background-color: ' + remplaceColor + '; border-radius: 12px;';
            this._driveBox.set_style(newStyle);
         } else {
            this._infoContainer.set_style_class_name('drives-info-drive-box');
            this.percentContainer.set_style_class_name('drives-percent-meter-box');
            this._iconContainer.set_style_class_name('drives-icon-button-box');
            this._ejectContainer.set_style_class_name('drives-eject-button-box');
            this._ejectContainer.style = ' ';
            this._topTextContainer.set_style_class_name('drives-top-text-drive-box');
            this._topTextContainer.style = ' ';
            this._bottomTextContainer.set_style_class_name('drives-bottom-text-drive-box');
            this._bottomTextContainer.style = ' ';
            if(this._driveBox.style_class != 'menu-favorites-box') {
               this._driveBox.set_style(' ');
               this._driveBox.set_style_class_name('menu-favorites-box');
               this._driveBox.add_style_class_name('drives-drive-box');
            }
            if((this._driveBox.get_parent())&&(this._driveBox.get_parent().get_parent())) {
               let themeNode = this._driveBox.get_theme_node();
               let [have_color, box_color] = themeNode.lookup_color('background-color', false);
               if(have_color) {
                  remplaceColor = this._updateOpacityColor(box_color.to_string(), this._opacity);
                  newStyle += 'background-color: ' + remplaceColor + ';';
               }
               let [have_color_start, box_color_start] = themeNode.lookup_color('background-gradient-start', false);
               if(have_color_start) {
                  remplaceColor = this._updateOpacityColor(box_color_start.to_string(), this._opacity);
                  newStyle += ' background-gradient-start: ' + remplaceColor + ';';
               }
               let [have_color_end, box_color_end] = themeNode.lookup_color('background-gradient-end', false);
               if(have_color_end) {
                  remplaceColor = this._updateOpacityColor(box_color_end.to_string(), this._opacity);
                  newStyle += ' background-gradient-end: ' + remplaceColor + ';';
               }
               if(newStyle != this._driveBox.get_style()) {
                  this._driveBox.set_style(newStyle);
               }
            }
         }
      } else {
         this._driveBox.set_style_class_name(' ');
         this._driveBox.set_style(' ');
      }
      return true;
   },

   _updateOpacityColor: function(color, opacity) {
      if((!opacity)||(opacity == 0))
         opacity = "0.01";
      let r = parseInt(color.substring(1,3),16);
      let g = parseInt(color.substring(3,5),16);
      let b = parseInt(color.substring(5,7),16);
      return "rgba("+r+","+g+","+b+","+opacity+")";
   },

   _textRGBToRGBA: function(textRGB, opacity) {
      if((!opacity)||(opacity == 0))
         opacity = "0.0";
      return (textRGB.replace(')',',' + opacity + ')')).replace('rgb','rgba');
   },

   _setStyleText: function() {
      if(this._overrideTheme) {
         this._leftTopText.set_style_class_name(' ');
         this._rightTopText.set_style_class_name(' ');
         this._leftBottomText.set_style_class_name(' ');
         this._rightBottomText.set_style_class_name(' ');
         if(this._leftTopFontColor)
            this._leftTopText.style="font-size: " + this._textTopSize + "pt; color:" + this._leftTopFontColor + " " + this._fontFamily;
         else
            this._leftTopText.style="font-size: " + this._textTopSize + "pt; " + this._fontFamily;
         if(this._rightTopFontColor)
            this._rightTopText.style="font-size: " + this._textTopSize + "pt; color:" + this._rightTopFontColor + " " + this._fontFamily;
         else
            this._rightTopText.style="font-size: " + this._textTopSize + "pt; " + this._fontFamily;

         if(this._leftBottomFontColor)
            this._leftBottomText.style="font-size: " + this._textBottomSize + "pt; color:" + this._leftBottomFontColor + " " + this._fontFamily;
         else
            this._leftBottomText.style="font-size: " + this._textBottomSize + "pt; " + this._fontFamily;
         if(this._rightBottomFontColor)
            this._rightBottomText.style="font-size: " + this._textBottomSize + "pt; color:" + this._rightBottomFontColor + " " + this._fontFamily;
         else
            this._rightBottomText.style="font-size: " + this._textBottomSize + "pt; " + this._fontFamily;
      } else {
         this._leftTopText.set_style(' ');
         this._rightTopText.set_style(' ');
         this._leftBottomText.set_style(' ');
         this._rightBottomText.set_style(' ');
         if(this._rightBottomFontColor)
            this._rightBottomText.style="color:" + this._rightBottomFontColor;
         this._leftTopText.set_style_class_name('menu-selected-app-title');
         this._rightTopText.set_style_class_name('menu-selected-app-title');
         this._leftBottomText.set_style_class_name('menu-selected-app-description');
         this._rightBottomText.set_style_class_name('menu-selected-app-description');
         this._leftTopText.add_style_class_name('drives-left-top-text');
         this._rightTopText.add_style_class_name('drives-right-top-text');
         this._leftBottomText.add_style_class_name('drives-left-bottom-text');
         this._rightBottomText.add_style_class_name('drives-right-bottom-text');
      }
   },

   _path: function() {
      //this._parent._parent._uuid
      return GLib.get_home_dir()+ "/.local/share/cinnamon/desklets/" + this._parent.getUUID() + "/";//+ this.uuid + "/";
   },

   _findIndexMeterImage: function(currValue, totalValue) {
      let _imageNumber = 1;
      if(totalValue > 0)
        _imageNumber = (currValue/totalValue)*10 + 1;
      _imageNumber = Math.floor(Math.round(_imageNumber));
      if(_imageNumber < 1) _imageNumber = 1;
      if(_imageNumber > 11) _imageNumber = 11;
      return _imageNumber;
   },

   _getMeterImage: function(imageNumber) {
      return this._getIconImage(this._path() + "meter/meter" + imageNumber);
   },

   _getIconImage: function(pathC) {
      try {
         let file = Gio.file_new_for_path(pathC + ".png");
         if(!file.query_exists(null))
            file = Gio.file_new_for_path(pathC + ".svg");
         let icon_uri = file.get_uri();
         //return St.TextureCache.get_default().load_uri_sync(1, icon_uri, 1064, 1064);
         return St.TextureCache.get_default().load_uri_async(icon_uri, 1064, 1064);
      }catch(e) {
         //this._reportFailure(e);
      }
      return null;      
   },

   _animateIcon: function(animeIcon, step) {
      if (step>=3) return;
      Tweener.addTween(animeIcon,
      {  width: 40,
         height: 40,
         time: 0.1,
         transition: 'easeOutQuad',
         onComplete: function() {
            Tweener.addTween(animeIcon,
            {  width: 48,
               height: 48,
               time: 0.2,
               transition: 'easeOutQuad',
               onComplete: function() {
                  this._animateIcon(animeIcon, step+1);
               },
               onCompleteScope: this
            });
         },
         onCompleteScope: this
      });
   },

   _effectIcon: function(effectIcon, time) {
      Tweener.addTween(effectIcon,
      {  opacity: 0,
         time: time,
         transition: 'easeInSine',
         onComplete: Lang.bind(this, function() {
            Tweener.addTween(effectIcon,
            {  opacity: 255,
               time: time,
               transition: 'easeInSine'
            });
         })
      });
   },

   _onDriveIconClicked: function(button) {
      if(this._callDriveClicked) {
         this._animateIcon(button, 0);
         this._callDriveClicked(button);
      }
   },

   _onEjectIconClicked: function(button) {
      if((!this._clickedEject)&&(this._callEjectClicked)) {
         this._clickedEject = true;
         this._effectIcon(button, 0.2);
         this._callEjectClicked(button);
      }
      //this._clickedEject = false;
   },

   _onHover: function (actor) {
      if(actor.get_hover())
         global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
      else
         global.unset_cursor();
      //global.set_cursor(Cinnamon.Cursor.DND_IN_DRAG);
   }
};

function SpeedDiskContainer(parent) {
    this._init(parent);
}

SpeedDiskContainer.prototype = {

   __proto__: CategoryContainer.prototype,

   _init: function(parent) {
      CategoryContainer.prototype._init.call(this, parent);
      this._dr = this.addDriveContainer();
      this._dr.setDriveIcon(this._theme, "meter", null);
      this._dr.setEjectIcon(this._theme, "empty", null);
      this._dr.setFontFamily("font-family:Monospace");
      this._dr.setTopTextSize(9);
      this._dr.addMeter();
      this._dr.addMeter();
      this._meterTimeDelay = 2;
      this.update();
   },

   setTopTextSize: function(size) {
      this._dr.setTopTextSize(size);
      this._dr.setBottomTextSize(size);
   },

   setBottomTextSize: function(size) {
      
   },

   setMeterTimeDelay: function(meterTimeDelay) {
      this._meterTimeDelay = meterTimeDelay;
   },

   update: function() {
      this._updateDiskData();

      this._dr.setLeftTopText("" + this.convertToString(this.diskReadSpeed) + "/s");
      this._dr.setRightTopText(" " + this.convertToString(this.diskReadMaxSpeed) + "/s");
      this._dr.setLeftBottomText("" + this.convertToString(this.diskWriteSpeed) + "/s");
      this._dr.setRightBottomText(" " + this.convertToString(this.diskWriteMaxSpeed) + "/s");
      this._dr.setMeterImage(0, this.diskReadSpeed, this.diskReadMaxSpeed);
      this._dr.setMeterImage(1, this.diskWriteSpeed, this.diskWriteMaxSpeed);
   },

   _updateDiskData: function() {
      let _linesDiskstats = this._parent._sys.readFile("/proc/diskstats").split("\n");
      let _diskReadTotal = 0;
      let _diskWriteTotal = 0;
      let _diskIdle = new Date().getTime()/1000 + this._meterTimeDelay;

      for(let i = 0; i < _linesDiskstats.length; i++)
      {
         let _values;

         if (_linesDiskstats[i].match(/^\s*\d+\s*\d+\s[a-z]+\s/))
         {
            let _values = _linesDiskstats[i].match(/^\s*\d+\s*\d+\s[a-z]+\s(.*)$/)[1].split(" ");
            _diskReadTotal += parseInt(_values[2]);
            _diskWriteTotal += parseInt(_values[6]);
         }
      }
         
      if((this.diskReadTotalOld == null && this.diskWriteTotalOld == null &&
           this.diskIdleOld == null) || (this.diskIdleOld == _diskIdle))
      {
         this.diskReadTotalOld = _diskReadTotal;
         this.diskWriteTotalOld = _diskWriteTotal;
         this.diskIdleOld = _diskIdle - this._meterTimeDelay - 1;
         this.diskReadMaxSpeed = 0;
         this.diskWriteMaxSpeed = 0;
      }

      if(_diskIdle - this.diskIdleOld > this._meterTimeDelay) {
         this.diskReadSpeed = 500*(_diskReadTotal - this.diskReadTotalOld)/(_diskIdle - this.diskIdleOld);
         this.diskWriteSpeed = 500*(_diskWriteTotal - this.diskWriteTotalOld)/(_diskIdle - this.diskIdleOld);

         //this.diskReadSpeed = Math.round((_diskReadTotal - this.diskReadTotalOld)/(_diskIdle - this.diskIdleOld)/2/1024);
         //this.diskWriteSpeed = Math.round((_diskWriteTotal - this.diskWriteTotalOld)/(_diskIdle - this.diskIdleOld)/2/1024);

         this.diskReadTotalOld = _diskReadTotal;
         this.diskWriteTotalOld = _diskWriteTotal;
         this.diskIdleOld = _diskIdle;
         if(this.diskReadSpeed > this.diskReadMaxSpeed)
            this.diskReadMaxSpeed = this.diskReadSpeed;
         if(this.diskWriteSpeed > this.diskWriteMaxSpeed)
            this.diskWriteMaxSpeed = this.diskWriteSpeed;
      }
   }
};

function HardDiskContainer(parent, hddTempMonitor) {
    this._init(parent, hddTempMonitor);
}

HardDiskContainer.prototype = {

   __proto__: CategoryContainer.prototype,

   _init: function(parent, hddTempMonitor) {
      CategoryContainer.prototype._init.call(this, parent);
      this._hddTempMonitor = hddTempMonitor;
      this.mountsHard = new Array();
      this._browser = "nemo";
      this._capacityDetect = true;
      this.idConnect = this._hddTempMonitor.connect('temp-changed', Lang.bind(this, this._onHDDTempChange));
      this.update();
   },

   createDrivers: function() {
      while(this._listDriveContainer.length > 0)
         this.removeDriver(0);
      let _dr;
      for(let _pos in this.mountsHard) {
          _dr = this.addDriveContainer();
          _dr.setDriveIcon(this._theme, "disk", Lang.bind(this, this._onDriveClicked));
          _dr.setEjectIcon(this._theme, "empty", null);
          _dr.addMeter();
          _dr.setLeftTopText(this.mountsHard[_pos][1] + " ");
          _dr.setRightTopText(this.mountsHard[_pos][0]);
          this._hddTempMonitor.addDevice(this.mountsHard[_pos][0]);
      }
   },

   setCapacityDetect: function(capacityDetect) {
      this._capacityDetect = capacityDetect;
   },

   update: function() {
      if(this._capacityDetect)
      {
         let _currMountsHard = this._readMtabFile();
         if(this._checkChange(_currMountsHard)) {
            this.mountsHard = _currMountsHard;
            this.createDrivers();
         }
         //Real Update.
         let _sizeStatus;
         let _capacityStatus;
         for(let _pos in this.mountsHard) {
             _sizeStatus = this._getDriveSize(this.mountsHard[_pos][1]);
             _capacityStatus = this._getDriveUsedSpace(this.mountsHard[_pos][1]);
             this._listDriveContainer[_pos].setLeftBottomText(this.convertToString(_capacityStatus) + "/" + this.convertToString(_sizeStatus));
             this._listDriveContainer[_pos].setMeterImage(0, _capacityStatus, _sizeStatus);
         }
      }
   },

   destroy: function() {
      if(this.idConnect)
         this._hddTempMonitor.disconnect(this.idConnect);
      this.idConnect = null;
   },

   _onHDDTempChange: function(sender, device, value) {
      let _color;  
      for(let dev in this.mountsHard) {
         if(this.mountsHard[dev][0] == device) {
            if(value) {
               _color = this._hddTempMonitor.getHddTempColor(value);
               this._listDriveContainer[dev].setRightBottomTextColor(value, _color);
            }
            else
               this._listDriveContainer[dev].setRightBottomTextColor("");
         }
      }
   },

   _onDriveClicked: function(button) {
      this.openMountDrive(this.indexOfDriverButton(button));
   },

   indexOfDriverButton: function(button) {
      for(let _index in this._listDriveContainer)
         if(this._listDriveContainer[_index].getDriveButton() == button)
            return _index;
      return -1;
   },

   openMountDrive: function(_index) {
      if((_index > -1)&&(_index < this.mountsHard.length)) {
         if(GLib.find_program_in_path(this._browser)) { 
            Util.spawnCommandLine(this._browser + " '" + this.mountsHard[_index][1] + "'");
         } else {
            Main.notifyError(_("Failed of Drives Manager:") + " " + _("Can't find the default browser."));
         }
      }
   },

   setDefaultBrowser: function(browser) {
      this._browser = browser;
   },

   _checkChange: function(currMountsHard) {
      if(this.mountsHard.length != currMountsHard.length)
         return true;
      for(let p in this.mountsHard) {
         if(this.mountsHard[p][0] != currMountsHard[p][0])
            return true;
      }
      return false;
   },

   _readMtabFile: function() {
      let _mountsHard = [];
      try {
          let _linesMtab = this._parent._sys.readFile("/etc/mtab").split("\n");
          let _tokens;

          for(let i = 0; i < _linesMtab.length; i++)
          {
              _tokens = _linesMtab[i].split(" ");
              if((_tokens[0].indexOf("/dev/") != -1) && (_tokens[1].indexOf("/media/") == -1))
              {
                  let _mount = [];
                  _mount.push(_tokens[0]);
                  _mount.push(_tokens[1]);
                  _mountsHard.push(_mount);
              }
          }
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
      return _mountsHard;
   },
         

   _getDriveUsedSpace: function(partitionPath) {
      let _attribute = "filesystem::used";
      try {
         let _file = Gio.file_new_for_path(partitionPath);
         return _file.query_filesystem_info(_attribute, null).get_attribute_uint64(_attribute);
      } catch(e) {
      }
      return 0;
   },

   _getDriveSize: function(partitionPath) {
      let _attribute = "filesystem::size";
      try {
         let _file = Gio.file_new_for_path(partitionPath);
         return _file.query_filesystem_info(_attribute, null).get_attribute_uint64(_attribute);
      } catch(e) {
      }
      return 0;
   }
};

function DeviceContainer(parent, deviceType) {
    this._init(parent, deviceType);
}

DeviceContainer.prototype = {

   __proto__: CategoryContainer.prototype,

   _init: function(parent, deviceType) {
      CategoryContainer.prototype._init.call(this, parent);
      this._deviceType = deviceType;
      this._listDevices = new Array();
      this._capacityDetect = true;
      this._unEjecting = false;
      this._browser = "nemo";
      this._openConnect = true;
   },

   addDevice: function(device) {
      this._listDevices.push(device);
      let _dr = this.addDriveContainer();
      _dr.setLeftTopText(this.getDeviceName(device));
      switch(this._deviceType) {
         case "OpticalMount":
            _dr.setDriveIcon(this._theme, "cdrom", Lang.bind(this, this._onDriveClicked));
            _dr.setEjectIcon(this._theme, "eject", Lang.bind(this, this._onOpticalEject));
            _dr.addMeter();
            this._initializeOptical();
            break;
         case "OpticalUmount":
            _dr.setDriveIcon(this._theme, "cdrom", null);
            this.updateOpticalByIdentifier(this._getIdentifier(device));
            break;
         case "RemovableMount":
            _dr.setDriveIcon(this._theme, "usb", Lang.bind(this, this._onDriveClicked));
            _dr.setEjectIcon(this._theme, "eject", Lang.bind(this, this._onDriveEject));
            _dr.addMeter();
            break;
         case "RemovableUmount":
            _dr.setDriveIcon(this._theme, "usb", null);
            _dr.setEjectIcon(this._theme, "inject", Lang.bind(this, this._onDriveInject));
            break;
         case "HardMount":
            _dr.setDriveIcon(this._theme, "volume", Lang.bind(this, this._onDriveClicked));
            _dr.setEjectIcon(this._theme, "eject", Lang.bind(this, this._onDriveEject));
            _dr.addMeter();
            break;
         case "HardUmount":
            _dr.setDriveIcon(this._theme, "volume", null);
            _dr.setEjectIcon(this._theme, "inject", Lang.bind(this, this._onDriveInject));
            break;
         case "Empty":
            _dr.setDriveIcon(this._theme, "drive", null);
            _dr.setEjectIcon(this._theme, "empty", null);
            break;
      }
      this.update();
   },

   indexOfDevice: function(device) {
     // let currDevice;
     // for(let currIndexDevice in this._listDevices)
     // {
     //    currDevice = this._listDevices[currIndexDevice];  
     //    if(currDevice == device)
     //       return currIndexDevice;
     // }
     // return -1;
      return this._listDevices.indexOf(device);
   },

   deviceIs: function(device) {
      try {
        device.get_volumes();
        return "GDrive";
      } catch(e) {   
         try {
           device.get_mount();
         } catch(f) {
           return "GVolume";
         }  
      }
      return "GMount";
   },

   _initializeOptical: function() {
      if(this._deviceType == "OpticalMount") {
      // Search in /proc/partitions sr0 in name and take blocks, from update Optical capacity.
         let _linesPartitions = this._parent._sys.readFile("/proc/partitions").split("\n");
         let _partitionsArray = new Array();
         let _token;
         for(let i = 0; i < _linesPartitions.length; i++)
         {
            if(_linesPartitions[i].length > 0) {
               _token = _linesPartitions[i].split(/\s+/);
               if(_token.length > 4)
                  _partitionsArray.push(_token);
            }
         }
         let _sizeDr, _usedDr;
         let _current = this._listDevices.length - 1;
         let  _id = this._getIdentifier(this._listDevices[_current].get_volume()).substring(5);
         for(let i = 0; i < _partitionsArray.length; i++) {
            if(_partitionsArray[i][4] == _id) {
               _sizeDr = _partitionsArray[i][3]*1024;
               if(_sizeDr < 10240)
                  _usedDr = 0;
               else
                  _usedDr = _partitionsArray[i][3]*1024;
               this._listDriveContainer[_current].setLeftBottomText("" + this.convertToString(_usedDr) + "/" + this.convertToString(_sizeDr));
               this._listDriveContainer[_current].setMeterImage(0, _usedDr, _sizeDr);
            }
         }
      }
   },

   setCapacityDetect: function(capacityDetect) {
      this._capacityDetect = capacityDetect;
   },

   _isOpticalClosed: function(opticalDrive) {
      if((this.deviceIs(opticalDrive) == "GDrive")&&(!opticalDrive.has_volumes()))
      {
         let _deviceName = this._getIdentifier(opticalDrive);
         if(_deviceName) {
            let [res, out, err, status] = GLib.spawn_command_line_sync('cdrecord -V --inq dev=' + _deviceName);
            let _closeErr = err.toString().indexOf("tray closed");
            let _closeOut = out.toString().indexOf("tray closed");
            return ((_closeErr != -1)||(_closeErr != -1));
         }
      }          
      return true;
   },

   updateOpticalByIdentifier: function(deviceId) {
      let _index = this.getIndexOfDeviceByIdentifier(deviceId);
      if(_index != -1) {
         let _drContainer = this.getDriveContainer(_index);
         let _opticalClose = this._isOpticalClosed(this._listDevices[_index]);
         let _ejectName = _drContainer.getEjectName();
         if(!_ejectName) {
            if(_opticalClose)
               _drContainer.setEjectIcon(this._theme, "eject", Lang.bind(this, this._onOpticalEject));
            else
               _drContainer.setEjectIcon(this._theme, "inject", Lang.bind(this, this._onOpticalInject));
         } else {
            if((_drContainer.getEjectName() == "inject")&&(_opticalClose)) {
               Main.notifyError(_("The device has been loaded."));
               _drContainer.setEjectIcon(this._theme, "eject", Lang.bind(this, this._onOpticalEject));
            }
            else if((_drContainer.getEjectName() == "eject")&&(!_opticalClose)) {
               _drContainer.setEjectIcon(this._theme, "inject", Lang.bind(this, this._onOpticalInject));
               Main.notifyError(_("The device has been ejected."));
            }
         }
         Util.spawnCommandLine("eject -i on " + deviceId);//"/lib/udev/cdrom_id --lock-media /dev/sr0"
            //Need to lock optical drive for active gudev events.
         return true;
      }
      return false;
   },

   ejectOpticalByCommand: function(deviceId) {
      //Used for a bug in udev: https://bugs.launchpad.net/ubuntu/+source/udev/+bug/875543
      Util.spawnCommandLine("eject -i off " + deviceId);
      Util.spawnCommandLine("eject -T " + deviceId);   
   },

   getIndexOfDeviceByIdentifier: function(deviceId) {
      let _currDevice;
      for(let _currIndexDevice in this._listDevices)
      {
         _currDevice = this._listDevices[_currIndexDevice];  
         if(this._getIdentifier(_currDevice) == deviceId)
            return _currIndexDevice;
      }
      return -1;
   },

   removeDevice: function(device) {
      let _index = this.indexOfDevice(device);
      if(_index != -1) {
         this.removeDriver(_index);
         this._listDevices.splice(_index, 1);
         return true;
      }
      return false;
   },

   remplaceDevice: function(device) {
      let _index = this.indexOfDevice(device);
      if(_index != -1) {
         this._listDevices[_index] = device;
         return true;
      }
      return false;
   },

   getDeviceName: function(device) {
      try {
         return device.get_mount().get_name();
      } catch(e) {
         return device.get_name();
      }
   },

   getDriveUsedSpace: function(deviceMount) {
      let _attribute = "filesystem::used";
      try {   
         return deviceMount.get_mount().get_root().query_filesystem_info(_attribute, null).get_attribute_uint64(_attribute);
      } catch(e) {
         try {
            return deviceMount.get_root().query_filesystem_info(_attribute, null).get_attribute_uint64(_attribute);
         } catch(e) {
         }
      }
      return 0;
   },

   getDriveSize: function(deviceMount) {
      let _attribute = "filesystem::size";
      try {
         return deviceMount.get_mount().get_root().query_filesystem_info(_attribute, null).get_attribute_uint64(_attribute);
      } catch(e) {
         try {
            return deviceMount.get_root().query_filesystem_info(_attribute, null).get_attribute_uint64(_attribute);
         } catch(e) {
         }
      }
      return 0;
   },

   getDevicePath: function(deviceMount) {
      try {
         return deviceMount.get_mount().get_root().get_path();
      } catch(e) {
         try {
            return deviceMount.get_root().get_path();
         } catch(e) {
         }
      }
      return "";
   },

   _getIdentifier: function(deviceVolume) {
      return deviceVolume.get_identifier(Gio.VOLUME_IDENTIFIER_KIND_UNIX_DEVICE);
   },

   openMountDrive: function(_index) {
      if((_index > -1)&&(_index < this._listDevices.length)) {
         if(GLib.find_program_in_path(this._browser)) {
            let _volume = this._listDevices[_index];//Only volume have click...   
            let urlPath = this.getDevicePath(_volume); //A volume need to be mount, or don't have mount point to open.
            Util.spawnCommandLine(this._browser + " '" + urlPath + "'");
         } else {
            Main.notifyError(_("Failed of Drives Manager:") + " " + _("Can't find the default browser."));
         }
      }
   },

   unEjecting: function(unEjecting) {
      this._unEjecting = unEjecting;
   },

   openOnConnect: function(open) {
      this._openConnect = open;
   },

   setDefaultBrowser: function(browser) {
      this._browser = browser;
   },

   _onDriveClicked: function(button) {
      this.openMountDrive(this.indexOfDriverButton(button));
   },

   _onOpticalEject: function(button) {
      let _index = this.indexOfEjectButton(button);
      if(_index != -1) 
      {
         let _drive = this._listDevices[_index];
         let _id;
         try {
            let _volume = _drive.get_volume();
            _id = this._getIdentifier(_volume);
            if(_volume.can_eject()) {
               let _mountOp = new CinnamonMountOperation.CinnamonMountOperation(_volume);
               _volume.eject_with_operation(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._onEjectFinish));
            }
            else {
               _id = this._getIdentifier(_drive);
               this.ejectOpticalByCommand(_id);
               this.updateOpticalByIdentifier(_id);
               this._listDriveContainer[_index].enableClickedEject();
               // this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._update));
            }
         } catch (e) {
            _id = this._getIdentifier(_drive);
            this.ejectOpticalByCommand(_id);
            this.updateOpticalByIdentifier(_id);
            this._listDriveContainer[_index].enableClickedEject();
         }
      }
   },

   _onOpticalInject: function(button) {
      let _index = this.indexOfEjectButton(button);
      if(_index != -1) 
      {
         let _drive = this._listDevices[_index];
         let _id = this._getIdentifier(_drive);
         this.ejectOpticalByCommand(_id);
         this._listDriveContainer[_index].enableClickedEject();//Enabled event click.
         this.updateOpticalByIdentifier(_id);
        // Main.notifyError(_("Device Inject"));
      }
   },

   _onDriveEject: function(button) {
      let _index = this.indexOfEjectButton(button);
      if(_index != -1) {
         let _volume = this._listDevices[_index]; //Only mount have Eject...?
         let _mount;
         try {
            _mount = _volume.get_mount(); 
         } catch (e) {
            _mount = _volume;
         }
         try {
            let _mountOp = new CinnamonMountOperation.CinnamonMountOperation(_mount);
            if((_mount.can_eject())&&((!this._unEjecting)||(this._deviceType == "OpticalMount"))) {
               _mount.eject_with_operation(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._onEjectFinish));
            } 
            else if(_mount.can_unmount()) {
               _mount.unmount_with_operation(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._onUnmountFinish));
            }
         } catch (e) {
            Main.notifyError(_("Failed of Drives Manager:"), e.message);
         }
      }
   },

   _onDriveInject: function(button) {
      let _index = this.indexOfEjectButton(button);
      if(_index != -1) {
         let _mount = this._listDevices[_index]; //Only volume have Inject...
         let _volume;
         try {
            _volume = _mount.get_volume();
         } catch (e) {
            _volume = _mount;
         }
         if(_volume) {//Test Gio.MountUnmountFlags.FORCE
            try {
               let _mountOp = new CinnamonMountOperation.CinnamonMountOperation(_volume);
               if(_volume.can_mount()) {
                  _volume.mount(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._onVolumeMountedFinish));
               }
            } catch(e) {
               Main.notifyError(_("Failed of Drives Manager:"), e.message);
            }
         }
      }
   },

   _onEjectFinish: function(mount, result) {
      try {
         mount.eject_with_operation_finish(result);
         //Main.notifyError(_("The device has been ejected."));
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },

   _onUnmountFinish: function(mount, result) {
      try {
         mount.unmount_with_operation_finish(result);
        // Main.notifyError(_("The device has been ejected."));
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },

   _onVolumeMountedFinish: function(volume, result) {
      try {
         volume.mount_finish(result);
      } catch (e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },

   update: function() {
      if(this._capacityDetect)
      {
         let _sizeDr;
         let _usedDr;
         if((this._deviceType == "RemovableMount")||(this._deviceType == "HardMount")) {
            for(let i = 0; i < this._listDriveContainer.length; i++) {
               _sizeDr = this.getDriveSize(this._listDevices[i]);
               _usedDr = this.getDriveUsedSpace(this._listDevices[i]);
               this._listDriveContainer[i].setLeftBottomText("" + this.convertToString(_usedDr) + "/" + this.convertToString(_sizeDr));
               this._listDriveContainer[i].setMeterImage(0, _usedDr, _sizeDr);
            }
         }
      }
   }
};

function VolumeMonitor(globalContainer) {
    this._init(globalContainer);
}

VolumeMonitor.prototype = {

   _init: function(globalContainer) {
      this._browser = "nemo";
      this._unEjecting = false;
      this._openConnect = true;
      this._capacityDetect = true;
      this._globalContainer = globalContainer;
      this._monitor = Gio.VolumeMonitor.get();
      this._client = new GUdev.Client ({subsystems: ["block"]});
      //this._client
      this._volumeMonitorSignals = [];
      this._idGuDev;
      this.connect();
      this._createCategory();
   },

   connect: function() {
     this._volumeMonitorSignals = [];
     let id = this._monitor.connect('mount-added', Lang.bind(this, this._onMountAdded));
     this._volumeMonitorSignals.push(id);
     id = this._monitor.connect('mount-removed', Lang.bind(this, this._onMountRemoved));
     this._volumeMonitorSignals.push(id);
     id = this._monitor.connect('volume-added', Lang.bind(this, this._onVolumeAdded));
     this._volumeMonitorSignals.push(id);
     id = this._monitor.connect('volume-removed', Lang.bind(this, this._onVolumeRemoved));
     this._volumeMonitorSignals.push(id);
     id = this._monitor.connect('drive-connected', Lang.bind(this, this._onDriveConnected));
     this._volumeMonitorSignals.push(id);
     id = this._monitor.connect('drive-disconnected', Lang.bind(this, this._onDriveDisconnected));
     this._volumeMonitorSignals.push(id);
     //id = this._monitor.connect('drive-changed', Lang.bind(this, this._onDriveChange));
     //this._volumeMonitorSignals.push(id);
     //id = this._monitor.connect('drive-eject-button', Lang.bind(this, this._onDriveEjectButton));
     //this._volumeMonitorSignals.push(id);

     this._idGuDev = this._client.connect('uevent', Lang.bind(this, this.on_uevent));
     //let enumerator = new GUdev.Enumerator({client: client});
     //let d = this._client.query_by_device_file ("/dev/sda1");
     //this.print_device(d);
   },

   on_uevent: function(client, action, device) {
      let _deviceId = device.get_device_file();
      if(_deviceId)
         this._listCategory[1].updateOpticalByIdentifier(_deviceId);
   },


   print_device: function(device) {
      Main.notifyError ("  subsystem:             " + device.get_subsystem ());
      Main.notifyError ("  devtype:               " + device.get_devtype ());
      Main.notifyError ("  name:                  " + device.get_name ());
      Main.notifyError ("  number:                " + device.get_number ());
      Main.notifyError ("  sysfs_path:            " + device.get_sysfs_path ());
      Main.notifyError ("  driver:                " + device.get_driver ());
      Main.notifyError ("  action:                " + device.get_action ());
      Main.notifyError ("  seqnum:                " + device.get_seqnum ());
      Main.notifyError ("  device type:           " + device.get_device_type ());
      Main.notifyError ("  device number:         " + device.get_device_number ());
      Main.notifyError ("  device file:           " + device.get_device_file ());
      Main.notifyError ("  device file symlinks:  " + device.get_device_file_symlinks ());
      Main.notifyError ("  foo: " + device.get_sysfs_attr_as_strv ("stat"));
      let keys = device.get_property_keys ();
      for(let n = 0; n < keys.length; n++) {
         Main.notifyError ("    " + keys[n] + "=" + device.get_property (keys[n]));
      }
   },

   _onVolumeAdded: function() {
       this._createCategory();
   },

   _onVolumeRemoved: function() {
       this._createCategory();
   },

   _onDriveConnected: function() {
       this._createCategory();
   },

   _onDriveDisconnected: function() {
       this._createCategory();
   },

//   _onDriveChange: function() {
//       Main.notifyError("changed");
//   },

//   _onDriveEjectButton: function() {
//       Main.notifyError("Eject Button");
//   },

   disconnect: function() {
      for(let i = 0; i < this._volumeMonitorSignals.length; i++)
         this._monitor.disconnect(this._volumeMonitorSignals[i]);
      if(this._idGuDev)
         this._client.disconnect(this._idGuDev);
   },

   _createCategory: function() {
      let _indexCategory = this._globalContainer.countCategoryContainer();
      if(this._listCategory) {
         _indexCategory = this._globalContainer.indexOfCategoryContainer(this._listCategory[0]);
         for(let i = 0; i < this._listCategory.length; i++) {
            this.listConnect[i] = this._globalContainer.isCategoryConnectByIndex(_indexCategory);
            this._globalContainer.removeCategoryContainerByIndex(_indexCategory);
            //category.destroy();
         }
      } else {
         this.listConnect = new Array(true, true, true, true, true, true, true);
      }

      this._listCategory = new Array();
      this._listCategory.push(new DeviceContainer(this._globalContainer, "OpticalMount"));
      this._globalContainer.insertCategoryContainer(this._listCategory[0], _indexCategory);
      if(this.listConnect[0]) this._globalContainer.connectCategory(this._listCategory[0]);

      this._listCategory.push(new DeviceContainer(this._globalContainer, "OpticalUmount"));
      this._globalContainer.insertCategoryContainer(this._listCategory[1], _indexCategory + 1);
      if(this.listConnect[1]) this._globalContainer.connectCategory(this._listCategory[1]);

      this._listCategory.push(new DeviceContainer(this._globalContainer, "RemovableMount"));
      this._globalContainer.insertCategoryContainer(this._listCategory[2], _indexCategory + 2);
      if(this.listConnect[2]) this._globalContainer.connectCategory(this._listCategory[2]);

      this._listCategory.push(new DeviceContainer(this._globalContainer, "RemovableUmount"));
      this._globalContainer.insertCategoryContainer(this._listCategory[3], _indexCategory + 3);
      if(this.listConnect[3]) this._globalContainer.connectCategory(this._listCategory[3]);

      this._listCategory.push(new DeviceContainer(this._globalContainer, "HardMount"));
      this._globalContainer.insertCategoryContainer(this._listCategory[4], _indexCategory + 4);
      if(this.listConnect[4]) this._globalContainer.connectCategory(this._listCategory[4]);

      this._listCategory.push(new DeviceContainer(this._globalContainer, "HardUmount"));
      this._globalContainer.insertCategoryContainer(this._listCategory[5], _indexCategory + 5);
      if(this.listConnect[5]) this._globalContainer.connectCategory(this._listCategory[5]);

      this._listCategory.push(new DeviceContainer(this._globalContainer, "Empty"));
      this._globalContainer.insertCategoryContainer(this._listCategory[6], _indexCategory + 6);
      if(this.listConnect[6]) this._globalContainer.connectCategory(this._listCategory[6]);

      let _listDrives = this._monitor.get_connected_drives();
      for(let i = 0; i < _listDrives.length; i++) {
         this._insertInCategory(_listDrives[i]);
      }
      this.setCapacityDetect(this._capacityDetect);
      this.setDefaultBrowser(this._browser);
      this.openOnConnect(this._openConnect);
      this.unEjecting(this._unEjecting);
   },

   _insertInCategory: function(drive) {
      if(drive) {
         let _listVols = drive.get_volumes();
         for(let j = 0; j < _listVols.length; j++) {
            if(_listVols[j].get_mount()) {
               if(this._isOptical(drive))
                  this._listCategory[0].addDevice(_listVols[j].get_mount());
               else if(drive.can_eject())
                  this._listCategory[2].addDevice(_listVols[j].get_mount());
               else
                  this._listCategory[4].addDevice(_listVols[j].get_mount());
            }
            else if(this._isOptical(drive))
               this._listCategory[1].addDevice(_listVols[j]);
            else if(drive.can_eject())
               this._listCategory[3].addDevice(_listVols[j]);
            else
               this._listCategory[5].addDevice(_listVols[j]);
         }
         if(_listVols.length == 0)
         {
            if(this._isOptical(drive))
               this._listCategory[1].addDevice(drive);
            else
               this._listCategory[6].addDevice(drive);
         }
      }
   },

   _removeDevice: function(device) {
      if(device) {   
         for(let _categoryIndex in this._listCategory)
         {
            if(this.getCategory(_categoryIndex).removeDevice(device))
               return true;
         }
      }
      return false;
   },

   setCapacityDetect: function(capacityDetect) {
      this._capacityDetect = capacityDetect;
      for(let category in this._listCategory)
         this._listCategory[category].setCapacityDetect(capacityDetect);
   },

   setDefaultBrowser: function(browser) {
      this._browser = browser;
      for(let category in this._listCategory)
         this._listCategory[category].setDefaultBrowser(browser);
   },

   openOnConnect: function(open) {
      this._openConnect = open;
      for(let category in this._listCategory)
         this._listCategory[category].openOnConnect(open);
   },

   unEjecting: function(unEjecting) {
      this._unEjecting = unEjecting;
      for(let category in this._listCategory)
         this._listCategory[category].unEjecting(unEjecting);
   },

   getCategory: function(index) {
      return this._listCategory[index];
   },

   countCategory: function(index) {
      return this._listCategory.length;
   },

   removeCategory: function(index) {
      let category = this._listCategory[index];
      if(category) {
         this._globalContainer.removeCategoryContainer(category);
         //category.destroy();
      }
   },

   removeAllCategory: function() {
      for(let category in this._listCategory) {
         this._globalContainer.removeCategoryContainer(category);
         //category.destroy();
      }
   },

   _isOptical: function(opticalDrive) {
      let _deviceName = this._getIdentifier(opticalDrive);
      let _matchSR = _deviceName.match(new RegExp('/dev/sr[0-9]+', 'g'));
      let _matchCDRomN = _deviceName.match(new RegExp('/dev/cdrom[0-9]+', 'g'));
      let _matchCDRom = _deviceName.match(new RegExp('/dev/cdrom', 'g'));
      let _matchSCD = _deviceName.match(new RegExp('/dev/scd[0-9]+', 'g'));
      let _matchHDC = _deviceName.match(new RegExp('/dev/hdc', 'g'));
      if((_deviceName != null)&&((_matchSR != null)||(_matchCDRomN != null)||(_matchCDRom != null)||(_matchSCD != null)||(_matchHDC != null)))
      {
        // if((this._advanceOpticalDetect)&&(!this._firstTime))
        //    return (this._findOpticalByDeviceName(_deviceName) != null);

       // let client = new GUdev.Client({subsystems: ['block']});
       // let enumerator = new GUdev.Enumerator({client: client});
       // enumerator.add_match_subsystem('b*');

       // let devices = enumerator.execute();
       // for(let n=0; n < devices.length; n++) 
       // {
       //     let device = devices[n];
       //     Main.notifyError(device.get_property("DEVNAME"));
       //     if(device.get_property("ID_CDROM") != null)
       //     {
       //        Main.notifyError(device.get_property("DEVNAME"));
       //     }
       // }
        return true;
      }	
      return false;
   },

//Monitor
   _onMountAdded: function(monit, mount) {
      this._createCategory();
      //this._insertInCategory(mount.get_drive());
      try {
         Main.notifyError(_("The device has been loaded."));
         global.play_theme_sound(0, 'device-added-media');
         if(this._openConnect) {
            if(GLib.find_program_in_path(this._browser)) { 
               let urlPath = this.getDevicePath(mount); //A volume need to be mount, or don't have mount point to open.
               Util.spawnCommandLine(this._browser + " '" + urlPath + "'");
            } else {
               Main.notifyError(_("Failed of Drives Manager:") + " " + _("Can't find the default browser."));
            }
         } 
       
       // let listMount = this._monitor.get_mounts();
       //  let valIndex = listMount.indexOf(mount);
       //  if(this._isOptical(mount.get_volume()))
       //     this._listCategory[0].addDevice(listMount[valIndex]);
       //  else
       //     this._listCategory[2].addDevice(listMount[valIndex]);
      
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },

   _onMountRemoved: function(monit, mount) {
      try {
        Main.notifyError(_("The device has been ejected."));
        global.play_theme_sound(0, 'device-removed-media');
        this._createCategory();
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },

   getDevicePath: function(deviceMount) {
      try {
         return deviceMount.get_mount().get_root().get_path();
      } catch(e) {
         try {
            return deviceMount.get_root().get_path();
         } catch(e) {
         }
      }
      return "";
   },

   _getIdentifier: function(deviceVolume) {
      return deviceVolume.get_identifier(Gio.VOLUME_IDENTIFIER_KIND_UNIX_DEVICE);	
   }
};

function _(str) {
   return Gettext.dgettext("drivesManager@lestcape", str);
}

function MyDesklet(metadata) {
    this._init(metadata);
}

MyDesklet.prototype = {

   __proto__: Desklet.Desklet.prototype,

   _init: function(metadata) {
      Desklet.Desklet.prototype._init.call(this, metadata);
      this.metadata = metadata;
      this.uuid = this.metadata["uuid"];
      if(!Main.deskletContainer.contains(this.actor)) {
         Main.deskletContainer.addDesklet(this.actor);
      }

      this.sys = new SystemClass.System(this.uuid);
      //this.sys.print_all_device();

      this.sys.execInstallLanguage();
      _ = imports.gettext.domain(this.uuid).gettext;
      imports.gettext.bindtextdomain(this.uuid, GLib.get_home_dir() + "/.local/share/locale");

      this.setHeader(_("Drives Manager"));
      this.helpFile = Gio.file_new_for_path(GLib.get_home_dir() + "/.local/share/cinnamon/desklets/" + this.uuid + "/" + _("locale/README"));
      if(!this.helpFile.query_exists(null))
         this.helpFile = Gio.file_new_for_path(GLib.get_home_dir() + "/.local/share/cinnamon/desklets/" + this.uuid + "/locale/README");
      this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      this._menu.addAction(_("Help"), Lang.bind(this, function() {
         Util.spawnCommandLine("xdg-open " + this.helpFile.get_path());
      }));

      this._initSettings();
      this._initComponents();
      this._timeout = null;
      this._update();
   },

   on_desklet_removed: function() {
      try {
         this.hardDisk.destroy();
         this.volumeMonitor.disconnect();
         if(this._timeout > 0) {
            Mainloop.source_remove(this._timeout);
         }
         this.sys.destroy();
      } catch(e) {
         Main.notify(_("Failed of Drives Manager:"), e.message);
      }
   },

   _update: function() {
      if (this.updateInProgress) return;
      this.updateInProgress = true;
      try {
         this.globalContainer.update();
         this.hddTempMonitor.update();
      } catch(e) {
         /*do nothing*/
      } finally {
        this.updateInProgress = false;
      }
      this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._update));
   },

   _initComponents: function() {
      try {
         this.globalContainer = new GlobalContainer(this.uuid, this.sys);
         this.setContent(this.globalContainer.getContentBox());

         this.hddTempMonitor = new HDDTempMonitor(this.sys);

         this.speedDisk = new SpeedDiskContainer(this.globalContainer);
         this.globalContainer.addCategoryContainer(this.speedDisk);
         this._onShowSpeedMeter();

         this.hardDisk = new HardDiskContainer(this.globalContainer, this.hddTempMonitor);
         this.globalContainer.addCategoryContainer(this.hardDisk);
         this._onShowHardDisk();

         this.volumeMonitor = new VolumeMonitor(this.globalContainer);
         this._onShowOpticalDrives();
         this._onShowRemovableDrives();
         this._onShowFixedDrives();
         this._onShowEmptyDrives();
         this._onMeterTimeDelay();
         this._onShowMainBox();
         this._onShowDriveBox();
         this._onThemeChange();
         this._onTypeOpenChanged();
         this._onFixWidth();
         this._onOverrideTheme();
         this._onBorderBoxWidth();
         this._onBorderBoxColor();
         this._onBoxColor();
         this._onFontColor();
         this._onTextTopSize();
         this._onTextBottomSize();
         this._onOpacity();
         this._onCapacityDetect();
         this._onOpenConnect();
         this._onDefaultBrowser();
         this._onUnEjecting();
         this._onHddTempChanged();
         this._onHddTempPlaySoundChanged();
         this._onHddTempNormalColorChanged();
         this._onHddTempWarningColorChanged();
         this._onHddTempCritialColorChanged();
         this._onHddTempWarningTempChanged();
         this._onHddTempCritialTempChanged();
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },

   _onShowMainBox: function() {
      this.globalContainer.showMainBox(this._showMainBox);
   },

   _onShowDriveBox: function() {
      this.globalContainer.showDriveBox(this._showDriveBox);
   },

   _onThemeChange: function() {
      this.globalContainer.setTheme(this._theme);
   },

   _onShowSpeedMeter: function() {
      if(this._showSpeedMeter)
         this.globalContainer.connectCategory(this.speedDisk);
      else
         this.globalContainer.disconnectCategory(this.speedDisk);
   },

   _onShowHardDisk: function() {
      if(this._showHardDrives)
         this.globalContainer.connectCategory(this.hardDisk);
      else
         this.globalContainer.disconnectCategory(this.hardDisk);
   },

   _onShowOpticalDrives: function() {
      if(this._showOpticalDrives) {
         this.globalContainer.connectCategory(this.volumeMonitor.getCategory(0));
         this.globalContainer.connectCategory(this.volumeMonitor.getCategory(1));
      }
      else {
         this.globalContainer.disconnectCategory(this.volumeMonitor.getCategory(0));
         this.globalContainer.disconnectCategory(this.volumeMonitor.getCategory(1));
      }
   },

   _onShowRemovableDrives: function() {
      if(this._showRemovableDrives) {
         this.globalContainer.connectCategory(this.volumeMonitor.getCategory(2));
         this.globalContainer.connectCategory(this.volumeMonitor.getCategory(3));
      }
      else {
         this.globalContainer.disconnectCategory(this.volumeMonitor.getCategory(2));
         this.globalContainer.disconnectCategory(this.volumeMonitor.getCategory(3));
      }
   },

   _onShowFixedDrives: function() {
      if(this._showFixedDrives) {
         this.globalContainer.connectCategory(this.volumeMonitor.getCategory(4));
         this.globalContainer.connectCategory(this.volumeMonitor.getCategory(5));
      }
      else {
         this.globalContainer.disconnectCategory(this.volumeMonitor.getCategory(4));
         this.globalContainer.disconnectCategory(this.volumeMonitor.getCategory(5));
      }
   },

   _onShowEmptyDrives: function() {
      if(this._showEmptyDrives) {
         this.globalContainer.connectCategory(this.volumeMonitor.getCategory(6));
      }
      else {
         this.globalContainer.disconnectCategory(this.volumeMonitor.getCategory(6));
      }
   },

   _onMeterTimeDelay: function() {
      this.speedDisk.setMeterTimeDelay(this._meterTimeDelay);
   },

   _onTypeOpenChanged: function() {
      try {
         this.sys.setGSettingsProp("org.gnome.desktop.media-handling", "automount-open", this._openSystem);
         //this.sys.setGSettingsProp("org.gnome.desktop.media-handling", "automount", this._openSystem);
      } catch(e) {
        Main.notify(_("Failed of Drives Manager:"), e.message);
      }
   },

   _onFixWidth: function() {
      this.globalContainer.setWidth(this._width);
      this.globalContainer.fixWidth(this._fixWidth);
   },

   _onBorderBoxWidth: function() {
      this.globalContainer.setBorderBoxWidth(this._borderBoxWidth);
   },

   _onBorderBoxColor: function() {
      this.globalContainer.setBorderBoxColor(this._borderBoxColor);
   },

   _onOverrideTheme: function() {
      this.globalContainer.overrideTheme(this._overrideTheme);
   },

   _onBoxColor: function() {
      this.globalContainer.setBoxColor(this._boxColor);
   },

   _onFontColor: function() {
      this.globalContainer.setFontColor(this._fontColor);
   },

   _onTextTopSize: function() {
      this.globalContainer.setTopTextSize(this._textTopSize);
   },

   _onTextBottomSize: function() {
      this.globalContainer.setBottomTextSize(this._textBottomSize);
   },

   _onOpacity: function() {
      this.globalContainer.setOpacity(this._opacity);
   },

   _onOpenConnect: function() {
      this.volumeMonitor.openOnConnect(this._openConnect);
   },

   _onCapacityDetect: function() {
      this.hardDisk.setCapacityDetect(this._capacityDetect);
      this.volumeMonitor.setCapacityDetect(this._capacityDetect);
   },

   _onDefaultBrowser: function() {
      this.volumeMonitor.setDefaultBrowser(this._browser);
      this.hardDisk.setDefaultBrowser(this._browser);
   },

   _onUnEjecting: function() {
      this.volumeMonitor.unEjecting(this._unEjecting);
   },

   _onHddTempChanged: function() {
      this.hddTempMonitor.enableMonitor(this._hddTempActive);
   },

   _onHddTempPlaySoundChanged: function() {
      this.hddTempMonitor.activeAlarm(this._hddTempSound);
   },

   _onHddTempNormalColorChanged: function() {
      this.hddTempMonitor.setNormalHddTempColor(this._normalHddColor);
   },

   _onHddTempWarningColorChanged: function() {
      this.hddTempMonitor.setWarningHddTempColor(this._warningHddColor);
   },

   _onHddTempCritialColorChanged: function() {
      this.hddTempMonitor.setCritialHddTempColor(this._critialHddColor);
   },

   _onHddTempWarningTempChanged: function() {
      this.hddTempMonitor.setWarningHddTemp(this._warningHddTemp);
   },

   _onHddTempCritialTempChanged: function() {
      this.hddTempMonitor.setCriticalHddTemp(this._criticalHddTemp);
   },

   _initSettings: function() {
      try {
         this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], this.instance_id);

         this.settings.bindProperty(Settings.BindingDirection.IN, "speedMeter", "_showSpeedMeter", this._onShowSpeedMeter, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "hardDrives", "_showHardDrives", this._onShowHardDisk, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "opticalDrives", "_showOpticalDrives", this._onShowOpticalDrives, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "removableDrives", "_showRemovableDrives", this._onShowRemovableDrives, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "fixedDrives",  "_showFixedDrives", this._onShowFixedDrives, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "emptyDrives", "_showEmptyDrives", this._onShowEmptyDrives, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "meterTimeDelay", "_meterTimeDelay", this._onMeterTimeDelay, null);


         this.settings.bindProperty(Settings.BindingDirection.IN, "openSystem", "_openSystem", this._onTypeOpenChanged, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "openConnect", "_openConnect", this._onOpenConnect, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "openWith", "_browser", this._onDefaultBrowser, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "capacityDetect", "_capacityDetect", this._onCapacityDetect, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "unEjecting", "_unEjecting", this._onUnEjecting, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "hddTemp", "_hddTempActive", this._onHddTempChanged, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "hddTempSound", "_hddTempSound", this._onHddTempPlaySoundChanged, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "normalHddColor", "_normalHddColor", this._onHddTempNormalColorChanged, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "warningHddColor", "_warningHddColor", this._onHddTempWarningColorChanged, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "critialHddColor", "_critialHddColor", this._onHddTempCritialColorChanged, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "warningHddTemp", "_warningHddTemp", this._onHddTempWarningTempChanged, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "criticalHddTemp", "_criticalHddTemp", this._onHddTempCritialTempChanged, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "mainBox", "_showMainBox", this._onShowMainBox, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "driveBox", "_showDriveBox", this._onShowDriveBox, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "theme", "_theme", this._onThemeChange, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "fixWidth", "_fixWidth", this._onFixWidth, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "width", "_width", this._onFixWidth, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "opacity", "_opacity", this._onOpacity, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "overrideTheme", "_overrideTheme", this._onOverrideTheme, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "boxColor", "_boxColor", this._onBoxColor, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "fontColor", "_fontColor", this._onFontColor, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "textTopSize", "_textTopSize", this._onTextTopSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "textBottomSize", "_textBottomSize", this._onTextBottomSize, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "borderBoxWidth", "_borderBoxWidth", this._onBorderBoxWidth, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "borderBoxColor", "_borderBoxColor", this._onBorderBoxColor, null);
      } catch (e) {
        // Main.notify(_("Failed of Drives Manager:"), e.message);
         global.logError(e);
      }
   }
}
        
function main(metadata, desklet_id) {
   let desklet = new MyDesklet(metadata, desklet_id);
   return desklet;
}
