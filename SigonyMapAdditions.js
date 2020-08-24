/*:
 * @plugindesc Allows you to copy a map file from within the game. 
 * @author Sigony - (T.J.B.)
 * @version 1.1
*/

/**
 * SIGONY'S MAP ADDITIONS
 * 
 * Important

This plugin manipulates your project's files and bugs are entirely possible. 
Before using this plugin, you should backup your data. 
I am not responsible for any loss that you incur from using this plugin. 
Use this plugin with caution.

The current version has only been tested to work for windows. Linux and mac are untested, I would appreciate any tests for these.
Web and mobile do not work currently.

INSTRUCTIONS



> To copy a map you can use the following plugin command format:

[QUOTE]CopyMap mapId "mapName" variableForNewMapId parentId [/QUOTE]

mapId - this is the ID of the map that you wish to copy. A new map, with a different ID, will be created.
mapName - this is the name that appears in the editor, and is also the display name.
variableForNewMapId - this is the $gameVariable that will store the newly copied map's ID.
Once you copy the map, you might like to go to it, and so you can do this using events.
Event > Transfer Player > Designation with variables. (You will need to set some temporary values for x and y coord)
You do not need an endless list of variables to hold the mapIDs of every new map that you create in-game. You can be clever and juggle them a bit. 
To get you started look at: Event > Control Variables > GameData > MapID. 
The fact that the current map's ID is accessible allows you to store the ID of a map when you leave it. 
You can have a previousMap variable for example.
Make sure to keep track of if a mapID actually exists and know where it leads at any moment. 
When a map is deleted, and another created, the mapID will be re-used, and this might create some headaches for you if you aren't careful.
parentId - this allows you to make the generated map a child of the map with this parent ID, making it indented and able to be hidden with a 
spoiler in the editor, the purpose of which is to help reduce clutter in the editor and for you to organize the potentially large amount of 
maps you'll be dealing with. If you do not desire the copied map to be foldable, set the parentId to 0.
Example: 

[QUOTE]CopyMap 1 "Copied Map" 5 1[/QUOTE]



Note: If you copy a map in-game and it does not appear in your editor, it is because the editor hasn't updated its list. 
If you want to see your copied map in the editor, then feel free to close and re-open the editor.



> To delete a map you can use the following plugin command format:

[QUOTE]DeleteMap mapId[/QUOTE]

mapId - The mapID of the map you wish to delete.
Example, accessing the value stored in variable 5:

[QUOTE]DeleteMap $gameVariables.value(5)[/QUOTE]



Note: Deletion is permanent. Deleting maps should be done with extreme caution. Again, make sure you backup any maps that are important to you. 
Make sure you know what you are deleting. 
Make sure you do any necessary cleanup of your variables. 
Make sure you do not try to transfer the player to a map that no longer exists.









Troubleshooting / Feedback

Please report any bugs that you have, and how to recreate the issue. Press F8 to open console, provide that if applicable.

Feedback is welcome. Suggestions are welcome.



Credit

Sigony



License

Credit me where applicable in your derivative works.

Redistribute by linking to official pages.

Free for commercial and non-commercial use.
 */

