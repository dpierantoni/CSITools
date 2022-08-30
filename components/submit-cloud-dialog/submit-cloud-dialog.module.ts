import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button'
import {MatDialogModule } from '@angular/material/dialog'
import {MatFormFieldModule } from '@angular/material/form-field'
import {MatInputModule } from '@angular/material/input'
  
  
import { SubmitCloudDialogComponent } from './submit-cloud-dialog.component';

@NgModule({
  declarations: [SubmitCloudDialogComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  exports: [
    SubmitCloudDialogComponent
  ]
})
export class SubmitCloudDialogModule { }
