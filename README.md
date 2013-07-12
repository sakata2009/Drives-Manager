Drives-Manager v0.5-Beta
==============

A Drives Manager Desklet for Cinnamon - v0.5-Beta 11 July 2013.
Author: Lester Carballo Pérez <lestcape@gmail.com>

This is a desklet to display the current drives plugged to the computer. We can used the ability to show the volumens of the drive, also indicate if the volumen is mounted. When plugged a removable volumen, you can mount and unmount the volumen. If the volumen is mount, you can access directly with left click in to the icon of drive. The configuration for all option it is in schema format, and is accesible for the cinnamon settings, or directly with right click in the desklet.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.

Instalation Instructions:

1- Download folder drivesManager@lestcape with all file and subfolder from <https://github.com/lestcape/Drives-Manager>.

2- Put in /home/USER/.local/share/cinnamon/desklets/ where USER is your account.

3- Enable a Desklet in Cinnamon Settings and use.

Issues and improvements:
- Warning! Cinnamon has a bug in the handling of special characters, such as accents or ñ. This is only for users who do not use the english language. To use a non english language, required activate repeatedly the desklet (nothing will be displayed on the first attempt), turn it off and on again. The system language will be recognized and if a translation into your language exist, will be displayed. You need access to the iconv command. This command is the one that helps solve the problem of Cinnamon. It helps that the problem is quickly solved, participating in the following url: https://github.com/linuxmint/Cinnamon/issues/2245
- Advanced Option for Optical devices, need packages "cdrecord" and "wodim" to detect status(open/closed) of the CD/DVD. The command cdrecord depends on wodim, and when the optical drive has a disk, wodim sometimes fail to properly access the device.
- Optical option, only detect as a CD/DVD drives, the device id match with "dev/sr[0-9]+", "/dev/cdrom[0-9]+", "/dev/cdrom", "/dev/scd[0-9]+", "/dev/hdc". If you have other id for some optical device, please let me know, to update.
- The Hard drive and optical option need the "coreutils" package, for use the command df.
- Sometimes auto mount points open devices may fail and open more than once the same volume. This is because the volume was removed using an alternative mode not recognized by the operating system, and when this reconnect may appear doubled.
- The "use pmount package" option requires package "pmount". The pmount command does not need superuser permissions to process the operation mount and unmount, which is why the operation can not be performed with protocols support operating system. Visit: http://pmount.alioth.debian.org/, for more details on this package.

How to add a new language:

1- Open terminal and write "locale", the output is some things like this:

LANG=es_MX.UTF-8

LANGUAGE=es_MX:es

LC_CTYPE="es_MX.UTF-8"

LC_NUMERIC="es_MX.UTF-8"

LC_TIME="es_MX.UTF-8"

LC_COLLATE="es_MX.UTF-8"

LC_MONETARY="es_MX.UTF-8"

LC_MESSAGES="es_MX.UTF-8"

LC_PAPER="es_MX.UTF-8"

LC_NAME="es_MX.UTF-8"

LC_ADDRESS="es_MX.UTF-8"

LC_TELEPHONE="es_MX.UTF-8"

LC_MEASUREMENT="es_MX.UTF-8"

LC_IDENTIFICATION="es_MX.UTF-8"

LC_ALL=

In this example the first row "LANG=es_MX.UTF-8" is mark that  system language it's in spanish. Look "es" it's the key to determine the language.

2- Go to /home/User/.local/share/cinnamon/desklets/drivesManager@lestcape.

3- In the lang folder make a copy of file "en" and change the name of file copy to the key name was obtained in step 1.

4- Open the copy of file, in the contents of this, exist some lines with a "key=value" format. You can't change the key. You can only change the value, translate the present value in english language to your language.

5- Save your file.

6- Close the desklet and the system settings, if it's open.

7- Delete the file settings-schema.json in folder  /home/User/.local/share/cinnamon/desklets/drivesManager@lestcape. Please take warning, don't delete the file skeleton-settings-schema.json or some another one.

8- Open the desklet, it's now in your language.

9- Please send your file by email lestcape@gmail.com. It's will be putting in the official web page of cinnamon, with your nick name or name depending on your preference.

ChangeLog:

0.5-Beta
   - The automatic installation of pmount was fixed.
   - Added support for languages. The file settings-schema.json was eliminated, it will be generated automatically based on the language of the system, from the new file included "skeleton-settings-schema.json". Also was included the new file "translate.js" for translation automation.

0.4-Beta
   - The code was optimized to use less CPU.
   - Was added a new option. Now you can choose not to spend CPU and have the information capacity of the current mounted volumes.

0.3-Beta
   - Now you can open mount point with space.
   - Fixed problem to open the mount point of volumen.

0.2-Beta
   - Fixed problem with the reconnection of electrified devices.
   - Add suport for recognized Drives with more than one volume.
   - The option "Safely Remove" changed its name to "use pmount package".
   - Now you can reconnect the removable devices without removing them from its connector.

0.1-Beta
   - Initial release.

Report issues: 
https://github.com/lestcape/Drives-Manager/issues

Requests:
https://github.com/lestcape/Drives-Manager/pulls

If you want to help develop the desklet, language support, or icon pack, contact me without any problem.
Thanks.

Lester.
