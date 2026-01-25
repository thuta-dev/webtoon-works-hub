import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// These would be stored in environment/secrets in production
const CLIENT_ID = ''; // User needs to add their Google Client ID
const API_KEY = ''; // User needs to add their Google API Key
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

interface GoogleDriveHook {
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  uploadFiles: (
    files: { name: string; dataUrl: string }[],
    storyName: string,
    chapterNumber: string,
    tiktokMode: boolean,
    onProgress?: (progress: number) => void
  ) => Promise<void>;
}

export function useGoogleDrive(): GoogleDriveHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient | null>(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);

  // Initialize GAPI
  const initializeGapiClient = useCallback(async () => {
    if (!API_KEY) {
      console.log('Google API Key not configured');
      return;
    }
    
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setGapiInited(true);
  }, []);

  // Load the GAPI and GIS libraries
  useEffect(() => {
    if (!CLIENT_ID || !API_KEY) {
      console.log('Google Drive API not configured. Please add CLIENT_ID and API_KEY.');
      return;
    }

    // Load GAPI
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      window.gapi.load('client', initializeGapiClient);
    };
    document.body.appendChild(gapiScript);

    // Load GIS
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: google.accounts.oauth2.TokenResponse) => {
          if (response.error) {
            console.error('OAuth error:', response);
            return;
          }
          setIsConnected(true);
          toast({
            title: 'Connected to Google Drive',
            description: 'You can now export images directly to Drive.',
          });
        },
      });
      setTokenClient(client);
      setGisInited(true);
    };
    document.body.appendChild(gisScript);

    return () => {
      document.body.removeChild(gapiScript);
      document.body.removeChild(gisScript);
    };
  }, [initializeGapiClient]);

  const connect = useCallback(async () => {
    if (!CLIENT_ID || !API_KEY) {
      toast({
        title: 'Google Drive Not Configured',
        description: 'Please configure Google API credentials to use this feature.',
        variant: 'destructive',
      });
      return;
    }

    if (!tokenClient) {
      toast({
        title: 'Loading...',
        description: 'Please wait for Google services to initialize.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Request an access token
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Google Drive.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tokenClient]);

  const disconnect = useCallback(() => {
    const token = window.gapi?.client?.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken(null);
        setIsConnected(false);
        toast({
          title: 'Disconnected',
          description: 'Google Drive has been disconnected.',
        });
      });
    }
  }, []);

  // Find or create a folder
  const findOrCreateFolder = async (name: string, parentId?: string): Promise<string> => {
    // Search for existing folder
    let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const searchResponse = await window.gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = searchResponse.result.files;
    if (files && files.length > 0) {
      return files[0].id!;
    }

    // Create new folder
    const fileMetadata: gapi.client.drive.File = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const createResponse = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    return createResponse.result.id!;
  };

  // Upload a single file
  const uploadFile = async (
    name: string,
    dataUrl: string,
    folderId: string
  ): Promise<void> => {
    const base64Data = dataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const metadata = {
      name: name,
      mimeType: 'image/png',
      parents: [folderId],
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', blob);

    const token = window.gapi.client.getToken().access_token;
    
    await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: new Headers({ Authorization: 'Bearer ' + token }),
        body: form,
      }
    );
  };

  const uploadFiles = useCallback(
    async (
      files: { name: string; dataUrl: string }[],
      storyName: string,
      chapterNumber: string,
      tiktokMode: boolean,
      onProgress?: (progress: number) => void
    ) => {
      if (!isConnected) {
        toast({
          title: 'Not Connected',
          description: 'Please connect to Google Drive first.',
          variant: 'destructive',
        });
        return;
      }

      if (!storyName || !chapterNumber) {
        toast({
          title: 'Missing Information',
          description: 'Please select a story and enter a chapter number.',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      
      try {
        // Find or create story folder
        const storyFolderId = await findOrCreateFolder(storyName);
        
        // Find or create chapter folder
        const chapterFolderId = await findOrCreateFolder(`Chapter ${chapterNumber}`, storyFolderId);

        if (tiktokMode) {
          // Split into groups of 35
          const BATCH_SIZE = 35;
          const totalParts = Math.ceil(files.length / BATCH_SIZE);
          
          for (let part = 0; part < totalParts; part++) {
            // Create part folder
            const partFolderId = await findOrCreateFolder(`Part ${part + 1}`, chapterFolderId);
            
            const startIdx = part * BATCH_SIZE;
            const endIdx = Math.min(startIdx + BATCH_SIZE, files.length);
            const batchFiles = files.slice(startIdx, endIdx);
            
            // Upload files in this batch with sequential naming
            for (let i = 0; i < batchFiles.length; i++) {
              const sequentialName = `${String(i + 1).padStart(2, '0')}.png`;
              await uploadFile(sequentialName, batchFiles[i].dataUrl, partFolderId);
              
              const totalProgress = ((startIdx + i + 1) / files.length) * 100;
              onProgress?.(totalProgress);
            }
          }
        } else {
          // Upload all files directly to chapter folder
          for (let i = 0; i < files.length; i++) {
            const sequentialName = `${String(i + 1).padStart(2, '0')}.png`;
            await uploadFile(sequentialName, files[i].dataUrl, chapterFolderId);
            onProgress?.(((i + 1) / files.length) * 100);
          }
        }

        toast({
          title: 'Export Complete',
          description: `Successfully uploaded ${files.length} images to Google Drive.`,
        });
      } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        toast({
          title: 'Export Failed',
          description: 'Failed to upload images to Google Drive.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected]
  );

  return {
    isConnected,
    isLoading,
    connect,
    disconnect,
    uploadFiles,
  };
}
