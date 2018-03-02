import {Component, OnDestroy, OnInit} from '@angular/core';
import {AccessToken, AppSetting, User} from '../../../shared/sdk/models';
import {UserApi, AppSettingApi} from '../../../shared/sdk/services';
import {Router} from '@angular/router';
import * as _ from 'lodash';

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit, OnDestroy {

  private user: User = new User();
  private errorMessage = '';

  private setting: AppSetting;
  private settings: AppSetting[] = [];

  private canUserRegister: boolean = false;

  constructor(private userApi: UserApi,
              private appSettingApi: AppSettingApi,
              private router: Router) {
  }

  onLogin(): void {
    this.user.email = this.user.email.toLocaleLowerCase();
    this.userApi.login(this.user).subscribe(
      (token: AccessToken) => {
        // console.log('New token: ', token);

        // Update the last login date
        this.userApi.patchAttributes(
          token.userId,
          {
            'lastLogin': new Date()
          }
        ).subscribe();
        // Redirect to the /dashboard
        this.router.navigate(['/']);
      }, err => {
        // console.log(err);
        if (err.statusCode === 401) {
          this.errorMessage = 'Invalid username or password.';
        } else if (err.statusCode === 500) {
          this.errorMessage = 'Internal server error';
        } else {
          this.errorMessage = err.message;
        }
      });
  }

  ngOnInit(): void {
    console.log('Login: ngOnInit');
    this.getAppSettings()
  }

  getAppSettings(): void {
    this.appSettingApi.find().subscribe((settings: AppSetting[])=> {
      this.settings = settings;
      let temp = _.filter(settings, {key: 'canUserRegister'});
      this.canUserRegister = temp[0].value;

      //console.log(this.canUserRegister);
    });
  }

  ngOnDestroy(): void {
    console.log('Login: ngOnDestroy');
  }

}
