import {NgModule} from '@angular/core';
import {AdminComponent} from './admin.component';
import {AdminRoutingModule} from './admin-routing.module';
import {CommonModule} from '@angular/common';
import {ToastrModule} from 'ngx-toastr';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {MomentModule} from 'ngx-moment';
import {FormsModule} from '@angular/forms';
import {DataTablesModule} from 'angular-datatables';
import {TranslateModule} from '@ngx-translate/core';


@NgModule({
  imports: [
    AdminRoutingModule,
    CommonModule,
    MomentModule,
    FormsModule,
    ToastrModule.forRoot(),
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    DataTablesModule,
    TranslateModule.forChild({
      extend: true
    }),
  ],
  declarations: [
    AdminComponent
  ]
})
export class AdminModule {
}
