#Sigony's Map Additions

by Sigony

version 1.1



#Introduction

This RMMV plugin allows you to copy and delete maps using plugin commands, meaning this can happen in-game. This has some powerful possibilities for those with imagination.



/With great power comes great responsibility./



#Important

This plugin manipulates your project's files and bugs are entirely possible. Before using this plugin, you should backup your data. I am not responsible for any loss that you incur from using this plugin. Use this plugin with caution.



The current version has only been tested to work for windows.

Linux and mac are untested, I would appreciate any tests for these.

Web and mobile do not work currently.



You will need to save this file as "SigonyMapAdditions.js", or it will not work.


#Potential Use Cases

Map instances (i.e. mystery dungeon)
Powerful when used with Shaz's Tile Changer.
Plugin creators who would like to generate new maps in-game may find that this plugin saves them lots of work.


#Features

Copy a map using a plugin command.
Delete a map using a plugin command (mainly if you want to clean up instances)


#INSTRUCTIONS

> To copy a map you can use the following plugin command format:

/CopyMap mapId "mapName" variableForNewMapId parentId/

mapId - this is the ID of the map that you wish to copy. A new map, with a different ID, will be created.
mapName - this is the name that appears in the editor, and is also the display name.
variableForNewMapId - this is the $gameVariable that will store the newly copied map's ID.
Once you copy the map, you might like to go to it, and so you can do this using events.
Event > Transfer Player > Designation with variables. (You will need to set some temporary values for x and y coord)
You do not need an endless list of variables to hold the mapIDs of every new map that you create in-game. You can be clever and juggle them a bit. To get you started look at: Event > Control Variables > GameData > MapID. The fact that the current map's ID is accessible allows you to store the ID of a map when you leave it. You can have a previousMap variable for example.
Make sure to keep track of if a mapID actually exists and know where it leads at any moment. When a map is deleted, and another created, the mapID will be re-used, and this might create some headaches for you if you aren't careful.
parentId - this allows you to make the generated map a child of the map with this parent ID, making it indented and able to be hidden with a spoiler in the editor, the purpose of which is to help reduce clutter in the editor and for you to organize the potentially large amount of maps you'll be dealing with. If you do not desire the copied map to be foldable, set the parentId to 0.
Example: 

/CopyMap 1 "Copied Map" 5 1/



Note: If you copy a map in-game and it does not appear in your editor, it is because the editor hasn't updated its list. If you want to see your copied map in the editor, then feel free to close and re-open the editor.



> To delete a map you can use the following plugin command format:

/DeleteMap mapId/

mapId - The mapID of the map you wish to delete.
Example, accessing the value stored in variable 5:

/DeleteMap $gameVariables.value(5)/



Note: Deletion is permanent. Deleting maps should be done with extreme caution. Again, make sure you backup any maps that are important to you. Make sure you know what you are deleting. Make sure you do any necessary cleanup of your variables. Make sure you do not try to transfer the player to a map that no longer exists.









#Troubleshooting / Feedback

Please report any bugs that you have, and how to recreate the issue. Press F8 to open console, provide that if applicable.

Feedback is welcome. Suggestions are welcome.



#Credit

Sigony



#License

Credit me where applicable in your derivative works.

Redistribute by linking to this page.

Commercial use requires payment.

Free for non-commercial and personal use.



#Updates

v1.1 :: 22/08/2020 ::  Fixed issue preventing windows deployment from working. Still needs work to be fully compatible.



#Todo

Allow changes to be save-file specific as opposed to global.
Make compatible with web
Make compatible with linux
Make compatible with mac
Make compatible with android/ios
