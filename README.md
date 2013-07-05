Drives-Manager v0.1-Beta
==============

A Drives Manager Desklet for Cinnamon - v0.1-Beta 28 June 2013.
Author: Lester Carballo Pérez <lestcape@gmail.com>

This is a desklet to display the current drives plugged to the computer. We can used the ability to show the volumens of the drive, also indicate if the volumen is mounted. When plugged a removable volumen, you can mount and unmount the volumen. If the volumen is mount, you can access directly with left click in to the icon of drive. The configuration for all option it is in shema format, and is accesible for the cinnamon settings, or directly with right click in the desklet.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.

Instalation Instructions:

1- Download folder drivesManager@lestcape with all file and subfolder from <https://github.com/lestcape/Drives-Manager>.
2- Put in /home/USER/.local/share/cinnamon/desklets/ where USER is your account.
3- Enable a Desklet in Cinnamon Settings and use.

Issues and improvements:

- Drive with more than one volume is not recognized properly.
- The "Safely Remove" option, does not work yet.
- Advanced Option for Optical devices, need packages "cdrecord" and "wodim" to detect status(open/closed) of the CD/DVD. The command cdrecord depends on wodim, and when the optical drive has a disk, wodim sometimes fail to properly access the device.
-  Optical option, only detect as a CD/DVD drives, the device id match with "dev/sr[0-9]+", "/dev/cdrom[0-9]+", "/dev/cdrom", "/dev/scd[0-9]+", "/dev/hdc". If you have other id for some optical device, please let me know, to update.
- The Hard drive and optical option need the "coreutils" package, for use the command df.
- Sometimes auto mount points open devices may fail and open more than once the same volume. This is because the volume was removed using an alternative mode not recognized by the operating system, and when this reconnect may appear doubled.
- The "Safely Removed" option requires package "pmount". The pmount command does not need superuser permissions to process the operation mount and unmount, which is why the operation can not be performed with protocols support operating system. Visit: http://pmount.alioth.debian.org/, for more details on this package.
-The code can be optimized to use less CPU in some next release.

Report issues: 
https://github.com/lestcape/Drives-Manager/issues

Requests:
https://github.com/lestcape/Drives-Manager/pulls

Si usted quiere contribuir al desarrollo del desklet o el soporte de lenguaje, contactame sin ningun problema.
Thanks.

Lester.
