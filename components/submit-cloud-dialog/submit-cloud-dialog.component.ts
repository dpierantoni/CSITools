import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as Papa from 'papaparse';

import {partsDefList} from '../../external-data/part-definition-list'
import {inputDisplayNames} from '../../external-data/batch-parameter-mapping'

@Component({
  selector: 'app-submit-cloud-dialog',
  templateUrl: './submit-cloud-dialog.component.html',
  styleUrls: ['./submit-cloud-dialog.component.css']
})
export class SubmitCloudDialogComponent implements OnInit {

  totalWeight:number = 0;
  swaybarPreload:number = 0;
  uniqueValueList: any;
  newChannelsDict:any = [];
  i:number = 0;
  j:number = 0;
  submitEnabled:boolean = true;

  constructor(public dialogRef: MatDialogRef<SubmitCloudDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { 
      this.uniqueValueList = this.data.dialogValsList;
      this.newChannelsDict = this.data.newChannelsDict;
      let test = 'test'
    }

  ngOnInit(): void {
   
  }

  onSubmit(){
    let dictTest = this.newChannelsDict
    this.dialogRef.close({data: this.newChannelsDict});
  }
  
  onCancel(): void {
    this.dialogRef.close({data: null});
  }

  onclick(i:any, j:any){
    this.i = i;
    this.j = j;
  }

  public addCSVData(files: any) {
    this.uniqueValueList[this.i].isLoaded[this.j] = true;
    let file = files.target.files[0]
    if (file) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (result) => {
          let csvdata = result.data;
          let csvDict: any = {};
          csvdata.forEach((item:any) => {
            let key:any = item[0];
            csvDict[key] = item[1];
          })
          this.addPartData(csvDict, this.j, this.i)
          }
        });
    } else {
      alert('Problem loading CSV file');
    }
  }

  setTotalWeightValue(i:number){
    this.i = i;
    this.uniqueValueList[this.i].isLoaded.forEach((value:any, index:number) => {
      this.uniqueValueList[this.i].isLoaded[index] = true;
    });
    Object.keys(this.newChannelsDict['NoseWeight']).forEach(key => {
      let noseNumber:number = +key * .01 * this.totalWeight;
      let unitsConvertNoseNumber = noseNumber / 2.2045;
      this.newChannelsDict['NoseWeight'][key] =unitsConvertNoseNumber.toFixed(2);
    });
    console.log(this.newChannelsDict)
    this.setEnabled();
  }

  setPreloadValue(i:number){
    this.i = i;
    this.uniqueValueList[this.i].isLoaded.forEach((value:any, index:number) => {
      this.uniqueValueList[this.i].isLoaded[index] = true;
    });
    Object.keys(this.newChannelsDict['CrossHookedDec']).forEach(key => {
      this.newChannelsDict['CrossHookedDec'][key] = +this.newChannelsDict['CrossHookedDec'][key] + this.swaybarPreload;
    });
    Object.keys(this.newChannelsDict['CrossUnhookedDec']).forEach(key => {
      this.newChannelsDict['CrossUnhookedDec'][key] = +this.newChannelsDict['CrossUnhookedDec'][key];
    });
    this.setEnabled();
    
  }

  setEnabled(){
    let enabledList: any[] = [];
    this.uniqueValueList.forEach((element:any) => {
      element.isLoaded.forEach((value:any) => {
        if (value === true) {
          let pass = 'pass';
        } else {
          enabledList.push(value);
        }
      });
    });
    if (enabledList.length === 0) {
      this.submitEnabled = false;
    }
  }

  addPartData(csvDict:any, j:number, i:number) {
    let origChannel = this.uniqueValueList[i].channel;
    let displayValue = this.uniqueValueList[i].displayValsList[j];
    let channelList = partsDefList[origChannel].channels;
    channelList.forEach((displayChannel:any) => { // assign a dict with the key as displayed values (DE Values) and part values
      let paramMapObj = inputDisplayNames[displayChannel];
      let value = csvDict[paramMapObj.WorkflowName];
      if (displayChannel !== 'SpringStopRR_Spline' || displayChannel !== 'InstalledSpringLF' || displayChannel !== 'InstalledSpringRF'){
        let scaleValue = (+value * +paramMapObj.Scale).toFixed(3).toString();
        this.newChannelsDict[displayChannel][displayValue] = scaleValue;
      }
      if (displayChannel === 'SpringStopRR_Spline' || displayChannel === 'InstalledSpringLF' || displayChannel === 'InstalledSpringRF'){
        this.newChannelsDict[displayChannel][displayValue] = value;
      }
    });
    this.setEnabled();
  }
}
