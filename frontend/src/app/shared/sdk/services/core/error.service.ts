/* tslint:disable */
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { LoopBackAuth } from './auth.service';
import { Observable, throwError } from 'rxjs';

/**
 * Default error handler
 */
@Injectable()
export class ErrorHandler {
  constructor(
    @Inject(LoopBackAuth) protected auth: LoopBackAuth
  ) {
  };

  public handleError(errorResponse: HttpErrorResponse): Observable<never> {
    if (errorResponse.status == 401) {
      console.warn("user token is expired.");
      this.auth.clear();
    }
    return throwError(errorResponse.error.error || 'Server error');
  }
}