(async function() {
    var parameters = PluginManager.parameters('SigonyMapAdditions');
    
    function SigonyMapAdditions(){
        return new Error("This is a static class");
    }

    SigonyMapAdditions.copyMapCommand = async function(args){
        const mapId = eval(args.shift());
        const mapName = eval(args.shift());
        const variable = eval(args.shift());
        const parentId = eval(args.shift());
        const destFolder = eval(args.shift());

        const newMapId = await this.copyMapFile(mapId,mapName,parentId,destFolder);
        $gameVariables.setValue(variable,newMapId)
    }

    SigonyMapAdditions.deleteMapCommand = async function(args){
        const mapId = eval(args.shift());
        const srcFolder = eval(args.shift());
        await this.deleteMapFile(mapId,srcFolder)
    }

    SigonyMapAdditions.deleteMapFile = async function(mapId,srcFolder=null){
        const mapInfos = await this.scrapeMapInfos();
        const filename = 'Map%1.json'.format(mapId.padZero(3));
        const src = srcFolder? srcFolder+filename : this._dataFolder+filename;

        const fs = require('fs');
        fs.unlinkSync(src);
        
        this.removeMapInfo(mapId);
        
        console.log(`${src} SUCCESSFULLY DELETED`)
    }

    SigonyMapAdditions.copyMapFile = async function(mapId=$gameMap.mapId(),mapName=null,parentId=0,destFolder=null){
        let mapInfos = await this.scrapeMapInfos();
        //Copy the file
        const filename = 'Map%1.json'.format(mapId.padZero(3));
        const newMapId = await this.findAvailableMapId(mapInfos);
        const newFileName = 'Map%1.json'.format(newMapId.padZero(3));
        const src = this._dataFolder+filename;
        const dest = destFolder ? destFolder+newFileName : this._dataFolder+newFileName

        const fs = require('fs');
        const { COPYFILE_EXCL } = fs.constants;
        fs.copyFile(src,dest,COPYFILE_EXCL,(error)=>{
            if(error){
                console.log(error);
                alert(error);
                return;
            }
            console.log(`${filename} COPIED SUCCESSFULLY to ${dest}`)
        });

        //Add the reference to MapInfos.json
        await SigonyMapAdditions.addMapInfo(mapInfos,newMapId,mapName,parentId);

        //Polish copied map, change display name
        const map = await SigonyMapAdditions.scrapeMap(newMapId);
        map.displayName = mapName;
        fs.writeFileSync(dest,JSON.stringify(map));


        return newMapId;
    }

    SigonyMapAdditions.removeMapInfo = async function(mapId){
        let mapInfos = await this.scrapeMapInfos()
        mapInfos = mapInfos.filter(mapInfo => {
            if(mapInfo==null){return true;}
            return mapInfo.id != mapId
        });
        const mapInfoData = JSON.stringify(mapInfos);
        const fs = require('fs');
        fs.writeFileSync(this._dataFolder+'MapInfos.json',mapInfoData);
    }

    SigonyMapAdditions.addMapInfo = async function(mapInfos,mapId,mapName=null,parentId=0){
        let mapInfo = {"id":mapId,"expanded":true,"name":mapName? mapName : "GeneratedMap"+mapId,"order":mapId,"parentId":parentId?parentId:0,"scrollX":1081.3333333333333,"scrollY":680}
        mapInfos.push(mapInfo);
        mapInfos=this.fixMapInfos(mapInfos);
        const mapInfoData = JSON.stringify(mapInfos);

        const fs = require('fs');
        fs.writeFileSync(this._dataFolder+'MapInfos.json',mapInfoData);
        
    }

    SigonyMapAdditions.fixMapInfos = function(mapInfos){
        //Sort first
        mapInfos.sort((a,b)=>{
            if(a == null){
                return -1;
            }
            if(b==null){
                return 1;
            }
            return a.id-b.id
        });
        
        //Now ensure just one null at beginning
        
        mapInfos = mapInfos.filter(info=>info);
        mapInfos.unshift(null);
        return mapInfos;
        
    }

    SigonyMapAdditions.findAvailableMapId = async function(mapInfos){
        let occupied = []
        for(info of mapInfos){
            if(info==null){
                continue
            }else{
                occupied.push(info.id)
            }
        }
        occupied.sort((a,b)=>a-b);

        let prev = occupied[0];
        for(i=1;i<occupied.length;i++){
            const o = occupied[i];
            if(o==prev+1){
                prev = o;
                continue;
            }else{
                return prev+1
            }
        }
        return prev+1;
    }

    SigonyMapAdditions.scrapeMapInfos = async function(){
        const url = 'data/MapInfos.json';
        
        const data = await fetch(url,{
            headers:{
                'Content-Type':'application/json'
            }
        }).catch(err=>{
            console.log(err);
            alert(err)
        });
        return data.json();
    }

    SigonyMapAdditions.scrapeMap = async function(mapId,folder='data/'){
        const filename = 'Map%1.json'.format(mapId.padZero(3));
        const data = await fetch(folder+filename,{headers:{
            'Content-Type':'application/json'
        }}).catch(err=>{console.log(err)});
        return data.json()

    }

    SigonyMapAdditions.createBlankMap = async function(parentId=0, folder=this._dataFolder){
        const mapInfos = await SigonyMapAdditions.scrapeMapInfos();
        const mapId = await SigonyMapAdditions.findAvailableMapId(mapInfos);
        const filename = 'Map%1.json'.format(mapId.padZero(3));
        const fs = require('fs');
        fs.writeFileSync(folder+filename,JSON.stringify(
            {
                "autoplayBgm":false,"autoplayBgs":false,"battleback1Name":"","battleback2Name":"","bgm":{"name":"","pan":0,"pitch":100,"volume":90},"bgs":{"name":"","pan":0,"pitch":100,"volume":90},"disableDashing":false,"displayName":"","encounterList":[],"encounterStep":30,"height":13,"note":"","parallaxLoopX":false,"parallaxLoopY":false,"parallaxName":"","parallaxShow":true,"parallaxSx":0,"parallaxSy":0,"scrollType":0,"specifyBattleback":false,"tilesetId":1,"width":17,
                "data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                "events":[
                ]
                }

        ));
        mapInfos.push(
            {"id":mapId,"expanded":false,"name":"GeneratedMap"+mapId,"order":mapId,"parentId":parentId,"scrollX":1092,"scrollY":604}
            );
        fs.writeFileSync(this._dataFolder+'MapInfos.json',JSON.stringify(mapInfos));
        return mapId;
    }

    SigonyMapAdditions.findDataFolder = async function(){
        try{
        const fs = require('fs');

        let data = fs.existsSync("data/");
        if(data){
            return "data/"
        }
        
        data = fs.existsSync('www/data/');
        if(data){
            return "www/data/";
        }

        //Need to add support for mac.


        return data;

        }catch(error){
            console.log(error);
            alert(error)
        }
    }

    SigonyMapAdditions.dataFolder = function(){
        return this._dataFolder;
    }

    SigonyMapAdditions._dataFolder = await SigonyMapAdditions.findDataFolder()
    
    var Sigony_MapAdditions_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		switch(command.toUpperCase()) {
            case 'COPYMAP': // PluginCommand: CopyMap mapId mapName variableForNewMapId parentId  destFolder
                SigonyMapAdditions.copyMapCommand(args);
                break;
            case 'DELETEMAP':
                SigonyMapAdditions.deleteMapCommand(args)
                break;
			default:
				Sigony_MapAdditions_Game_Interpreter_pluginCommand.call(this, command, args);
		}
    };

})();
