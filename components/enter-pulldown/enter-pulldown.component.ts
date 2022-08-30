import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import * as regression from 'regression';

import { NotificationService } from '../../services/notification.service'
import { MatRadioChange } from '@angular/material/radio';

interface IxyGraph {
  'x': number,
  'y': number
}

interface IplotlyGraph {
  x:number[],
  y:number[],
  type:string,
  name: string,
  mode:string,
  marker:{
    color:string,
    size:number
  }, 
  line:{
    color:string,
    width:number
  }
}


@Component({
  selector: 'enter-pulldown',
  templateUrl: './enter-pulldown.component.html',
  styleUrls: ['./enter-pulldown.component.css']
})
export class EnterPulldownComponent implements OnInit {

  fileSingleTitleLF:string = '';
  fileSingleTitleRF:string = '';

  lfShockChannelName:string = '';
  lfLoadChannelName:string = '';
  rfShockChannelName:string = '';
  rfLoadChannelName:string = '';
  lfTrimStart:number = 0;
  rfTrimStart:number = 0;
  fileTypeSelect: string = 'single';
  pulldownDataPersist: {'LF Shock Travel': number, 'LF Wheel Load': number, 'RF Shock Travel': number, 'RF Wheel Load': number}[]= [];
  side:string|undefined = undefined;
  lfFullPersist:IxyGraph[] = [];
  lfTopPersist:IxyGraph[] = []
  lfBottomPersist:IxyGraph[] = [];
  lfCopiedData:IxyGraph[] = [];
  lfTopMod:IxyGraph[] = []
  lfBottomMod:IxyGraph[] = [];
  
  rfFullPersist:IxyGraph[] = [];
  rfTopPersist:IxyGraph[] = []
  rfBottomPersist:IxyGraph[] = [];
  rfCopiedData:IxyGraph[] = [];
  rfTopMod:IxyGraph[] = []
  rfBottomMod:IxyGraph[] = [];

  lfSide:string|undefined = undefined;
  lfOffsetValue:number = 0;
  lfOffsetFactor:number = 0;
  lfCurveSelect:string|undefined = undefined;

  rfSide:string|undefined = undefined;
  rfOffsetValue:number = 0;
  rfOffsetFactor:number = 0;
  rfCurveSelect:string|undefined = undefined;
  
  lfGraph = {
    data: [
      {
        x: [0],
        y: [0],
        type: 'scattergl',
        name: '',
        mode: 'lines+markers',
        marker: {
          color: 'blue',
          size: 2
        },
        line: {
          color: 'blue',
          width: 2
        }
      }
    ],
    layout: 
      {autosize: true, showlegend: true, legend: {x: .2, y: -.2, "orientation": "h"}, 
      title: 'LF Shock vs LF Load',
      xaxis: {title: 'LF Shock Travel (in)', automargin: true, zeroline: false, showline: true, range: [0, 5]},
      yaxis: {title: 'LF Load (lbf)', zeroline: false, showline: true},
      margin: {
        l: 70,
        r: 50,
        b: 50,
        t: 50,
        pad: 0
      },
    },
  }
  rfGraph = {
    data: [{
      x: [0],
      y: [0],
      type: 'scattergl',
      name: '',
      mode: 'lines+markers',
      marker: {
        color: 'blue',
        size: 2
      },
      line: {
        color: 'blue',
        width: 2
      }
    }],
    layout: {
      autosize: true, showlegend: true, legend: {x: .2, y: -.2, "orientation": "h"},
      title: 'RF Shock vs RF Load',
      xaxis: {title: 'RF Shock Travel (in)', zeroline: false, showline: true, range: [0, 5]},
      yaxis: {title: 'RF Load (lbf)', zeroline: false, showline: true},
      margin: {
        l: 70,
        r: 50,
        b: 50,
        t: 50,
        pad: 0
      },
    }
  };

  constructor(private clipboard: Clipboard, private notificationService: NotificationService) { }

  ngOnInit(): void {
  }

  radialChange(event:MatRadioChange){
    this.pulldownDataPersist = [];
    this.lfCurveSelect = 'none'
    this.rfCurveSelect = 'none'
    this.fileSingleTitleLF = '';
    this.fileSingleTitleRF = '';
    this.plotLFPulldownData([])
    this.plotRFPulldownData([])
  }

  public lfFileChangeListener(files:any){
    let file = files.target.files[0];
    if (file) {
      let data1: string[] = [];
      let fileSingleTitleLF:string = '';
      const reader= new FileReader
      reader.readAsText(file)
      reader.onload = function () {
        if(reader.result){
            let fileString = reader.result as string;
            let lines: string[] = fileString.split('\n')
            for (let i = 10; i < lines.length; i++){
              data1.push(lines[i])
            }
            // get file name for title
            let titlestring = lines[3];
            let titleStart = titlestring.substring(0, lines[3].length - 1);
            let titleEnd = titleStart.substring(8);
            fileSingleTitleLF = titleEnd;
        }
      }
      reader.onloadend = () => this.parseLFFileString(data1, fileSingleTitleLF);
    }
  }

