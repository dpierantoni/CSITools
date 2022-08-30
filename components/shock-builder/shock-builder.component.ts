import { Component, OnInit } from '@angular/core';
import * as Papa from 'papaparse';
import { Clipboard } from '@angular/cdk/clipboard';
import { IShockGraph, IShockItem } from 'src/app/interfaces/IShockBuilder';
import { NotificationService } from '../../services/notification.service'

@Component({
  selector: 'shock-builder',
  templateUrl: './shock-builder.component.html',
  styleUrls: ['./shock-builder.component.css']
})
export class ShockBuilderComponent implements OnInit {
  loadedFileName:string = '';
  displayedData:any[] = [];
  shockOptionsList:string[] = ['CC/RC', 'CO/RC', 'CA/RA'];
  colorList:string[] = ['blue', 'red', '#bcbd22'];
  shockOptionsCopyDict:any = {};
  graph:IShockGraph = {
    data: [
      {
        x: [0],
        y: [0],
        type: 'scattergl',
        name: '',
        mode: 'lines+markers',
        marker: {
          size: 2
        },
        line: {
          width: 2
        }
      }
    ],
    layout: 
      {autosize: true, showlegend: true, legend: {x: .2, y: -.2, "orientation": "h"}, 
      title: 'Travel vs Load',
      xaxis: {title: 'Travel (in)', automargin: true, zeroline: false, showline: true, range: [0, 9], dtick: 1},
      yaxis: {title: 'Load (lbf)', zeroline: false, showline: true},
      margin: {
        l: 70,
        r: 50,
        b: 50,
        t: 50,
        pad: 0
      },
    },
  }

  constructor(private clipboard: Clipboard, private notificationService: NotificationService) { }

  ngOnInit(): void {
  }

  public copyShockData(i:number){
    let shockDataCopy = this.shockOptionsCopyDict[this.shockOptionsList[i]];
    let string = '';
    shockDataCopy.forEach((item:any) => {
      let subString = item['vel'].toString() + '\t' + item['force'].toString() + '\r';
      string = string + subString;
    });
    this.clipboard.copy(string);
    this.notificationService.openSnackBar(this.shockOptionsList[i] + ' Shock Data Copied to Clipboard')
  }

  public  async fileChangeListener(files: any) {
    let file = files.target.files[0];
    this.loadedFileName = file.name;
    if (file) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (result) => {
          let returnedData:any =  await this.parseCSVFiletoXY(result.data);
          this.plotData(returnedData);
        }
          });
    } else {
      alert('Problem loading CSV file');
    }
  }

  public async parseCSVFiletoXY(data:any[]){
    let indexStart:number = 0;
    let headerList:string[] = [];
    let dataDict:any = {};
    data.forEach((item:any, index:number) => {
      if (item[0] === 'Velocity'){
        indexStart = index + 2;
        for (let i = 1; i < item.length; i++){
          let header = item[i].substring(1);
          headerList.push(header); 
          dataDict[header] = {};
        }
      }
    });

    for (let i = indexStart; i <= data.length - 1; i++){
      data[i].forEach((element:string, index:number) => {
        if (index > 0){
          let key = headerList[ index - 1 ];
          let key2 = +data[i][0];
          dataDict[key][key2] = +element;
        } 
      });
    }
      // create list of objects with 3 distict choices CC / RC, CO / RC, CA / RA  [ { vel:   , CCRC:  , ect } ]
    // let shockOptionsList:string[] = ['CC/RC', 'CO/RC', 'CA/RA'];
    // let colorList:string[] = ['blue', 'red', 'green'];
    let shockOptionsDict:any = {};
    this.shockOptionsCopyDict = {};
    this.shockOptionsList.forEach((item:string) => {
      shockOptionsDict[item] = [];
      this.shockOptionsCopyDict[item] = [];
    });

    // add rebound side of curves from 1 to 9 in/sec
    for ( let vel = 11 ; vel > 0 ; vel--) {
      this.shockOptionsList.forEach((option:string) => {
        let rebound:string = option.substr(-2)
        if (dataDict[rebound][vel] !== undefined){
          let force:number = dataDict[rebound][vel]
          shockOptionsDict[option].push({vel: vel, force: force});
          this.shockOptionsCopyDict[option].push({vel: vel * -1, force: force});
        }
      });
    }

    // add compression side of curves from 0 to 9 in/sec
    for ( let vel = 0 ; vel < 11; vel++ ) {
      this.shockOptionsList.forEach((option:string) => {
        let compression:string = option.substring(0, 2)
        if (dataDict[compression][vel] !== undefined){
          let force = dataDict[compression][vel]
          shockOptionsDict[option].push({vel: vel, force: force});
          this.shockOptionsCopyDict[option].push({vel: vel, force: force});
        }
      });
    }
    
    return shockOptionsDict
  }

  public plotData(returnedData:any){
    let plotDataList: any = [];
    let graphXMax:number = 0;
    let data = returnedData;
    for (let i = 0; i < this.shockOptionsList.length; i++){
      let shockType = data[this.shockOptionsList[i]];
      let xArray:number[] = [];
      let yArray:number[] = [];
      shockType.forEach((item:IShockItem) => {
        xArray.push(item.vel);
        yArray.push(item.force);
      });
      let localXMax:number = Math.max(...xArray);
      if (localXMax > graphXMax){graphXMax = localXMax};
      let plotObj:any = {
        x: xArray,
        y: yArray,
        name: this.shockOptionsList[i],
        mode: 'lines+markers',
        marker: {
          color: this.colorList[i],
          size: 6
        },
        line: {
          color: this.colorList[i],
          width: 2
        }
      }
      plotDataList.push(plotObj)
    }; 
    
    this.graph = {
      data: plotDataList,
      layout: 
        {autosize: true, showlegend: true, legend: {x: .43, y: -.2, "orientation": "h"},
        title: 'Force vs Velocity',
        xaxis: {title: 'Velocity (in / sec)', automargin: true, zeroline: false, showline: true, range:[0, graphXMax + .1], dtick: 1},
        yaxis: {title: 'Force (lbf)', zeroline: false, showline: true},
        margin: {
          l: 70,
          r: 50,
          b: 50,
          t: 50,
          pad: 0
        }
      }
    };
  }

}
