import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { SubmitDialogComponent } from '../submit-dialog/submit-dialog.component';
import { SubmitCloudDialogComponent } from '../submit-cloud-dialog/submit-cloud-dialog.component';
import * as _ from 'lodash';
import * as Papa from 'papaparse';
import { ExportToCsv } from 'export-to-csv';
import { cloneDeep, initial, update } from 'lodash';
import {partsDefList} from '../../external-data/part-definition-list'
import { inputDisplayNames } from '../../external-data/batch-parameter-mapping'
import {ExportService} from '../../services/export-service.service';

@Component({
  selector: 'batch-creation',
  templateUrl: './batch-creation.component.html',
  styleUrls: ['./batch-creation.component.css']
})


export class BatchCreationComponent implements OnInit {
  
  cloudBatchIndexDict:any = {};
  cloudBatchFactorList:string[] = [];
  cloudBatchIndexList:number[] = [];
  batchMatrix: any[] = [];
  batchMatrixCloud: any[] = [];
  batchDict: any = {};
  batchType:string = 'desktop';
  designMatrix: any[] = [];
  excludedKeyStrings: string[] = ['', 'Response 1']
  excludedValueStrings: string[] = ['Run', 'R1']
  exportIsDisabled:boolean = true;
  inputs: string[] = [];
  inputFactorList: string[] = [];
  inputDict: any = {};

  functionInputFactors: any[] = ['JackscrewAdjustLR', 'JackscrewAdjustRR', 'SpringStopLF_Spline', 'SpringStopRF_Spline'];
  dialogInputFactors: string[] = ['LFFARBArm', 'RFFARBArm', 'LFUCASlugs', 'RFUCASlugs', 'LFUCA', 'RFUCA', 'CrossUnhookedPer', 'NoseWeight']
  cloudDialogInputFactors: string[] = 
  [
    'LFFARBArm',
    'RFFARBArm',
    'LFUCASlugs',
    'RFUCASlugs',
    'LFUCA',
    'RFUCA',
    'SpringStopRR',
    'SpringStopGapLF',
    'SpringStopGapRF',
    'CrossUnhookedPer',
    'NoseWeight'
    ]
  displayedColumns: string[] = ['attribute', 'values'];
  

  constructor(public dialog: MatDialog, private clipboard: Clipboard, private exportService:ExportService) { 
    
  }

  ngOnInit(): void {
  }

  public async resetCloudVariables(){
    this.cloudBatchIndexDict = {};
    this.cloudBatchFactorList = [];
    this.cloudBatchIndexList = [];
    this.batchMatrixCloud = [];
  }
  
  public async processInputsCloud(data:any[]){
    await this.resetCloudVariables();
    // create headers and displayed columns from 360 output
    let headers = data[0];
    let headersKeys = Object.keys(headers);
    this.displayedColumns = [];
    headersKeys.forEach((item, index:number) => {
      let blank = ' ';
      if (item.indexOf(blank) !== -1){
        let title = item.substr(0, item.indexOf(blank));
        if (title === 'Factor'){
          let displayName = data[0][item].substring(2);
          if (displayName === 'SpringStopLF_Spline_Rate'){displayName = 'SpringStopLF_Spline'}
          if (displayName === 'SpringStopRF_Spline_Rate'){displayName = 'SpringStopRF_Spline'}
          this.displayedColumns.push(displayName); // Add displayed columns  {0: 'SpringLR_Rate'}  index: displayName
          this.cloudBatchIndexDict[item] = displayName; // {Factor 1: 'SpringLR_Rate'} DE Name: displayName
          this.cloudBatchFactorList.push(item);
          this.cloudBatchIndexList.push(index);
        }
      }
    });
        
    //change keys of data to display name and only pick factor columns
    let indexedData: any[] = [];
    for (let i = 2; i <= data.length - 1; i++){
      let item = data[i];
      let obj:any = {};
      this.cloudBatchFactorList.forEach((element:any) => {
        let key = this.cloudBatchIndexDict[element];
        let value = item[element]
        obj[key] = value;
      });
      indexedData.push(obj);
    };
    
    this.batchMatrixCloud = indexedData;
  } 