  public rfFileChangeListener(files:any){
    let file = files.target.files[0];
    if (file) {
      let data1: string[] = [];
      let fileSingleTitleRF:string = '';
      const reader= new FileReader
      reader.readAsText(file)
      reader.onload = function () {
        if(reader.result){
            let fileString = reader.result as string;
            let lines: string[] = fileString.split('\n')
            for (let i = 10; i < lines.length; i++){
              data1.push(lines[i])
            }
            // get file name for title
            let titlestring = lines[3];
            let titleStart = titlestring.substring(0, lines[3].length - 1);
            let titleEnd = titleStart.substring(8);
            fileSingleTitleRF = titleEnd;
        }
      }
      reader.onloadend = () => this.parseRFFileString(data1, fileSingleTitleRF);
    }
  }

  public singleFileChangeListener(files:any){
    let file = files.target.files[0];
    if (file) {
      let data1: string[] = [];
      let fileSingleTitle:string = '';
      const reader= new FileReader
      reader.readAsText(file)
      reader.onload = function () {
        if(reader.result){
            let fileString = reader.result as string;
            let lines: string[] = fileString.split('\n')
            for (let i = 10; i < lines.length; i++){
              data1.push(lines[i])
            }
            // get file name for title
            let titlestring = lines[3];
            let titleStart = titlestring.substring(0, lines[3].length - 1);
            let titleEnd = titleStart.substring(8);
            fileSingleTitle = titleEnd;
        }
      }
      reader.onloadend = () => this.parseSingleFileString(data1, fileSingleTitle);
    }
    
  }

  public async parseLFFileString(data1:any[], fileSingleTitleLF:string){
    //create titles for LF graph
    this.fileSingleTitleLF = fileSingleTitleLF;
    //Takes read text and get list of keys or headers from pulldown file
    let keyList = data1[0];
    let keyList2 = keyList.substring(0, keyList.length - 1);
    let keyList3 = keyList2.split('\t').join(',');
    let keys = keyList3.split(',');
    let usedChannelsDict: any = {}
    let usedChannelsIndexList: number[] = [];
    let usedChannels: string[] = ['LF Shock Travel', 'Damper_Disp_LF', 'LF Wheel Load', 'Wheel_Load_Vert_LF'];
    keys.forEach((item: string, index:number) => {
      if (usedChannels.includes(item)) {
        let key = index
        usedChannelsDict[key] = item;
        usedChannelsIndexList.push(index);
      }
    });

    let defineNames:string = await this.defineChannelNames(usedChannelsDict);

    //create clean dataset of numbers
    data1.splice(0, 1)
    let numberData1:number[][] = [];
    data1.forEach((item:string) => {
      let item2 = item.substring(0, item.length - 1);
      let item3 = item2.split('\t').join(',');
      let item4 = item3.split(',');
      let elementList: number[] = [];
      item4.forEach((element:string) => {
        elementList.push(+element);
      });
      numberData1.push(elementList);
    });

    //Pull header columns for RRS VES (shock & Load)
    let lfData:any[] = [];
    numberData1.forEach((item:number[]) => {
      let dataObj: any = {};
      item.forEach((element:number, index:number) => {
        if (usedChannelsIndexList.includes(index)){
          let channelKey: string = usedChannelsDict[index];
          let value:number = item[index];
          dataObj[channelKey] = value;
        }
      });
      lfData.push(dataObj);
    });
    
    
    this.lfFullPersist = await this.createLFFullPersist(lfData);
    //Find Max Value of Dataset
    let xArr:number[] = [];
    this.lfFullPersist.forEach((item:IxyGraph) => {
      xArr.push(item.x)
    })
    let lfXMax:number = Math.max(...xArr)

    //Top Data Set
    this.lfTopPersist = this.solveTopCurve(this.lfFullPersist, lfXMax);
    // this.lfTopMod = this.lfTopPersist;
    //Bottom Data Set
    this.lfBottomPersist = this.solveBottomCurve(this.lfFullPersist, lfXMax);
    this.onTopCurveSelect('LF')
    // this.lfCurveSelect = 'full';
    // this.plotLFPulldownData(this.lfFullPersist);
  }
  
