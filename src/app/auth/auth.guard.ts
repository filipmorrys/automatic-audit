import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';



export class AuthGuard {

  constructor(private authService: AuthService, private tokenService: TokenService) { }


}