import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MomentModule} from 'ngx-moment';
import {FormsModule} from '@angular/forms';
import {CategoriesComponent} from './categories.component';
import {CategoriesRoutingModule} from './categories-routing.module';
import {ToastrModule} from 'ngx-toastr';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ClickCopyDirective} from './click-copy.directive';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown';
import {LaddaModule} from 'angular2-ladda';
import {HttpClientModule} from '@angular/common/http';
import {DataTablesModule} from 'angular-datatables';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    CategoriesRoutingModule,
    CommonModule,
    MomentModule,
    FormsModule,
    DataTablesModule,
    ToastrModule.forRoot(),
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    AngularMultiSelectModule,
    LaddaModule,
    HttpClientModule,
    TranslateModule.forChild({
      extend: true
    }),
  ],
  declarations: [
    CategoriesComponent,
    ClickCopyDirective
  ]
})
export class CategoriesModule {
}