  public async parseRFFileString(data1:any[], fileSingleTitleRF:string){
    //create titles for RF graph
    this.fileSingleTitleRF = fileSingleTitleRF;
    //Takes read text and get list of keys or headers from pulldown file
    let keyList = data1[0];
    let keyList2 = keyList.substring(0, keyList.length - 1);
    let keyList3 = keyList2.split('\t').join(',');
    let keys = keyList3.split(',');
    let usedChannelsDict: any = {}
    let usedChannelsIndexList: number[] = [];
    let usedChannels: string[] = ['RF Shock Travel', 'Damper_Disp_RF', 'RF Wheel Load', 'Wheel_Load_Vert_RF'];
    keys.forEach((item: string, index:number) => {
      if (usedChannels.includes(item)) {
        let key = index
        usedChannelsDict[key] = item;
        usedChannelsIndexList.push(index);
      }
    });

    let defineNames:string = await this.defineChannelNames(usedChannelsDict);
    
    //create clean dataset of numbers
    data1.splice(0, 1)
    let numberData1:number[][] = [];
    data1.forEach((item:string) => {
      let item2 = item.substring(0, item.length - 1);
      let item3 = item2.split('\t').join(',');
      let item4 = item3.split(',');
      let elementList: number[] = [];
      item4.forEach((element:string) => {
        elementList.push(+element);
      });
      numberData1.push(elementList);
    });

    //Pull header columns for RRS VES (shock & Load)
    let rfData:any[] = [];
    numberData1.forEach((item:number[]) => {
      let dataObj: any = {};
      item.forEach((element:number, index:number) => {
        if (usedChannelsIndexList.includes(index)){
          let channelKey: string = usedChannelsDict[index];
          let value:number = item[index];
          dataObj[channelKey] = value;
        }
      });
      rfData.push(dataObj);
    });
    
    
    this.rfFullPersist = await this.createRFFullPersist(rfData);
    
    //Find Max Value of Dataset
    let xArr:number[] = [];
    this.rfFullPersist.forEach((item:IxyGraph) => {
      xArr.push(item.x)
    })
    let rfXMax:number = Math.max(...xArr)

    //Top Data Set
    this.rfTopPersist = this.solveTopCurve(this.rfFullPersist, rfXMax);
    // this.lfTopMod = this.lfTopPersist;

    //Bottom Data Set
    this.rfBottomPersist = this.solveBottomCurve(this.rfFullPersist, rfXMax);
    this.onTopCurveSelect('RF')
    // this.rfCurveSelect = 'full';
    // this.plotRFPulldownData(this.rfFullPersist);
  }

  public async defineChannelNames(usedChannelsDict:any){

    usedChannelsDict = Object.values(usedChannelsDict)
    //Define LF Shock Channel Name
    if (usedChannelsDict.includes('LF Shock Travel')) { this.lfShockChannelName = 'LF Shock Travel' }
    if (usedChannelsDict.includes('Damper_Disp_LF')) { this.lfShockChannelName = 'Damper_Disp_LF' }
    //Define LF Load
    if (usedChannelsDict.includes('LF Wheel Load')) { this.lfLoadChannelName = 'LF Wheel Load' }
    if (usedChannelsDict.includes('Wheel_Load_Vert_LF')) { this.lfLoadChannelName = 'Wheel_Load_Vert_LF' }
    //Define RF Shock Channel Name
    if (usedChannelsDict.includes('RF Shock Travel')) { this.rfShockChannelName = 'RF Shock Travel' }
    if (usedChannelsDict.includes('Damper_Disp_RF')) { this.rfShockChannelName = 'Damper_Disp_RF' }
     //Define RF Load
     if (usedChannelsDict.includes('RF Wheel Load')) { this.rfLoadChannelName = 'RF Wheel Load' }
     if (usedChannelsDict.includes('Wheel_Load_Vert_RF')) { this.rfLoadChannelName = 'Wheel_Load_Vert_RF' }

    return 'success'
  }

  public async parseSingleFileString(data1:any[], fileSingleTitle:string){
    //create titles for graphs
    this.fileSingleTitleLF = fileSingleTitle;
    this.fileSingleTitleRF = fileSingleTitle;
    //Takes read text and get list of keys or headers from pulldown file
    let keyList = data1[0];
    let keyList2 = keyList.substring(0, keyList.length - 1);
    let keyList3 = keyList2.split('\t').join(',');
    let keys = keyList3.split(',');
    let usedChannelsDict: any = {}
    let usedChannelsIndexList: number[] = [];
    let usedChannels: string[] = ['LF Shock Travel', 'Damper_Disp_LF', 'LF Wheel Load', 'Wheel_Load_Vert_LF', 
    'RF Shock Travel', 'Damper_Disp_RF', 'RF Wheel Load', 'Wheel_Load_Vert_RF'];
    keys.forEach((item: string, index:number) => {
      if (usedChannels.includes(item)) {
        let key = index
        usedChannelsDict[key] = item;
        usedChannelsIndexList.push(index);
      }
    });

    let defineNames:string = await this.defineChannelNames(usedChannelsDict);

    //create clean dataset of numbers
    data1.splice(0, 1)
    let numberData1:number[][] = [];
    data1.forEach((item:string) => {
      let item2 = item.substring(0, item.length - 1);
      let item3 = item2.split('\t').join(',');
      let item4 = item3.split(',');
      let elementList: number[] = [];
      item4.forEach((element:string) => {
        elementList.push(+element);
      });
      numberData1.push(elementList);
    });
    
    //Pull header columns for RRS VES (shock & Load)
    this.pulldownDataPersist = [];
    numberData1.forEach((item:number[]) => {
      let dataObj: any = {};
      item.forEach((element:number, index:number) => {
        if (usedChannelsIndexList.includes(index)){
          let channelKey: string = usedChannelsDict[index];
          let value:number = item[index];
          dataObj[channelKey] = value;
        }
      });
      this.pulldownDataPersist.push(dataObj);
    });
    //create function to check for increasing x values then call this.plotPulldownData
    this.separateLFRFData();
  }
  