 public async processInputs(data:any[]) {
    let factorObj = data[0];
    this.inputFactorList = [];
    //make dictionary of Factor Labels ie {Factor1:'LRSpring'}
    Object.keys(factorObj).forEach((val:any) => {
      if (!this.excludedKeyStrings.includes(val)) {
        this.inputDict[val] = factorObj[val].substring(2);
        this.inputFactorList.push(factorObj[val].substring(2));
      }
    });
    // add attributes to the batch matrix
    Object.values(factorObj).forEach((val:any) => {
      if (!this.excludedValueStrings.includes(val)) {
        this.inputs.push(val.substring(2));
      };
    });
    this.inputs.forEach((item) => {
      let batchMatrixObj = {
        attribute: item,
        baselineValue: null,
        values: [],
        unit: null
      }
      this.batchDict[item] = (batchMatrixObj);
    });
  }
    
  public async processValues(data:any[]) {
    let designMatrix = data.slice(2)
    // delete Run and Response column from design matrix
    designMatrix.forEach((element) => {
      delete element[''];
      delete element['Response 1']
    });
    
    //loop through design matrix and assign values to the batchDict
    designMatrix.forEach((element) => {
      Object.keys(element).forEach((designKey:any) => {
        let value = element[designKey];
        let inputKey = this.inputDict[designKey];
        this.batchDict[inputKey]['values'].push(value)
      });
    });
  }

  dialogValues(){
    let commonValsList: any[] = [];
    //find common values in dialogInputFactors and create list of object that has initial 1,2,3 ect values in them
    let commonVals = _.intersection(this.dialogInputFactors, this.inputFactorList)
    if (commonVals.length > 0){
      commonVals.forEach((item) => {
        commonValsList.push(
          {
            channel: item,
            values: this.batchDict[item].values
          }
        )
      });
    
    // Get distinct values from each parameter requiring a part file
      let uniqueValueList: any = [];
      commonValsList.forEach((item) => {
        let uniqueVals:any = [...new Set(item.values)].sort();
        let isLoadedList:boolean[] = [];
        uniqueVals.forEach((value:any) =>{
          isLoadedList.push(false)
        });
        uniqueValueList.push(
          {
            channel:item.channel,
            values: uniqueVals,
            isLoaded: isLoadedList
          }
        )
      });

      // get new channels for required parts with original 1,2,3 values
      let newChannelsDict:any = {}
      commonValsList.forEach((element: { channel: string, values: string[] }) => {
        let newChannels = partsDefList[element.channel].channels;
        newChannels.forEach((channel: any) => {
          newChannelsDict[channel] = 
            {
              attribute: channel,
              baselineValue: null,
              values: element.values,
              unit: null
            }
        });
      });
      this.openDialog(uniqueValueList, newChannelsDict)
    }

    //Test and write all values not in commonVals
    Object.keys(this.batchDict).forEach((key:any) => {
      if (!this.dialogInputFactors.includes(key)) {
        this.batchMatrix.push(this.batchDict[key])
      } 
    });

    if (commonVals.length === 0 && this.batchMatrix.length > 0){
      this.setStringValues();
    }
  }

  setStringValues(){
    this.batchMatrix.forEach((item) => {
      let values = item.values;
      let string = ''
      values.forEach((value:any, index:number) => {
        if (index === 0){
          string = string + value.toString();
        } else {
          string = string + ', ' + value.toString();
        }
      });
      item.values = string;
    })
    this.batchMatrix = cloneDeep(this.batchMatrix);
    if (this.batchMatrix.length > 0) {
      this.exportIsDisabled = false;
    }
  }

  openDialog(uniqueValueList: any, newChannelsDict: any ): void {
    
    const dialogRef = this.dialog.open(SubmitDialogComponent, {
      width: '600px',
      data: {uniqueValueList: uniqueValueList, 
          newChannelsDict: newChannelsDict
        }
      });

    dialogRef.afterClosed().subscribe(result => {
      if (result === undefined) {
        alert('Dialog Closed No Files Loaded')
      } else {
        let returnData = result.data;
        returnData.forEach((item:any[]) => {
          this.batchMatrix.push(item)
        })
      }
      this.setStringValues();
    });
  }

