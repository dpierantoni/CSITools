import { Component, Injectable } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
  MatSnackBarRef
} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) { }

  snackBarConfig: MatSnackBarConfig | undefined;
  snackBarRef: MatSnackBarRef<any> | undefined;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  snackBarAutoHide = '2000';

  openSnackBar(message:string) {
    this.snackBarConfig = new MatSnackBarConfig();
    // this.snackBarConfig.horizontalPosition = this.horizontalPosition;
    // this.snackBarConfig.verticalPosition = this.verticalPosition;
    this.snackBarConfig.duration = parseInt(this.snackBarAutoHide, 0);
    // this.snackBarConfig.panelClass = 'custom-snackbar';
    this.snackBarRef = this.snackBar.open(message, '', this.snackBarConfig);
}
}