  public solveTopCurve(fullData:IxyGraph[], xMax:number){
    let topCurveData: IxyGraph[] = [];
    for (let i = 0; i < fullData.length; i++) {
      if (fullData[i].x > 0) {
        let obj:IxyGraph = {'x': fullData[i].x, 'y': fullData[i].y};
        topCurveData.push(obj);
        if (fullData[i].x === xMax) break;
      }
    }
    
    return topCurveData;
  }

  public solveBottomCurve(fullData:IxyGraph[], xMax:number){
    let bottomCurveData: IxyGraph[] = [];
    for (let i = fullData.length - 1; i >= 0; i--) {
      if (fullData[i].x > 0) {
        let obj:IxyGraph = {'x': fullData[i].x, 'y': fullData[i].y};
        bottomCurveData.push(obj);
        if (fullData[i].x === xMax) break;
      }
    }
    
    return bottomCurveData;
  }

  public async createLFFullPersist(data:any[]){
    //Full Data Set
    let dataNew:any[] = [];
    data.forEach((item:any) => {
      let obj: IxyGraph = {'x': item[this.lfShockChannelName], 'y':item[this.lfLoadChannelName]};
      if (obj.x !== undefined || obj.y !== undefined) {
        dataNew.push(obj);
      }
    });

    return dataNew;
  }

  public async createRFFullPersist(data:any[]){
    //Full Data Set
    let dataNew:any[] = [];
    data.forEach((item:any) => {
      let obj: IxyGraph = {'x': item[this.rfShockChannelName], 'y':item[this.rfLoadChannelName]};
      if (obj.x !== undefined || obj.y !== undefined) {
        dataNew.push(obj);
      }
    });

    return dataNew;
  }

  public async separateLFRFData(){
    let testObj: any = this.pulldownDataPersist[0];
    let testObjList: string[] = Object.keys(testObj);
    if (testObjList.includes('LF Shock Travel') || testObjList.includes('LF Wheel Load') || 
    testObjList.includes('Damper_Disp_LF') || testObjList.includes('Wheel_Load_Vert_LF')){
      this.lfFullPersist = [];
      this.lfTopPersist = [];
      this.lfBottomPersist = [];

      //Full Data Set
      this.lfFullPersist = await this.createLFFullPersist(this.pulldownDataPersist);

      //Find Max Value of Dataset
      let xArr:number[] = [];
      this.lfFullPersist.forEach((item:IxyGraph) => {
        xArr.push(item.x)
      })
      let lfXMax:number = Math.max(...xArr)
      //Top Data Set
      this.lfTopPersist = this.solveTopCurve(this.lfFullPersist, lfXMax);
      // this.lfTopMod = this.lfTopPersist;

      //Bottom Data Set
      this.lfBottomPersist = this.solveBottomCurve(this.lfFullPersist, lfXMax);
      // this.lfBottomMod = this.lfBottomPersist;
    }
    
    if (testObjList.includes('RF Shock Travel') || testObjList.includes('RF Wheel Load') || 
    testObjList.includes('Damper_Disp_RF') || testObjList.includes('Wheel_Load_Vert_RF')){
      this.rfFullPersist = [];
      this.rfTopPersist = [];
      this.rfBottomPersist = [];

      //Full Data Set
      this.rfFullPersist = await this.createRFFullPersist(this.pulldownDataPersist);
      
      //Find Max Value of Dataset
      let xArr:number[] = [];
      this.rfFullPersist.forEach((item:IxyGraph) => {
        xArr.push(item.x)
      })
      let rfXMax:number = Math.max(...xArr)
      //Top Data Set
      this.rfTopPersist = this.solveTopCurve(this.rfFullPersist, rfXMax);
      // this.rfTopMod = this.rfTopPersist;

      //Bottom Data Set
      this.rfBottomPersist = this.solveBottomCurve(this.rfFullPersist, rfXMax);
      // this.rfBottomMod = this.rfBottomPersist;
    }

    this.onTopCurveSelect('LF')
    this.onTopCurveSelect('RF')

    // this.plotLFPulldownData(this.lfFullPersist);
    // this.plotRFPulldownData(this.rfFullPersist);
  }