  public async openCloudDialog(){
    
    let factors = Object.values(this.cloudBatchIndexDict) // get dialog values  ( ie LFSBARM, LFUCA, ect)
    let dialogVals:any = _.intersection(factors, this.cloudDialogInputFactors) // get common values that need parts def
    let dialogValsList:any[] = []; // create list is obj {channel: LFSBARM, values: []}
    /// create list of parts requiring selection to populate btn color and btn display values
    if (dialogVals.length > 0){
      dialogVals.forEach((key:string) => {
          let list:number[] = [];
          this.batchMatrixCloud.forEach((item:any) =>{
            let value = item[key]
            list.push(value)
          });
          let displayVals:any = [...new Set(list)].sort();
          let isLoadedList:boolean[] = [];
          let uniqueValsDict:any = {};
          displayVals.forEach((value:string) =>{
            isLoadedList.push(false);
            uniqueValsDict[value.toString()] = value;
        });
        dialogValsList.push({channel: key, isLoaded: isLoadedList, displayValsList: displayVals, values: uniqueValsDict }); 
      });
    }
    
    // creates a list of obj that define part values
    let newChannelsDict:any = {}
    dialogValsList.forEach((element:any) => {
      let newChannels = partsDefList[element.channel].channels;
      newChannels.forEach((channel: any) => {
        let obj:any = {}
        let keysList = element.displayValsList;
        keysList.forEach((key:string) =>{
          obj[key] = key;
        })
        newChannelsDict[channel] = obj;
      });
    });
   
    
    const dialogRef = this.dialog.open(SubmitCloudDialogComponent, {
      width: '600px',
      data: 
        {
          dialogValsList: dialogValsList,
          newChannelsDict:newChannelsDict
        }
      });

    dialogRef.afterClosed().subscribe( async result => { 
      let excludedOrigKeys:string[] = ['SpringStopGapLF','SpringStopGapRF']
      if (result === undefined) {
        alert('Dialog Closed No Files Loaded')
      } else {
        let updatedBatchMatrixCloud:any[] = [];
                
        // get orig keys List to add to new obj row excluding values in dialogVals
        let origKeysList:string[] = Object.keys(this.batchMatrixCloud[0]);
        dialogVals.forEach((item:string) => {
          if (!excludedOrigKeys.includes(item)) {
            console.log(item);
            origKeysList.splice(origKeysList.indexOf(item), 1);
          }
        });
        
        // make new row and add orig keys and parts keys
        this.batchMatrixCloud.forEach((row:any) => {
          let newRow:any = {};
          origKeysList.forEach((element:any) => {
            newRow[element] = row[element];
          });
          dialogVals.forEach((origKey:string) => {
            let origValue:string = row[origKey];
            partsDefList[origKey].channels.forEach((newKey:string) => {
              newRow[newKey] = result.data[newKey][origValue];
            });
          });
          updatedBatchMatrixCloud.push(newRow);
        });
        this.displayedColumns = [];
        this.displayedColumns = Object.keys(updatedBatchMatrixCloud[0]);
        this.batchMatrixCloud = updatedBatchMatrixCloud;
      }
    });
  } 

  public async parseCloudParts(returnedData:any){
    let newValuesDict:any = {};
    returnedData.forEach((item:any) => {
      newValuesDict[item.attribute] = item.values;
    });
    return newValuesDict
  }

  public async processFunctions() {
    Object.keys(this.batchDict).forEach((batchKey:any) => {
      if (this.functionInputFactors.includes(batchKey)) {
        switch(batchKey) {
          case 'JackscrewAdjustLR':
            this.batchDict[batchKey]['values'] = this.jackscrewScale(this.batchDict[batchKey]['values']);
            break;
          case 'JackscrewAdjustRR':
            this.batchDict[batchKey]['values'] = this.jackscrewScale(this.batchDict[batchKey]['values']);
            break;
          case 'NoseWeightPer':
            this.batchDict[batchKey]['values'] = this.noseWeightScale(this.batchDict[batchKey]['values']);
            break;
        }
      }
    })
  }

  public async processFunctionsCloud() {
    let updatedData:any[] = [];
    Object.values(this.cloudBatchIndexDict).forEach((item:any) => {
      updatedData = [];
      if (this.functionInputFactors.includes(item)) {
        switch(item) {
          case 'JackscrewAdjustLR':
            this.batchMatrixCloud.forEach((row:any) => {
              let obj:any = row;
              obj[item] = ((obj[item] / 12) * -1).toFixed(3);
              updatedData.push(obj);
            });
            this.batchMatrixCloud = updatedData;
            break;
          case 'JackscrewAdjustRR':
            this.batchMatrixCloud.forEach((row:any) => {
              let obj:any = row;
              obj[item] = ((obj[item] / 12) * -1).toFixed(3);
              updatedData.push(obj);
            });
            this.batchMatrixCloud = updatedData;
            break;
          case 'SpringStopLF_Spline':
            this.batchMatrixCloud.forEach((row:any) => {
              let value = (row[item]);
              let updatedValue = (value * 4.44822).toString();
              let newValue = '0, 0; .0254,' + updatedValue + ';';
              row[item] = newValue;
            });
            break;
          case 'SpringStopRF_Spline':
          this.batchMatrixCloud.forEach((row:any) => {
            let value = (row[item]);
            let updatedValue = (value * 4.44822).toString();
            let newValue = '0, 0; .0254,' + updatedValue + ';';
            row[item] = newValue;
          });
          break;
        }
      }
    });
}

