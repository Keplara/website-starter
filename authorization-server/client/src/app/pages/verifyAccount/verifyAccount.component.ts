import { Component } from '@angular/core';

@Component({
    selector: 'app-verify-account',
    templateUrl: './verifyAccount.component.html',
    styleUrls: ['./verifyAccount.component.scss']
})
export class VerifyAccountComponent {
    private timer: any;

    ngOnInit(): void {
        this.startCloseTabTimer();
      }
    
      /**
       * Starts a timer to close the tab after 1 minute
       */
      startCloseTabTimer(): void {
        this.timer = setTimeout(() => {
          this.closeTab();
        }, 60000); // 1 minute = 60,000 milliseconds
      }
    
      /**
       * Closes the current browser tab
       */
      closeTab(): void {
        window.close();
      }
    

 }