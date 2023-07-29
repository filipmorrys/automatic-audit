
import { KeycloakService } from "keycloak-angular";
import { environment } from "../environments/environments";

export function initializeKeycloak(keycloak: KeycloakService) {
    console.log("initializeKeycloak");
    return () =>
        keycloak.init({
            config: {
                url: environment.authUrl + '/auth',
                realm: 'RealmSecurity',
                clientId: 'frontend-security',
            },
            initOptions: {
                onLoad: 'check-sso',
                silentCheckSsoRedirectUri:
                    window.location.origin + '/assets/silent-check-sso.html'
            },
            shouldAddToken: (request) => {
                const { method, url } = request;

                const isGetRequest = 'GET' === method.toUpperCase();
                const acceptablePaths = ['/assets', '/clients/public'];
                const isAcceptablePathMatch = acceptablePaths.some((path) =>
                    url.includes(path)
                );

                return !(isGetRequest && isAcceptablePathMatch);
            }
        });
}