  public jackscrewScale(values: any[]) {
    let newValues: any[] = []
    values.forEach((number) => {
      let newNumber = ((number / 12) * -1).toFixed(3);
      newValues.push(newNumber);
    });
    return newValues
  }

  public noseWeightScale(values: any[]) {
    let newValues: any[] = []
    values.forEach((number) => {
      let newNumber = (number * .01).toFixed(4);
      newValues.push(newNumber);
    });
    return newValues
  }

  public  fileChangeListener(files: any) {
    let file = files.target.files[0];
    if (file) {
        this.batchMatrix = [];
        this.inputs = [];
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          if (this.batchType === 'desktop'){
            await this.processInputs(result.data); // get input factors in a list and add to batchmatrix as row
            await this.processValues(result.data); // get values and enter into array in batchmatrix
            await this.processFunctions(); // run functions on channels requiring addition channel defs ie. FARB ARMS, Jackscrew ect
            this.dialogValues(); // Dialog to get needed parts definitions
          }
          if (this.batchType === 'cloud'){
            let data:any[]
            await this.processInputsCloud(result.data); // put data in correct columns/rows with display names
            await this.processFunctionsCloud(); // run functions on channels requiring addition channel defs ie. Jackscrew, spring spline rates ect
            this.openCloudDialog();
          }
        }
          });
    } else {
      alert('Problem loading CSV file');
    }
  }

  exportBatchMatrix(){
    let excludedUnitConversions = ['SpringStopLF_Spline', 'SpringStopRF_Spline', 'SpringStopRR_Spline', 'InstalledSpringLF', 'InstalledSpringRF']
    if (this.batchType === 'desktop'){
      const options = { 
        fieldSeparator: ',',
        filename: 'PM Batch Matrix',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: false, 
        showTitle: false,
        title: 'My Awesome CSV',
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true,
        // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
      };
      const csvExporter = new ExportToCsv(options);
      csvExporter.generateCsv(this.batchMatrix);
    }

    if (this.batchType === 'cloud'){
      let updatedData:any[] = [];
      let headers = Object.keys(this.batchMatrixCloud[0]);
      let headerObj:any = {'Run #': ' '}
      
      for (let i = 0; i < headers.length - 1; i++){
        let key = headers[i]
        let listItem = '';
        if (i === 0) {listItem = 'Vehicle'}
        headerObj[key] = listItem;
      }

      updatedData.push(headerObj);
      let fakeHeaderRow:any = {'Run #': 'Run #'};
      headers.forEach((item) => {
        let key = item;
        let value = inputDisplayNames[item].WorkflowName;;
        fakeHeaderRow[key] = value;
      })
      
      updatedData.push(fakeHeaderRow);
      let count:number = 1;
      for (let i = 0; i <= this.batchMatrixCloud.length -1; i++){
        let newObj:any = {'Run #': count};
        let objList = Object.keys(this.batchMatrixCloud[i]);
        objList.forEach((key) => {
          let newKey = inputDisplayNames[key].WorkflowName;
          let convertedVal;
          if (excludedUnitConversions.includes(newKey)){convertedVal = this.batchMatrixCloud[i][key]} 
          else{
            convertedVal = this.batchMatrixCloud[i][key] * (1 / inputDisplayNames[key].Scale);
          }
          newObj[key] = convertedVal;
        });
        updatedData.push(newObj);
        count = count + 1;
      }
      this.exportService.exportAsExcelFile(updatedData, 'cloudBatchExport');
    }
  }

  copyToClipBoard() {
    let batchMatrix = this.batchMatrix;
    let string = '';
    batchMatrix.forEach((item) => {
      let subString = item.attribute.toString() + '\t' + ' ' + '\t' + item.values + '\r';
      string = string + subString;
    });
    this.clipboard.copy(string);
  }

  public radialClick(){
    setTimeout(() => {
      if (this.batchType === 'desktop'){
        this.displayedColumns= ['attribute', 'values'];
      } else {
        this.displayedColumns= [];
      }
      this.resetCloudVariables();
    }, 100);
  }
}