  public onOffset(event:any, side:string){
    let offset = +event.target.value;
    if (offset <= 0){return}
    if (side === 'LF') {
      this.lfCurveSelect = 'top'
      this.lfOffsetValue = offset;
      switch(this.lfCurveSelect){
        case 'top':
          this.onTopCurveSelect(side = 'LF')
          break
        case 'bottom':
          this.onBottomCurveSelect(side = 'LF')
          break
        case 'copied':
          this.lfCurveSelect = 'full'
          this.plotLFPulldownData(this.lfFullPersist);
      }
    }
    if (side === 'RF') {
      this.rfCurveSelect = 'top'
      this.rfOffsetValue = offset;
      switch(this.rfCurveSelect){
        case 'top':
          this.onTopCurveSelect(side = 'RF')
          break
        case 'bottom':
          this.onBottomCurveSelect(side = 'RF')
          break
        case 'copied':
          this.rfCurveSelect = 'full'
          this.plotRFPulldownData(this.rfFullPersist);
      }
    }
  }
  
  public fitBotData(data:IxyGraph[], trimStartVar:number){
    const regression = require('regression');
    let polyFitData: number[][] = [];
    let fitData: IxyGraph[] = [];
    //Define start of trim if defined
    let trimStart:number = .2;
    if (trimStartVar > 0) {trimStart = trimStartVar}
    //find value greater that 1in shock travel and get index
    for (let i = 0; i < data.length; i++){
      if (data[i].x > trimStart) { polyFitData.push([data[i].x, data[i].y]) }; 
      if (data[i].x > 1) { break };
    }
    const result = regression.polynomial(polyFitData, { order: 2 });
    //always add zero to the returned data
    let predictVals:number[] = result.predict(0);
    fitData.push({x: predictVals[0], y:predictVals[1]})
    // if the trim value is greater than .05 add more points in the returned data
    let count:number = .05;
    for (let i = 0 ; i < 100 ; i++) {
      if (count < trimStartVar) {
        let predictObj:number[] = result.predict(count);
        fitData.push({x: predictObj[0], y:predictObj[1]});
        count = count + .05;
      }
    }

    return { fitData, predictVals, trimStart }
  }
  
  public offset(data:IxyGraph[], setupWeight:number, side:string, trimStartVar:number, fitObj:{fitData: IxyGraph[], predictVals:number[]}){
    
    let offsetFactor:number;
    let trimStart:number = -.1;
    if (trimStartVar > 0) {trimStart = trimStartVar}
    let predictedY:number = fitObj.predictVals[1]
    if (setupWeight === 0){offsetFactor = 0} else {offsetFactor = setupWeight - predictedY;}
    switch(side){
      case 'LF':
        this.lfOffsetFactor = offsetFactor;
        break
      case 'RF':
        this.rfOffsetFactor = offsetFactor;
        break
    }
    let offsetData: IxyGraph[] = [];
    let x:number;
    let y:number;
    data.forEach((item:IxyGraph) => {
      if (item.x > trimStart) {
        x = item.x;
        y = item.y  + offsetFactor;
        offsetData.push({x: x, y: y})
      }
    });
    for (let i = fitObj.fitData.length - 1; i >= 0 ; i--){
      offsetData.unshift( { x: fitObj.fitData[i].x, y: fitObj.fitData[i].y + offsetFactor} )
    }
    return offsetData
  }

  public onBottomCurveSelect(side:string) {
    if (side === 'LF') {
      this.lfCurveSelect = 'bottom';
      if (this.rfCurveSelect === 'copied') {
        this.rfCurveSelect = 'full';
        this.plotRFPulldownData(this.rfFullPersist);
      } else {
        let fitObj:{fitData:IxyGraph[], predictVals:number[]} = this.fitBotData(this.lfBottomPersist, this.lfTrimStart)
        this.lfBottomMod = this.offset(this.lfBottomPersist, this.lfOffsetValue, side, this.lfTrimStart, fitObj);
      } 
    this.plotLFPulldownData(this.lfBottomMod);
    }
    if (side === 'RF') {
      this.rfCurveSelect = 'bottom';
      if (this.lfCurveSelect === 'copied') {
        this.lfCurveSelect = 'full';
        this.plotLFPulldownData(this.lfFullPersist);
      } else {
        let fitObj:{fitData:IxyGraph[], predictVals:number[]} = this.fitBotData(this.rfBottomPersist, this.rfTrimStart)
        this.rfBottomMod = this.offset(this.rfBottomPersist, this.rfOffsetValue, side, this.rfTrimStart, fitObj);
      } 
    }
    this.plotRFPulldownData(this.rfBottomMod);
    
  }

