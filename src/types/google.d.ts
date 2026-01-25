// Type declarations for Google APIs

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(options?: { prompt?: string }): void;
      }

      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
      }

      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;

      function revoke(token: string, callback?: () => void): void;
    }
  }
}

declare namespace gapi {
  namespace client {
    function init(config: {
      apiKey: string;
      discoveryDocs: string[];
    }): Promise<void>;

    function getToken(): { access_token: string } | null;
    function setToken(token: null): void;

    namespace drive {
      interface File {
        id?: string;
        name?: string;
        mimeType?: string;
        parents?: string[];
      }

      namespace files {
        function list(params: {
          q: string;
          fields: string;
          spaces: string;
        }): Promise<{
          result: {
            files?: File[];
          };
        }>;

        function create(params: {
          resource: File;
          fields: string;
        }): Promise<{
          result: File;
        }>;
      }
    }
  }

  function load(api: string, callback: () => void): void;
}

interface Window {
  gapi: typeof gapi;
  google: typeof google;
}
