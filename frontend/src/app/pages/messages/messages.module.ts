import {NgModule} from '@angular/core';
import {MessagesComponent} from './messages.component';
import {MessagesRoutingModule} from './messages-routing.module';
import {CommonModule} from '@angular/common';
import {DataFilterPipe} from './datafilterpipe';
import {FormsModule} from '@angular/forms';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {AgmCoreModule} from '@agm/core';
import {ClickCopyDirective} from './click-copy.directive';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    MessagesRoutingModule,
    CommonModule,
    FormsModule,
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    AgmCoreModule,
    TranslateModule.forChild({
      extend: true
    }),
  ],
  declarations: [
    MessagesComponent,
    DataFilterPipe,
    ClickCopyDirective
  ]
})
export class MessagesModule {
}