  public onTopCurveSelect(side:string) {
    if (side === 'LF') {
      this.lfCurveSelect = 'top';
      if (this.rfCurveSelect === 'copied') {
        this.rfCurveSelect = 'full';
        this.plotRFPulldownData(this.rfFullPersist);
      } else {
        let fitObj:{fitData:IxyGraph[], predictVals:number[]} = this.fitBotData(this.lfTopPersist, this.lfTrimStart)
        this.lfTopMod = this.offset(this.lfTopPersist, this.lfOffsetValue, side, this.lfTrimStart, fitObj);
      }
      this.plotLFPulldownData(this.lfTopMod);
    }
    if (side === 'RF') {
      this.rfCurveSelect = 'top';
      if (this.lfCurveSelect === 'copied') {
        this.lfCurveSelect = 'full';
        this.plotLFPulldownData(this.lfFullPersist);
      } else {
        let fitObj:{fitData:IxyGraph[], predictVals:number[]} = this.fitBotData(this.rfTopPersist, this.rfTrimStart)
        this.rfTopMod = this.offset(this.rfTopPersist, this.rfOffsetValue, side, this.rfTrimStart, fitObj);
      }
      this.plotRFPulldownData(this.rfTopMod);
    }
  }

  public plotLFPulldownData(plotData:IxyGraph[]) {

    // create full persist dataset no matter selection
    let lfXMin: number = 0;
    let lfXMax: number = 0;
    let lfXPersist:number[] = [];
    let lfYPersist:number[] = [];
    this.lfFullPersist.forEach((item:IxyGraph) => {
      if (item.x !== undefined || item.y !== undefined) {
        lfXPersist.push(item.x);
        lfYPersist.push(item.y);
      }
    });
    lfXMin = Math.min(...lfXPersist) - .1;
    lfXMax = Math.max(...lfXPersist) + .1;
    
    let dataList:IplotlyGraph[] = []
    if (this.lfCurveSelect === 'full'){
      dataList = [
        {
          x: lfXPersist,
          y: lfYPersist,
          type: 'scattergl',
          name: 'Pulldown Data',
          mode: 'markers',
          marker: {
            color: 'blue',
            size: 3
          },
          line: {
            color: 'blue',
            width: 2
          }
        }
      ]
    }
    if (this.lfCurveSelect === 'top' || this.lfCurveSelect === 'bottom' || this.lfCurveSelect === 'copied'){
      let lfx:number[] = [];
      let lfy:number[] = [];
      plotData.forEach((item:IxyGraph) => {
        if (item.x !== undefined || item.y !== undefined) {
          lfx.push(item.x);
          lfy.push(item.y);
        }
      });
      let altColor:string = '';
      let altName:string = '';
      if (this.lfCurveSelect === 'copied') { 
        altColor = 'black' 
        altName = 'Copied Data'
      } else { 
        altColor = 'red'
        altName = 'Selected Data'
      }
      dataList = [
        {
          x: lfXPersist,
          y: lfYPersist,
          type: 'scattergl',
          name: 'Pulldown Data',
          mode: 'markers',
          marker: {
            color: 'blue',
            size: 3
          },
          line: {
            color: 'blue',
            width: 2
          }
        },
        {
          x: lfx,
          y: lfy,
          type: 'scattergl',
          name: altName,
          mode: 'lines+markers',
          marker: {
            color: altColor,
            size: 3
          },
          line: {
            color: altColor,
            width: 3
          }
        }
      ]
    }
    if (this.lfCurveSelect === 'none'){
      dataList = [
        {
          x: [],
          y: [],
          type: 'scattergl',
          name: 'Pulldown Data',
          mode: 'markers',
          marker: {
            color: 'blue',
            size: 3
          },
          line: {
            color: 'blue',
            width: 2
          }
        }
      ]
    }
    
      
    this.lfGraph = this.lfGraph = {
      data: dataList,
      layout: 
        {autosize: true, showlegend: true, legend: {x: .28, y: -.2, "orientation": "h"}, 
        title: 'LF Load vs LF Shock Travel',
        xaxis: {title: 'LF Shock Travel (in)', automargin: true, zeroline: false, showline: true, range: [lfXMin, lfXMax]},
        yaxis: {title: 'LF Load (lbf)', zeroline: false, showline: true},
        margin: {
          l: 70,
          r: 50,
          b: 50,
          t: 50,
          pad: 0
        }
      }
    };
    //Call table to copy to RRS
   }
  
  public solveLFIndexedBottomData(length:number, data:IxyGraph[]){
    let indexedLongData:any[]=[];
    let count:number;
    
    /// Data points from mod dataset to 1 are used for the beginning of the curve
    for (let i = 0; i <= data.length - 1; i++) {
      if (data[i].x >= 1) { break };
        indexedLongData.push(data[i]);
    }
    
    count = indexedLongData.length -1;
    /// Data points from persisted data set  after 1" with offset applied to y
    for (let i = this.lfFullPersist.length - 1; i >= 0; i--) {
      if (this.lfFullPersist[i].x > 1 && count <= length){
        let obj:IxyGraph = {x: this.lfFullPersist[i].x, y: this.lfFullPersist[i].y + this.lfOffsetFactor};
        indexedLongData.push(obj);
        count = count + 1;
      }
    }

    return indexedLongData;
  }

