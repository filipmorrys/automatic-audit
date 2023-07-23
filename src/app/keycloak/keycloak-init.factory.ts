
import { KeycloakService } from "keycloak-angular";

export function initializeKeycloak(keycloak: KeycloakService) {
    console.log("initializeKeycloak");
    return () =>
        keycloak.init({
            config: {
                url: 'https://keycloak20-test.apps.k8s.mova.indra.es' + '/auth',
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