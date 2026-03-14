import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  const currentPath = router.url && router.url !== '/' ? router.url : '/dashboard';
  await auth.loginWithRedirect(currentPath);
  return false;
};