  public solveLFIndexedTopData(length:number, data:IxyGraph[]){
    let indexedLongData:any[]=[];
    let count:number;
    
    /// Data points from mod dataset to 1 are used for the beginning of the curve
    for (let i = 0; i <= data.length - 1; i++) {
      if (data[i].x >= 1 ) { break };
      indexedLongData.push(data[i]);
    }

    count = indexedLongData.length -1;
    /// Data points from persisted data set  after 1" with offset applied to y
    for (let i = 0; i <= this.lfFullPersist.length - 1; i++) {
      if (this.lfFullPersist[i].x > 1 && count <= length){
        let obj:IxyGraph = {x: this.lfFullPersist[i].x, y: this.lfFullPersist[i].y + this.lfOffsetFactor};
        indexedLongData.push(obj);
        count = count + 1;
      }
    }

    return indexedLongData;
  }

  public solveRFIndexedBottomData(length:number, data:IxyGraph[]){
    let indexedLongData:any[]=[];
    let count:number;
    
    /// Data points from mod dataset to 1 are used for the beginning of the curve
    for (let i = 0; i <= data.length - 1; i++) {
      if (data[i].x >= 1) { break };
        indexedLongData.push(data[i]);
    }
    
    count = indexedLongData.length -1;
    /// Data points from persisted data set  after 1" with offset applied to y
    for (let i = this.rfFullPersist.length - 1; i >= 0; i--) {
      if (this.rfFullPersist[i].x > 1 && count <= length){
        let obj:IxyGraph = {x: this.rfFullPersist[i].x, y: this.rfFullPersist[i].y + this.rfOffsetFactor};
        indexedLongData.push(obj);
        count = count + 1;
      }
    }

    return indexedLongData;
  }

  public solveRFIndexedTopData(length:number, data:IxyGraph[]){
    let indexedLongData:any[]=[];
    let count:number;

    /// Data points from mod dataset to 1 are used for the beginning of the curve
    for (let i = 0; i <= data.length - 1; i++) {
      if (data[i].x >= 1 ) { break };
      indexedLongData.push(data[i]);
    }

    count = indexedLongData.length -1;
    /// Data points from persisted data set  after 1" with offset applied to y
    for (let i = 0; i <= this.rfFullPersist.length - 1; i++) {
      if (this.rfFullPersist[i].x > 1 && count <= length){
        let obj:IxyGraph = {x: this.rfFullPersist[i].x, y: this.rfFullPersist[i].y + this.rfOffsetFactor};
        indexedLongData.push(obj);
        count = count + 1;
      }
    }

    return indexedLongData;
  }

  public async copyRSSDataToClip(){
    if (this.lfCurveSelect === 'full' || this.rfCurveSelect == 'full'){
      alert('Select a Top and Bottom from each side') 
      return
    };
    let lfData:IxyGraph[] = [];
    let rfData:IxyGraph[] = [];
    let indexedLongData: IxyGraph[] = [];
    let combinedData:any[] = [];

    switch(this.lfCurveSelect){
        case 'top':
          lfData = this.lfTopMod;
          break;
        case 'bottom':
          lfData = this.lfBottomMod;
          break;
    }
    switch(this.rfCurveSelect){
      case 'top':
        rfData = this.rfTopMod;
        break;
      case 'bottom':
        rfData = this.rfBottomMod;
        break;
    }
    if (lfData.length > rfData.length) {
      switch(this.rfCurveSelect) {
        case 'bottom':
          indexedLongData = this.solveRFIndexedBottomData(lfData.length, rfData);
          break;
        case 'top':
          indexedLongData = this.solveRFIndexedTopData(lfData.length, rfData);
          break;
      }
      this.lfCurveSelect = 'copied'
      this.plotLFPulldownData(lfData);
      this.rfCurveSelect = 'copied'
      this.plotRFPulldownData(indexedLongData)
      for (let i = 0; i < lfData.length; i++) {
        let obj:{} = {'LF Shock Travel': lfData[i].x, 'LF Wheel Load': lfData[i].y, 'RF Shock Travel': indexedLongData[i].x, 'RF Wheel Load': indexedLongData[i].y}
        combinedData.push(obj);
      }
    }

    if (rfData.length > lfData.length) {
      switch(this.lfCurveSelect) {
        case 'bottom':
          indexedLongData = this.solveLFIndexedBottomData(rfData.length, lfData);
          break;
        case 'top':
          indexedLongData = this.solveLFIndexedTopData(rfData.length, lfData);
          break;
      }
      this.rfCurveSelect = 'copied'
      this.plotRFPulldownData(rfData);
      this.lfCurveSelect = 'copied'
      this.plotLFPulldownData(indexedLongData)
      for (let i = 0; i < rfData.length; i++) {
        let obj:{} = {'LF Shock Travel': indexedLongData[i].x, 'LF Wheel Load': indexedLongData[i].y, 'RF Shock Travel': rfData[i].x, 'RF Wheel Load': rfData[i].y}
        combinedData.push(obj);
      }
    }

    if (rfData.length === lfData.length){
      try {
        for (let i = 0; i <= rfData.length -1; i++) {
          let obj:{} = {'LF Shock Travel': lfData[i].x, 'LF Wheel Load': lfData[i].y, 'RF Shock Travel': rfData[i].x, 'RF Wheel Load': rfData[i].y}
          combinedData.push(obj);
        }
        this.rfCurveSelect = 'copied'
        this.plotRFPulldownData(rfData);
        this.lfCurveSelect = 'copied'
        this.plotLFPulldownData(lfData)
      } catch (error) {
        console.log(error);
      }
    }
    
    let string = '';
    combinedData.forEach((item) => {
      let subString = item['LF Shock Travel'].toString() + '\t' + item['LF Wheel Load'].toString() + '\t' +
      item['RF Shock Travel'].toString() + '\t' + item['RF Wheel Load'].toString() +'\r';
      string = string + subString;
    });
    this.clipboard.copy(string);
    this.notificationService.openSnackBar('Pulldown Input Data Copied to Clipboard')
   }

   public plotRFPulldownData(plotData:IxyGraph[]) {
    let test = plotData
    // create full persist dataset no matter selection
    let rfXMin: number = 0;
    let rfXMax: number = 0;
    let rfXPersist:number[] = [];
    let rfYPersist:number[] = [];
    this.rfFullPersist.forEach((item:IxyGraph) => {
      if (item.x !== undefined || item.y !== undefined) {
        rfXPersist.push(item.x);
        rfYPersist.push(item.y);
      }
    });
    rfXMin = Math.min(...rfXPersist) - .1;
    rfXMax = Math.max(...rfXPersist) + .1;
    
    let dataList:IplotlyGraph[] = []
    if (this.rfCurveSelect === 'full'){
      dataList = [ {
        x: rfXPersist,
        y: rfYPersist,
        type: 'scattergl',
        name: 'Pulldown Data',
        mode: 'markers',
        marker: {
          color: 'blue',
          size: 3
        },
        line: {
          color: 'blue',
          width: 2
        }
      }]
    }
    if (this.rfCurveSelect === 'top' || this.rfCurveSelect === 'bottom' || this.rfCurveSelect === 'copied'){
      let rfx:number[] = [];
      let rfy:number[] = [];
      plotData.forEach((item:IxyGraph) => {
        if (item.x !== undefined || item.y !== undefined) {
          rfx.push(item.x);
          rfy.push(item.y);
        } 
      });
      let altColor:string = '';
      let altName:string = '';
      if (this.rfCurveSelect === 'copied') { 
        altColor = 'black' 
        altName = 'Copied Data'
      } else { 
        altColor = 'red'
        altName = 'Selected Data'
      }
      dataList = [
        {
          x: rfXPersist,
          y: rfYPersist,
          type: 'scattergl',
          name: 'Pulldown Data',
          mode: 'markers',
          marker: {
            color: 'blue',
            size: 3
          },
          line: {
            color: 'blue',
            width: 2
          }
        },
        {
          x: rfx,
          y: rfy,
          type: 'scattergl',
          name: altName,
          mode: 'lines+markers',
          marker: {
            color: altColor,
            size: 3
          },
          line: {
            color: altColor,
            width: 3
          }
        }
      ]
    }
    if (this.rfCurveSelect === 'none'){
      dataList = [
        {
          x: [],
          y: [],
          type: 'scattergl',
          name: 'Pulldown Data',
          mode: 'markers',
          marker: {
            color: 'blue',
            size: 3
          },
          line: {
            color: 'blue',
            width: 2
          }
        }
      ]
    }
      
    this.rfGraph = {
      data: dataList,
      layout: 
        {autosize: true, showlegend: true, legend: {x: .28, y: -.2, "orientation": "h"},
        title: 'RF Load vs RF Shock Travel',
        xaxis: {title: 'RF Shock Travel (in)', zeroline: false, showline: true, range: [rfXMin, rfXMax]},
        yaxis: {title: 'RF Load (lbf)', zeroline: false, showline: true},
        margin: {
          l: 70,
          r: 50,
          b: 50,
          t: 50,
          pad: 0
        }
      }
    };
    //Call table to copy to RRS
   }

   public onLFTrimStart(event:any){
    this.lfTrimStart= +event.target.value;
    switch(this.lfCurveSelect){
        case 'top':
          this.onTopCurveSelect('LF')
          break
        case 'bottom':
          this.onBottomCurveSelect('LF')
          break
        case 'copied':
          this.lfCurveSelect = 'full'
          this.plotLFPulldownData(this.lfFullPersist);
    }
  }

  public onRFTrimStart(event:any){
    this.rfTrimStart= +event.target.value;
    switch(this.rfCurveSelect){
      case 'top':
        this.onTopCurveSelect('RF')
        break
      case 'bottom':
        this.onBottomCurveSelect('RF')
        break
      case 'copied':
        this.rfCurveSelect = 'full'
        this.plotRFPulldownData(this.rfFullPersist);
    }
  }

}
